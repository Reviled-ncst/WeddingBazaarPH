<?php
/**
 * Public Site Settings API
 * GET: Get public site settings (contact info, social links, etc.)
 * No authentication required - returns only public settings
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Cache-Control: public, max-age=3600'); // Cache for 1 hour

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once __DIR__ . '/../config/database.php';

$pdo = getDBConnection();

// Default settings fallback
$defaultSettings = [
    'contact_email' => 'hello@weddingbazaar.ph',
    'contact_phone' => '+63 917 123 4567',
    'contact_address' => 'BGC, Taguig City, Metro Manila, Philippines',
    'contact_hours' => 'Mon-Fri: 9AM-6PM, Sat: 10AM-4PM',
    'social_facebook' => 'https://facebook.com/weddingbazaarph',
    'social_instagram' => 'https://instagram.com/weddingbazaarph',
    'social_twitter' => 'https://twitter.com/weddingbazaarph',
    'social_youtube' => '',
    'social_tiktok' => '',
    'site_name' => 'WeddingBazaar',
    'site_tagline' => 'Plan Your Perfect Wedding',
    'site_description' => "The Philippines' premier wedding marketplace connecting couples with trusted vendors and coordinators.",
    'footer_about' => "WeddingBazaar is the Philippines' premier wedding marketplace, connecting couples with trusted vendors and coordinators to create their perfect wedding day.",
    'footer_copyright' => '© 2026 WeddingBazaar. All rights reserved.'
];

try {
    // Check if site_settings table exists
    $tableCheck = $pdo->query("SHOW TABLES LIKE 'site_settings'");
    if ($tableCheck->rowCount() === 0) {
        // Return defaults if table doesn't exist
        echo json_encode([
            'success' => true,
            'settings' => $defaultSettings,
            'source' => 'defaults'
        ]);
        exit;
    }
    
    // Get all public settings
    $stmt = $pdo->query("
        SELECT setting_key, setting_value 
        FROM site_settings 
        WHERE setting_group IN ('contact', 'social', 'branding', 'footer')
    ");
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Merge with defaults (database values override defaults)
    $settings = $defaultSettings;
    foreach ($rows as $row) {
        if ($row['setting_value'] !== null && $row['setting_value'] !== '') {
            $settings[$row['setting_key']] = $row['setting_value'];
        }
    }
    
    // Group settings for easier frontend use
    $grouped = [
        'contact' => [
            'email' => $settings['contact_email'],
            'phone' => $settings['contact_phone'],
            'address' => $settings['contact_address'],
            'hours' => $settings['contact_hours']
        ],
        'social' => [
            'facebook' => $settings['social_facebook'],
            'instagram' => $settings['social_instagram'],
            'twitter' => $settings['social_twitter'],
            'youtube' => $settings['social_youtube'],
            'tiktok' => $settings['social_tiktok']
        ],
        'branding' => [
            'siteName' => $settings['site_name'],
            'tagline' => $settings['site_tagline'],
            'description' => $settings['site_description']
        ],
        'footer' => [
            'about' => $settings['footer_about'],
            'copyright' => $settings['footer_copyright']
        ]
    ];
    
    echo json_encode([
        'success' => true,
        'settings' => $settings,
        'grouped' => $grouped,
        'source' => count($rows) > 0 ? 'database' : 'defaults'
    ]);
    
} catch (Exception $e) {
    // Return defaults on error
    echo json_encode([
        'success' => true,
        'settings' => $defaultSettings,
        'source' => 'defaults',
        'error' => $e->getMessage()
    ]);
}
