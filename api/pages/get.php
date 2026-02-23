<?php
// Public: Get a page by slug
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/jwt.php';

setJsonHeader();
setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

$slug = isset($_GET['slug']) ? trim($_GET['slug']) : '';

if (empty($slug)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Page slug is required']);
    exit;
}

$pdo = getDBConnection();

try {
    $stmt = $pdo->prepare("
        SELECT id, slug, title, content, meta_title, meta_description, 
               is_published, created_at, updated_at
        FROM content_pages 
        WHERE slug = ? AND is_published = 1
    ");
    $stmt->execute([$slug]);
    $page = $stmt->fetch();
    
    if (!$page) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Page not found']);
        exit;
    }
    
    echo json_encode([
        'success' => true,
        'data' => $page
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Failed to fetch page']);
}
