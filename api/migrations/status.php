<?php
/**
 * Migration Status API
 * Check which migrations have been run
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once __DIR__ . '/../config/database.php';

$pdo = getDBConnection();

try {
    // Check if migrations table exists
    $tableCheck = $pdo->query("SHOW TABLES LIKE 'migrations'");
    if ($tableCheck->rowCount() === 0) {
        echo json_encode([
            'success' => true,
            'migrations' => [],
            'message' => 'Migrations table not yet created'
        ]);
        exit;
    }
    
    $stmt = $pdo->query("SELECT * FROM migrations ORDER BY executed_at DESC");
    $migrations = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Available migrations
    $available = [
        'cms_schema' => 'CMS tables and site settings',
        'analytics_migration' => 'Analytics tracking tables',
        'blog_migration' => 'Blog posts table',
        'testimonials_faqs_migration' => 'Testimonials and FAQs tables',
        'booking_analytics_seed' => 'Demo booking data with locations'
    ];
    
    $executed = array_column($migrations, 'migration');
    $pending = array_diff(array_keys($available), $executed);
    
    echo json_encode([
        'success' => true,
        'executed' => $migrations,
        'pending' => array_values($pending),
        'available' => $available
    ], JSON_PRETTY_PRINT);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
