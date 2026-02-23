<?php
// Admin: Update a setting
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

if (!isset($data['key']) || !isset($data['value'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Setting key and value are required']);
    exit;
}

$pdo = getDBConnection();

try {
    // Check if setting exists
    $stmt = $pdo->prepare("SELECT * FROM site_settings WHERE setting_key = ?");
    $stmt->execute([$data['key']]);
    $existing = $stmt->fetch();
    
    if (!$existing) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Setting not found']);
        exit;
    }
    
    // Validate json type
    if ($existing['setting_type'] === 'json' && !is_array(json_decode($data['value'], true)) && !is_array($data['value'])) {
        // If value is already an array, encode it
        if (is_array($data['value'])) {
            $data['value'] = json_encode($data['value']);
        }
    }
    
    // Update setting
    $stmt = $pdo->prepare("
        UPDATE site_settings 
        SET setting_value = ?, updated_at = NOW() 
        WHERE setting_key = ?
    ");
    $stmt->execute([$data['value'], $data['key']]);
    
    // Fetch updated setting
    $stmt = $pdo->prepare("SELECT * FROM site_settings WHERE setting_key = ?");
    $stmt->execute([$data['key']]);
    $updated = $stmt->fetch();
    
    echo json_encode([
        'success' => true,
        'message' => 'Setting updated successfully',
        'data' => $updated
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Failed to update setting']);
}
