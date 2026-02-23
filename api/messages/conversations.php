<?php
/**
 * List Conversations API
 * GET /messages/conversations.php?user_id=X
 * 
 * Returns list of conversations with last message
 */

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, ['http://localhost:3000', 'http://localhost:3001'])) {
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

$userId = $_GET['user_id'] ?? null;

if (!$userId) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'user_id required']);
    exit();
}

try {
    $pdo = getDBConnection();
    
    // Get unique conversations with the other party's info and last message
    $stmt = $pdo->prepare("
        SELECT 
            CASE 
                WHEN m.sender_id = ? THEN m.receiver_id 
                ELSE m.sender_id 
            END as other_user_id,
            u.name as other_user_name,
            u.role as other_user_role,
            COALESCE(v.business_name, u.name) as display_name,
            v.category as vendor_category,
            (SELECT content FROM messages m2 
             WHERE (m2.sender_id = ? AND m2.receiver_id = other_user_id) 
                OR (m2.receiver_id = ? AND m2.sender_id = other_user_id)
             ORDER BY m2.created_at DESC LIMIT 1) as last_message,
            (SELECT created_at FROM messages m3 
             WHERE (m3.sender_id = ? AND m3.receiver_id = other_user_id) 
                OR (m3.receiver_id = ? AND m3.sender_id = other_user_id)
             ORDER BY m3.created_at DESC LIMIT 1) as last_message_time,
            (SELECT COUNT(*) FROM messages m4 
             WHERE m4.sender_id = other_user_id AND m4.receiver_id = ? AND m4.is_read = 0) as unread_count
        FROM messages m
        JOIN users u ON u.id = CASE WHEN m.sender_id = ? THEN m.receiver_id ELSE m.sender_id END
        LEFT JOIN vendors v ON v.user_id = u.id
        WHERE m.sender_id = ? OR m.receiver_id = ?
        GROUP BY other_user_id
        ORDER BY last_message_time DESC
    ");
    
    $stmt->execute([$userId, $userId, $userId, $userId, $userId, $userId, $userId, $userId, $userId]);
    $conversations = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'data' => $conversations
    ]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
