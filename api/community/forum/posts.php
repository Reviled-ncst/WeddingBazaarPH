<?php
/**
 * Forum Posts (Replies) API
 * 
 * GET - List posts for a thread
 * POST - Create post/reply
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../../config/database.php';

try {
    $database = new Database();
    $conn = $database->getConnection();
    
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        if (empty($_GET['thread_id'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'thread_id required']);
            exit;
        }
        
        // Get thread info first
        $threadStmt = $conn->prepare("
            SELECT ft.*, fc.name as category_name, u.name as author_name, u.role as author_role
            FROM forum_threads ft
            JOIN forum_categories fc ON ft.category_id = fc.id
            JOIN users u ON ft.user_id = u.id
            WHERE ft.id = :id AND ft.status = 'active'
        ");
        $threadStmt->execute([':id' => $_GET['thread_id']]);
        $thread = $threadStmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$thread) {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Thread not found']);
            exit;
        }
        
        // Increment view count
        $conn->prepare("UPDATE forum_threads SET views_count = views_count + 1 WHERE id = :id")
            ->execute([':id' => $_GET['thread_id']]);
        
        // Get posts
        $sql = "SELECT 
            fp.*,
            u.name as author_name,
            u.role as author_role
        FROM forum_posts fp
        JOIN users u ON fp.user_id = u.id
        WHERE fp.thread_id = :thread_id AND fp.status = 'active'
        ORDER BY fp.created_at ASC";
        
        $stmt = $conn->prepare($sql);
        $stmt->execute([':thread_id' => $_GET['thread_id']]);
        $posts = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'data' => [
                'thread' => $thread,
                'posts' => $posts
            ]
        ]);
        
    } else if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (empty($data['user_id']) || empty($data['thread_id']) || empty($data['content'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Missing required fields']);
            exit;
        }
        
        // Verify thread exists and is not locked
        $threadStmt = $conn->prepare("SELECT * FROM forum_threads WHERE id = :id AND status = 'active'");
        $threadStmt->execute([':id' => $data['thread_id']]);
        $thread = $threadStmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$thread) {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Thread not found']);
            exit;
        }
        
        if ($thread['is_locked']) {
            http_response_code(403);
            echo json_encode(['success' => false, 'error' => 'Thread is locked']);
            exit;
        }
        
        // Create post
        $sql = "INSERT INTO forum_posts (thread_id, user_id, parent_id, content) 
                VALUES (:thread_id, :user_id, :parent_id, :content)";
        $stmt = $conn->prepare($sql);
        $stmt->execute([
            ':thread_id' => $data['thread_id'],
            ':user_id' => $data['user_id'],
            ':parent_id' => $data['parent_id'] ?? null,
            ':content' => $data['content']
        ]);
        
        $postId = $conn->lastInsertId();
        
        // Update thread stats
        $conn->prepare("
            UPDATE forum_threads 
            SET replies_count = replies_count + 1, 
                last_reply_at = NOW(), 
                last_reply_by = :user_id 
            WHERE id = :id
        ")->execute([':id' => $data['thread_id'], ':user_id' => $data['user_id']]);
        
        // Update category post count
        $conn->prepare("UPDATE forum_categories SET posts_count = posts_count + 1 WHERE id = :id")
            ->execute([':id' => $thread['category_id']]);
        
        echo json_encode([
            'success' => true,
            'message' => 'Reply posted successfully',
            'data' => ['id' => $postId]
        ]);
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
