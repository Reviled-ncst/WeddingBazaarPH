<?php
/**
 * List Group Conversations API
 * GET /messages/group-conversations.php?user_id=X
 * 
 * Returns list of group conversations the user is part of
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

$userId = $_GET['user_id'] ?? null;

if (!$userId) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'user_id required']);
    exit();
}

try {
    $pdo = getDBConnection();
    
    // Get group conversations for user
    $stmt = $pdo->prepare("
        SELECT 
            c.id,
            c.name,
            c.type,
            c.created_at,
            c.updated_at,
            cp.is_admin,
            (SELECT content FROM group_messages gm 
             WHERE gm.conversation_id = c.id 
             ORDER BY gm.created_at DESC LIMIT 1) as last_message,
            (SELECT created_at FROM group_messages gm2 
             WHERE gm2.conversation_id = c.id 
             ORDER BY gm2.created_at DESC LIMIT 1) as last_message_time,
            (SELECT sender_id FROM group_messages gm3 
             WHERE gm3.conversation_id = c.id 
             ORDER BY gm3.created_at DESC LIMIT 1) as last_sender_id,
            (SELECT COUNT(*) FROM group_messages gm4 
             WHERE gm4.conversation_id = c.id 
             AND gm4.created_at > COALESCE(cp.last_read_at, '1970-01-01')
             AND gm4.sender_id != ?) as unread_count,
            (SELECT COUNT(*) FROM conversation_participants cp2 
             WHERE cp2.conversation_id = c.id) as participant_count
        FROM conversations c
        JOIN conversation_participants cp ON cp.conversation_id = c.id AND cp.user_id = ?
        WHERE c.type = 'group'
        ORDER BY COALESCE(last_message_time, c.created_at) DESC
    ");
    
    $stmt->execute([$userId, $userId]);
    $conversations = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Get participants for each conversation
    foreach ($conversations as &$conv) {
        $stmt = $pdo->prepare("
            SELECT 
                u.id,
                u.name,
                u.role,
                COALESCE(v.business_name, u.name) as display_name,
                cp.is_admin
            FROM conversation_participants cp
            JOIN users u ON u.id = cp.user_id
            LEFT JOIN vendors v ON v.user_id = u.id
            WHERE cp.conversation_id = ?
            ORDER BY cp.is_admin DESC, u.name ASC
        ");
        $stmt->execute([$conv['id']]);
        $conv['participants'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Get last sender name
        if ($conv['last_sender_id']) {
            $stmt = $pdo->prepare("SELECT name FROM users WHERE id = ?");
            $stmt->execute([$conv['last_sender_id']]);
            $sender = $stmt->fetch(PDO::FETCH_ASSOC);
            $conv['last_sender_name'] = $sender ? $sender['name'] : null;
        } else {
            $conv['last_sender_name'] = null;
        }
    }
    
    echo json_encode([
        'success' => true,
        'data' => $conversations
    ]);
    
} catch (PDOException $e) {
    // If tables don't exist yet, return empty array
    if (strpos($e->getMessage(), "doesn't exist") !== false || strpos($e->getMessage(), 'Table') !== false) {
        echo json_encode(['success' => true, 'data' => []]);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
}
