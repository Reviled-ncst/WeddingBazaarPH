<?php
// Admin: Update a page

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

if ($_SERVER['REQUEST_METHOD'] !== 'POST' && $_SERVER['REQUEST_METHOD'] !== 'PUT') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

if (empty($data['id'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Page ID is required']);
    exit;
}

$pdo = getDBConnection();

try {
    // Check if page exists
    $stmt = $pdo->prepare("SELECT * FROM content_pages WHERE id = ?");
    $stmt->execute([$data['id']]);
    $existing = $stmt->fetch();
    
    if (!$existing) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Page not found']);
        exit;
    }
    
    // If slug is being changed, check uniqueness
    if (isset($data['slug']) && $data['slug'] !== $existing['slug']) {
        $slug = preg_replace('/[^a-z0-9\-]/', '', strtolower($data['slug']));
        $stmt = $pdo->prepare("SELECT id FROM content_pages WHERE slug = ? AND id != ?");
        $stmt->execute([$slug, $data['id']]);
        if ($stmt->fetch()) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'A page with this slug already exists']);
            exit;
        }
    } else {
        $slug = $existing['slug'];
    }
    
    $stmt = $pdo->prepare("
        UPDATE content_pages 
        SET slug = ?, 
            title = ?, 
            content = ?, 
            meta_title = ?, 
            meta_description = ?, 
            is_published = ?,
            updated_at = NOW()
        WHERE id = ?
    ");
    
    $stmt->execute([
        $slug,
        $data['title'] ?? $existing['title'],
        $data['content'] ?? $existing['content'],
        $data['meta_title'] ?? $existing['meta_title'],
        $data['meta_description'] ?? $existing['meta_description'],
        isset($data['is_published']) ? ($data['is_published'] ? 1 : 0) : $existing['is_published'],
        $data['id']
    ]);
    
    // Fetch updated page
    $stmt = $pdo->prepare("SELECT * FROM content_pages WHERE id = ?");
    $stmt->execute([$data['id']]);
    $page = $stmt->fetch();
    
    echo json_encode([
        'success' => true,
        'message' => 'Page updated successfully',
        'data' => $page
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Failed to update page']);
}
