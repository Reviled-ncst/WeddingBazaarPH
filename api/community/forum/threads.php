<?php
/**
 * Forum Threads API
 * 
 * GET - List threads
 * POST - Create thread
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
        // Pagination
        $page = isset($_GET['page']) ? max(1, (int)$_GET['page']) : 1;
        $limit = isset($_GET['limit']) ? min(50, max(1, (int)$_GET['limit'])) : 20;
        $offset = ($page - 1) * $limit;
        
        // Filters
        $conditions = ["ft.status = 'active'"];
        $params = [];
        
        if (!empty($_GET['category_id'])) {
            $conditions[] = "ft.category_id = :category_id";
            $params[':category_id'] = (int)$_GET['category_id'];
        }
        
        if (!empty($_GET['category_slug'])) {
            $conditions[] = "fc.slug = :category_slug";
            $params[':category_slug'] = $_GET['category_slug'];
        }
        
        if (!empty($_GET['user_id'])) {
            $conditions[] = "ft.user_id = :user_id";
            $params[':user_id'] = (int)$_GET['user_id'];
        }
        
        if (!empty($_GET['search'])) {
            $conditions[] = "(ft.title LIKE :search OR ft.content LIKE :search2)";
            $params[':search'] = '%' . $_GET['search'] . '%';
            $params[':search2'] = '%' . $_GET['search'] . '%';
        }
        
        $whereClause = implode(' AND ', $conditions);
        
        // Count total
        $countSql = "SELECT COUNT(*) as total FROM forum_threads ft JOIN forum_categories fc ON ft.category_id = fc.id WHERE $whereClause";
        $countStmt = $conn->prepare($countSql);
        $countStmt->execute($params);
        $total = $countStmt->fetch(PDO::FETCH_ASSOC)['total'];
        
        // Fetch threads
        $sql = "SELECT 
            ft.*,
            fc.name as category_name,
            fc.slug as category_slug,
            fc.color as category_color,
            u.name as author_name,
            u.role as author_role,
            lu.name as last_reply_name
        FROM forum_threads ft
        JOIN forum_categories fc ON ft.category_id = fc.id
        JOIN users u ON ft.user_id = u.id
        LEFT JOIN users lu ON ft.last_reply_by = lu.id
        WHERE $whereClause
        ORDER BY ft.is_pinned DESC, ft.last_reply_at DESC, ft.created_at DESC
        LIMIT :limit OFFSET :offset";
        
        $stmt = $conn->prepare($sql);
        foreach ($params as $key => $value) {
            $stmt->bindValue($key, $value);
        }
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();
        
        $threads = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'data' => $threads,
            'pagination' => [
                'page' => $page,
                'limit' => $limit,
                'total' => (int)$total,
                'pages' => ceil($total / $limit)
            ]
        ]);
        
    } else if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        
        // Validate required fields
        if (empty($data['user_id']) || empty($data['category_id']) || empty($data['title']) || empty($data['content'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Missing required fields']);
            exit;
        }
        
        // Verify user exists
        $userStmt = $conn->prepare("SELECT id, role FROM users WHERE id = :id");
        $userStmt->execute([':id' => $data['user_id']]);
        $user = $userStmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$user) {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'User not found']);
            exit;
        }
        
        // Verify category exists and user has access
        $catStmt = $conn->prepare("SELECT * FROM forum_categories WHERE id = :id AND is_active = TRUE");
        $catStmt->execute([':id' => $data['category_id']]);
        $category = $catStmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$category) {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Category not found']);
            exit;
        }
        
        $allowedRoles = json_decode($category['allowed_roles'], true) ?: [];
        if (!empty($allowedRoles) && !in_array($user['role'], $allowedRoles)) {
            http_response_code(403);
            echo json_encode(['success' => false, 'error' => 'You do not have permission to post in this category']);
            exit;
        }
        
        // Create thread
        $sql = "INSERT INTO forum_threads (category_id, user_id, title, content) 
                VALUES (:category_id, :user_id, :title, :content)";
        $stmt = $conn->prepare($sql);
        $stmt->execute([
            ':category_id' => $data['category_id'],
            ':user_id' => $data['user_id'],
            ':title' => $data['title'],
            ':content' => $data['content']
        ]);
        
        $threadId = $conn->lastInsertId();
        
        // Update category thread count
        $conn->prepare("UPDATE forum_categories SET threads_count = threads_count + 1 WHERE id = :id")
            ->execute([':id' => $data['category_id']]);
        
        // Log activity
        $logStmt = $conn->prepare("INSERT INTO activity_logs (user_id, action, entity_type, entity_id, description, ip_address) VALUES (:user_id, :action, :entity_type, :entity_id, :description, :ip)");
        $logStmt->execute([
            ':user_id' => $data['user_id'],
            ':action' => 'forum_thread_created',
            ':entity_type' => 'forum_thread',
            ':entity_id' => $threadId,
            ':description' => "Created forum thread: {$data['title']}",
            ':ip' => $_SERVER['REMOTE_ADDR'] ?? null
        ]);
        
        echo json_encode([
            'success' => true,
            'message' => 'Thread created successfully',
            'data' => ['id' => $threadId]
        ]);
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
