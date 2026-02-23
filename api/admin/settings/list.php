<?php
// Admin: Get all settings with full details
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
    $tableCheck = $pdo->query("SHOW TABLES LIKE 'site_settings'");
    if ($tableCheck->rowCount() === 0) {
        echo json_encode([
            'success' => true,
            'data' => ['settings' => [], 'grouped' => []],
            'message' => 'Site settings table not yet created. Run CMS migration first.'
        ]);
        exit;
    }
    
    $group = isset($_GET['group']) ? $_GET['group'] : null;
    
    $sql = "SELECT * FROM site_settings";
    $params = [];
    
    if ($group) {
        $sql .= " WHERE setting_group = ?";
        $params[] = $group;
    }
    
    $sql .= " ORDER BY setting_group, sort_order";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $settings = $stmt->fetchAll();
    
    // Group settings
    $grouped = [];
    foreach ($settings as $setting) {
        $g = $setting['setting_group'];
        if (!isset($grouped[$g])) {
            $grouped[$g] = [];
        }
        $grouped[$g][] = $setting;
    }
    
    echo json_encode([
        'success' => true,
        'data' => [
            'settings' => $settings,
            'grouped' => $grouped
        ]
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Failed to fetch settings']);
}
