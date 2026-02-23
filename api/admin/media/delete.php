<?php
// Admin: Delete media
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

if ($_SERVER['REQUEST_METHOD'] !== 'POST' && $_SERVER['REQUEST_METHOD'] !== 'DELETE') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

if (empty($data['id'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Media ID is required']);
    exit;
}

$pdo = getDBConnection();

try {
    // Find media
    $stmt = $pdo->prepare("SELECT * FROM media_library WHERE id = ?");
    $stmt->execute([$data['id']]);
    $media = $stmt->fetch();
    
    if (!$media) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Media not found']);
        exit;
    }
    
    // If it's a local file, try to delete it
    if (strpos($media['url'], '/uploads/media/') === 0) {
        $filePath = __DIR__ . '/../../' . ltrim($media['url'], '/');
        if (file_exists($filePath)) {
            unlink($filePath);
        }
    }
    
    // Delete from database
    $stmt = $pdo->prepare("DELETE FROM media_library WHERE id = ?");
    $stmt->execute([$data['id']]);
    
    echo json_encode([
        'success' => true,
        'message' => 'Media deleted successfully'
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Failed to delete media']);
}
