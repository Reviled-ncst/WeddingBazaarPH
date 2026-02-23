<?php
// Admin: Update a landing section
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

if (empty($data['id']) && empty($data['section_key'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Section ID or key is required']);
    exit;
}

$pdo = getDBConnection();

try {
    // Find section
    if (!empty($data['id'])) {
        $stmt = $pdo->prepare("SELECT * FROM landing_sections WHERE id = ?");
        $stmt->execute([$data['id']]);
    } else {
        $stmt = $pdo->prepare("SELECT * FROM landing_sections WHERE section_key = ?");
        $stmt->execute([$data['section_key']]);
    }
    
    $existing = $stmt->fetch();
    
    if (!$existing) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Section not found']);
        exit;
    }
    
    // Prepare content - encode if array
    $content = $data['content'] ?? $existing['content'];
    if (is_array($content)) {
        $content = json_encode($content);
    }
    
    $stmt = $pdo->prepare("
        UPDATE landing_sections 
        SET title = ?, 
            subtitle = ?, 
            content = ?, 
            background_image = ?,
            is_active = ?,
            sort_order = ?,
            updated_at = NOW()
        WHERE id = ?
    ");
    
    $stmt->execute([
        $data['title'] ?? $existing['title'],
        $data['subtitle'] ?? $existing['subtitle'],
        $content,
        $data['background_image'] ?? $existing['background_image'],
        isset($data['is_active']) ? ($data['is_active'] ? 1 : 0) : $existing['is_active'],
        $data['sort_order'] ?? $existing['sort_order'],
        $existing['id']
    ]);
    
    // Fetch updated section
    $stmt = $pdo->prepare("SELECT * FROM landing_sections WHERE id = ?");
    $stmt->execute([$existing['id']]);
    $section = $stmt->fetch();
    
    // Parse JSON for response
    if ($section['content']) {
        $decoded = json_decode($section['content'], true);
        if ($decoded !== null) {
            $section['content_json'] = $decoded;
        }
    }
    
    echo json_encode([
        'success' => true,
        'message' => 'Section updated successfully',
        'data' => $section
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Failed to update section']);
}
