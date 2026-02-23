<?php
// Admin: List media library
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/jwt.php';

setJsonHeader();
setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Verify admin
$user = requireAuth();
if ($user['role'] !== 'admin') {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Admin access required']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

$pdo = getDBConnection();

try {
    // Check if table exists
    $tableCheck = $pdo->query("SHOW TABLES LIKE 'media_library'");
    if ($tableCheck->rowCount() === 0) {
        echo json_encode([
            'success' => true,
            'data' => ['items' => [], 'total' => 0, 'page' => 1, 'pages' => 0],
            'message' => 'Media library table not yet created. Run CMS migration first.'
        ]);
        exit;
    }
    
    $category = isset($_GET['category']) ? $_GET['category'] : null;
    $page = isset($_GET['page']) ? max(1, intval($_GET['page'])) : 1;
    $limit = isset($_GET['limit']) ? min(100, max(1, intval($_GET['limit']))) : 20;
    $offset = ($page - 1) * $limit;
    
    $sql = "SELECT * FROM media_library";
    $countSql = "SELECT COUNT(*) as total FROM media_library";
    $params = [];
    
    if ($category) {
        $sql .= " WHERE category = ?";
        $countSql .= " WHERE category = ?";
        $params[] = $category;
    }
    
    $sql .= " ORDER BY created_at DESC LIMIT $limit OFFSET $offset";
    
    // Get count
    $countStmt = $pdo->prepare($countSql);
    $countStmt->execute($params);
    $total = $countStmt->fetch()['total'];
    
    // Get items
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $items = $stmt->fetchAll();
    
    echo json_encode([
        'success' => true,
        'data' => [
            'items' => $items,
            'pagination' => [
                'page' => $page,
                'limit' => $limit,
                'total' => $total,
                'pages' => ceil($total / $limit)
            ]
        ]
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Failed to fetch media']);
}
