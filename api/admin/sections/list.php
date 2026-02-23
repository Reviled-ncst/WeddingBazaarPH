<?php
// Admin: List all landing sections
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
    $stmt = $pdo->query("
        SELECT * FROM landing_sections 
        ORDER BY sort_order
    ");
    $sections = $stmt->fetchAll();
    
    // Parse JSON content for editing
    foreach ($sections as &$section) {
        if ($section['content']) {
            $decoded = json_decode($section['content'], true);
            if ($decoded !== null) {
                $section['content_json'] = $decoded;
            }
        }
    }
    
    echo json_encode([
        'success' => true,
        'data' => $sections
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Failed to fetch sections']);
}
