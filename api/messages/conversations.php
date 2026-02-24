<?php
/**
 * List Conversations API
 * GET /messages/conversations.php?user_id=X
 * 
 * Returns list of conversations with last message
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
    
    // Step 1: Get distinct conversation partners
    $stmt = $pdo->prepare("
        SELECT DISTINCT
            CASE 
                WHEN sender_id = ? THEN receiver_id 
                ELSE sender_id 
            END as other_user_id
        FROM messages
        WHERE sender_id = ? OR receiver_id = ?
    ");
    $stmt->execute([$userId, $userId, $userId]);
    $partnerIds = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    $conversations = [];
    
    foreach ($partnerIds as $partnerId) {
        // Get partner info
        $stmt = $pdo->prepare("
            SELECT 
                u.id,
                u.name,
                u.role,
                COALESCE(v.business_name, u.name) as display_name,
                v.category as vendor_category
            FROM users u
            LEFT JOIN vendors v ON v.user_id = u.id
            WHERE u.id = ?
        ");
        $stmt->execute([$partnerId]);
        $partner = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$partner) continue;
        
        // Get last message
        $stmt = $pdo->prepare("
            SELECT content, created_at, sender_id
            FROM messages
            WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)
            ORDER BY created_at DESC
            LIMIT 1
        ");
        $stmt->execute([$userId, $partnerId, $partnerId, $userId]);
        $lastMessage = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Get unread count
        $stmt = $pdo->prepare("
            SELECT COUNT(*) as count
            FROM messages
            WHERE sender_id = ? AND receiver_id = ? AND is_read = 0
        ");
        $stmt->execute([$partnerId, $userId]);
        $unreadCount = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
        
        $conversations[] = [
            'other_user_id' => (int)$partner['id'],
            'other_user_name' => $partner['name'],
            'other_user_role' => $partner['role'],
            'display_name' => $partner['display_name'],
            'vendor_category' => $partner['vendor_category'],
            'last_message' => $lastMessage['content'] ?? null,
            'last_message_time' => $lastMessage['created_at'] ?? null,
            'unread_count' => (int)$unreadCount
        ];
    }
    
    // Sort by last message time
    usort($conversations, function($a, $b) {
        return strtotime($b['last_message_time'] ?? '1970-01-01') - strtotime($a['last_message_time'] ?? '1970-01-01');
    });
    
    echo json_encode([
        'success' => true,
        'data' => $conversations
    ]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
