<?php
/**
 * Send Group Message API
 * POST /messages/send-group.php
 * 
 * Required: conversation_id, sender_id, content
 */

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowedOrigins = ['http://localhost:3000', 'http://localhost:3001'];
$frontendUrl = getenv('FRONTEND_URL');
if ($frontendUrl) $allowedOrigins[] = $frontendUrl;

if (in_array($origin, $allowedOrigins) || preg_match('/\.railway\.app$|\.vercel\.app$/', $origin)) {
    header("Access-Control-Allow-Origin: $origin");
} else {
    header("Access-Control-Allow-Origin: http://localhost:3000");
}
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit();
}

$data = json_decode(file_get_contents('php://input'), true);

$conversationId = $data['conversation_id'] ?? null;
$senderId = $data['sender_id'] ?? null;
$content = $data['content'] ?? null;
$messageType = $data['message_type'] ?? 'text';

if (!$conversationId || !$senderId || !$content) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'conversation_id, sender_id, and content are required']);
    exit();
}

try {
    $pdo = getDBConnection();
    
    // Verify sender is participant
    $stmt = $pdo->prepare("
        SELECT id FROM conversation_participants 
        WHERE conversation_id = ? AND user_id = ?
    ");
    $stmt->execute([$conversationId, $senderId]);
    if (!$stmt->fetch()) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Not a participant of this conversation']);
        exit();
    }
    
    // Insert message
    $stmt = $pdo->prepare("
        INSERT INTO group_messages (conversation_id, sender_id, content, message_type)
        VALUES (?, ?, ?, ?)
    ");
    $stmt->execute([$conversationId, $senderId, $content, $messageType]);
    $messageId = $pdo->lastInsertId();
    
    // Update conversation's updated_at
    $stmt = $pdo->prepare("UPDATE conversations SET updated_at = NOW() WHERE id = ?");
    $stmt->execute([$conversationId]);
    
    // Update sender's last_read_at
    $stmt = $pdo->prepare("
        UPDATE conversation_participants 
        SET last_read_at = NOW() 
        WHERE conversation_id = ? AND user_id = ?
    ");
    $stmt->execute([$conversationId, $senderId]);
    
    // Get sender info
    $stmt = $pdo->prepare("
        SELECT u.name, u.role, COALESCE(v.business_name, u.name) as display_name
        FROM users u
        LEFT JOIN vendors v ON v.user_id = u.id
        WHERE u.id = ?
    ");
    $stmt->execute([$senderId]);
    $sender = $stmt->fetch(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'data' => [
            'id' => (int)$messageId,
            'conversation_id' => (int)$conversationId,
            'sender_id' => (int)$senderId,
            'sender_name' => $sender['name'],
            'sender_display_name' => $sender['display_name'],
            'content' => $content,
            'message_type' => $messageType,
            'created_at' => date('Y-m-d H:i:s')
        ]
    ]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
