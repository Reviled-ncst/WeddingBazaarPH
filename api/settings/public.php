<?php
// Get public site settings
require_once __DIR__ . '/../config/database.php';

setJsonHeader();
setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

$pdo = getDBConnection();

// Default settings fallback
$defaultSettings = [
    'contact' => [
        'contact_email' => 'hello@weddingbazaar.ph',
        'contact_phone' => '+63 917 123 4567',
        'contact_address' => 'BGC, Taguig City, Metro Manila'
    ],
    'social' => [
        'social_facebook' => 'https://facebook.com/weddingbazaarph',
        'social_instagram' => 'https://instagram.com/weddingbazaarph'
    ],
    'branding' => [
        'site_name' => 'WeddingBazaar',
        'site_tagline' => 'Plan Your Perfect Wedding'
    ]
];

try {
    // Check if table exists
    $tableCheck = $pdo->query("SHOW TABLES LIKE 'site_settings'");
    if ($tableCheck->rowCount() === 0) {
        echo json_encode([
            'success' => true,
            'data' => $defaultSettings,
            'source' => 'defaults'
        ]);
        exit;
    }
    
    // Get all public settings grouped
    $stmt = $pdo->query("SELECT setting_key, setting_value, setting_group FROM site_settings ORDER BY setting_group, sort_order");
    $rows = $stmt->fetchAll();
    
    $settings = [];
    foreach ($rows as $row) {
        $group = $row['setting_group'];
        $key = $row['setting_key'];
        if (!isset($settings[$group])) {
            $settings[$group] = [];
        }
        $settings[$group][$key] = $row['setting_value'];
    }
    
    echo json_encode([
        'success' => true,
        'data' => $settings
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Failed to fetch settings']);
}
