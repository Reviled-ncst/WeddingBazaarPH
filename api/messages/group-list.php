<?php
/**
 * List Group Messages API
 * GET /messages/group-list.php?conversation_id=X&user_id=Y
 * 
 * Returns all messages in a group conversation
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
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit();
}

$conversationId = $_GET['conversation_id'] ?? null;
$userId = $_GET['user_id'] ?? null;

if (!$conversationId || !$userId) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'conversation_id and user_id required']);
    exit();
}

try {
    $pdo = getDBConnection();
    
    // Verify user is participant
    $stmt = $pdo->prepare("
        SELECT id FROM conversation_participants 
        WHERE conversation_id = ? AND user_id = ?
    ");
    $stmt->execute([$conversationId, $userId]);
    if (!$stmt->fetch()) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Not a participant of this conversation']);
        exit();
    }
    
    // Get messages
    $stmt = $pdo->prepare("
        SELECT 
            gm.id,
            gm.conversation_id,
            gm.sender_id,
            gm.content,
            gm.message_type,
            gm.created_at,
            u.name as sender_name,
            u.role as sender_role,
            COALESCE(v.business_name, u.name) as sender_display_name
        FROM group_messages gm
        JOIN users u ON u.id = gm.sender_id
        LEFT JOIN vendors v ON v.user_id = u.id
        WHERE gm.conversation_id = ?
        ORDER BY gm.created_at ASC
    ");
    $stmt->execute([$conversationId]);
    $messages = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Update last_read_at for the user
    $stmt = $pdo->prepare("
        UPDATE conversation_participants 
        SET last_read_at = NOW() 
        WHERE conversation_id = ? AND user_id = ?
    ");
    $stmt->execute([$conversationId, $userId]);
    
    echo json_encode([
        'success' => true,
        'data' => $messages
    ]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
