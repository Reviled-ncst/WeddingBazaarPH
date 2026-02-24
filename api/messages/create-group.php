<?php
/**
 * Create Group Conversation API
 * POST /messages/create-group.php
 * 
 * Required: name, participant_ids (array)
 * Optional: description
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

$createdBy = $data['created_by'] ?? null;
$name = $data['name'] ?? null;
$participantIds = $data['participant_ids'] ?? [];

if (!$createdBy || !$name || empty($participantIds)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'created_by, name, and participant_ids are required']);
    exit();
}

// Ensure creator is in participants
if (!in_array($createdBy, $participantIds)) {
    $participantIds[] = $createdBy;
}

try {
    $pdo = getDBConnection();
    $pdo->beginTransaction();
    
    // Create the conversation
    $stmt = $pdo->prepare("
        INSERT INTO conversations (name, type, created_by)
        VALUES (?, 'group', ?)
    ");
    $stmt->execute([$name, $createdBy]);
    $conversationId = $pdo->lastInsertId();
    
    // Add participants
    $stmt = $pdo->prepare("
        INSERT INTO conversation_participants (conversation_id, user_id, is_admin)
        VALUES (?, ?, ?)
    ");
    
    foreach ($participantIds as $userId) {
        $isAdmin = ($userId == $createdBy) ? 1 : 0;
        $stmt->execute([$conversationId, $userId, $isAdmin]);
    }
    
    // Add system message
    $stmt = $pdo->prepare("
        INSERT INTO group_messages (conversation_id, sender_id, content, message_type)
        VALUES (?, ?, ?, 'system')
    ");
    $stmt->execute([$conversationId, $createdBy, 'Group created']);
    
    $pdo->commit();
    
    // Fetch participant details
    $placeholders = implode(',', array_fill(0, count($participantIds), '?'));
    $stmt = $pdo->prepare("
        SELECT id, name, role FROM users WHERE id IN ($placeholders)
    ");
    $stmt->execute($participantIds);
    $participants = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'data' => [
            'id' => (int)$conversationId,
            'name' => $name,
            'type' => 'group',
            'participants' => $participants,
            'created_at' => date('Y-m-d H:i:s')
        ]
    ]);
    
} catch (PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
