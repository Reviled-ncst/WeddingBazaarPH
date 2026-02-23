<?php
/**
 * Public Blog Posts API
 * GET: List published blog posts
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Cache-Control: public, max-age=300'); // Cache for 5 minutes

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once __DIR__ . '/../config/database.php';

$pdo = getDBConnection();

// Get query parameters
$category = isset($_GET['category']) ? trim($_GET['category']) : null;
$limit = isset($_GET['limit']) ? min((int)$_GET['limit'], 50) : 10;
$page = isset($_GET['page']) ? max((int)$_GET['page'], 1) : 1;
$offset = ($page - 1) * $limit;

try {
    // Check if blog_posts table exists
    $tableCheck = $pdo->query("SHOW TABLES LIKE 'blog_posts'");
    if ($tableCheck->rowCount() === 0) {
        // Table doesn't exist - return empty with message
        echo json_encode([
            'success' => true,
            'posts' => [],
            'pagination' => [
                'page' => 1,
                'limit' => $limit,
                'total' => 0,
                'totalPages' => 0
            ],
            'message' => 'Blog coming soon'
        ]);
        exit;
    }

    // Build query
    $where = "WHERE status = 'published'";
    $params = [];
    
    if ($category) {
        $where .= " AND category = ?";
        $params[] = $category;
    }
    
    // Get total count
    $countSql = "SELECT COUNT(*) as total FROM blog_posts $where";
    $stmt = $pdo->prepare($countSql);
    $stmt->execute($params);
    $total = (int)$stmt->fetch(PDO::FETCH_ASSOC)['total'];
    
    // Get posts
    $sql = "SELECT id, slug, title, excerpt, featured_image, author_name, category, published_at, view_count
            FROM blog_posts
            $where
            ORDER BY is_featured DESC, published_at DESC
            LIMIT ? OFFSET ?";
    
    $params[] = $limit;
    $params[] = $offset;
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $posts = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Format dates
    foreach ($posts as &$post) {
        $post['view_count'] = (int)$post['view_count'];
        if ($post['published_at']) {
            $date = new DateTime($post['published_at']);
            $post['date'] = $date->format('F j, Y');
        }
    }
    
    // Get unique categories
    $catStmt = $pdo->query("SELECT DISTINCT category FROM blog_posts WHERE status = 'published' ORDER BY category");
    $categories = $catStmt->fetchAll(PDO::FETCH_COLUMN);
    
    echo json_encode([
        'success' => true,
        'posts' => $posts,
        'categories' => $categories,
        'pagination' => [
            'page' => $page,
            'limit' => $limit,
            'total' => $total,
            'totalPages' => ceil($total / $limit)
        ]
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Failed to fetch blog posts',
        'posts' => []
    ]);
}
