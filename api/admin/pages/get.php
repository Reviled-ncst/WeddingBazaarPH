<?php
// Admin: Get a page by ID for editing
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

$id = isset($_GET['id']) ? intval($_GET['id']) : 0;

if ($id <= 0) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Valid page ID is required']);
    exit;
}

$pdo = getDBConnection();

try {
    $stmt = $pdo->prepare("SELECT * FROM content_pages WHERE id = ?");
    $stmt->execute([$id]);
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
