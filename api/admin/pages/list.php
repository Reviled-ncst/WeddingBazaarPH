<?php
// Admin: List all pages
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
    $tableCheck = $pdo->query("SHOW TABLES LIKE 'content_pages'");
    if ($tableCheck->rowCount() === 0) {
        echo json_encode([
            'success' => true,
            'data' => [],
            'message' => 'Content pages table not yet created. Run CMS migration first.'
        ]);
        exit;
    }
    
    $stmt = $pdo->query("
        SELECT id, slug, title, meta_title, meta_description, 
               is_published, created_at, updated_at
        FROM content_pages 
        ORDER BY title
    ");
    $pages = $stmt->fetchAll();
    
    echo json_encode([
        'success' => true,
        'data' => $pages
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Failed to fetch pages']);
}
