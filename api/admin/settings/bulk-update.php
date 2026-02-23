<?php
// Admin: Bulk update settings
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

if (!isset($data['settings']) || !is_array($data['settings'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Settings array is required']);
    exit;
}

$pdo = getDBConnection();

try {
    $pdo->beginTransaction();
    
    $updated = 0;
    $errors = [];
    
    $updateStmt = $pdo->prepare("
        UPDATE site_settings 
        SET setting_value = ?, updated_at = NOW() 
        WHERE setting_key = ?
    ");
    
    foreach ($data['settings'] as $setting) {
        if (!isset($setting['key']) || !isset($setting['value'])) {
            $errors[] = "Invalid setting format";
            continue;
        }
        
        $value = $setting['value'];
        if (is_array($value)) {
            $value = json_encode($value);
        }
        
        $updateStmt->execute([$value, $setting['key']]);
        if ($updateStmt->rowCount() > 0) {
            $updated++;
        }
    }
    
    $pdo->commit();
    
    echo json_encode([
        'success' => true,
        'message' => "Updated $updated settings",
        'data' => [
            'updated' => $updated,
            'errors' => $errors
        ]
    ]);
} catch (PDOException $e) {
    $pdo->rollBack();
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Failed to update settings']);
}
