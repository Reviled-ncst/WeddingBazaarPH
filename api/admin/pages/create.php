<?php
// Admin: Create a new page

// Must be first - suppress ALL PHP errors as HTML
ini_set('display_errors', '0');
ini_set('log_errors', '1');
error_reporting(E_ALL);

set_error_handler(function($severity, $message, $file, $line) {
    throw new ErrorException($message, 0, $severity, $file, $line);
});

set_exception_handler(function($e) {
    header('Content-Type: application/json');
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    exit;
});

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

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

// Validate required fields
if (empty($data['slug']) || empty($data['title'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Slug and title are required']);
    exit;
}

// Sanitize slug
$slug = preg_replace('/[^a-z0-9\-]/', '', strtolower($data['slug']));

$pdo = getDBConnection();

try {
    // Check if slug exists
    $stmt = $pdo->prepare("SELECT id FROM content_pages WHERE slug = ?");
    $stmt->execute([$slug]);
    if ($stmt->fetch()) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'A page with this slug already exists']);
        exit;
    }
    
    $stmt = $pdo->prepare("
        INSERT INTO content_pages 
        (slug, title, content, meta_title, meta_description, is_published, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
    ");
    
    $stmt->execute([
        $slug,
        $data['title'],
        $data['content'] ?? '',
        $data['meta_title'] ?? $data['title'],
        $data['meta_description'] ?? '',
        isset($data['is_published']) ? ($data['is_published'] ? 1 : 0) : 0
    ]);
    
    $pageId = $pdo->lastInsertId();
    
    // Fetch the created page
    $stmt = $pdo->prepare("SELECT * FROM content_pages WHERE id = ?");
    $stmt->execute([$pageId]);
    $page = $stmt->fetch();
    
    echo json_encode([
        'success' => true,
        'message' => 'Page created successfully',
        'data' => $page
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Failed to create page']);
}
