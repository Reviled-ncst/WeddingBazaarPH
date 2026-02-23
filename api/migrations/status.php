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

// Available migrations with descriptions
$available = [
    'cms_schema' => 'CMS tables: site_settings, content_pages, landing_sections, media_library',
    'analytics_migration' => 'Analytics tables: page_views, click_events, scroll_events, custom_events',
    'blog_migration' => 'Blog posts table',
    'testimonials_faqs_migration' => 'Testimonials and FAQs tables with Philippine sample data',
    'booking_analytics_seed' => 'Demo booking data with locations for geographic heatmaps'
];

try {
    // Check if migrations table exists
    $tableCheck = $pdo->query("SHOW TABLES LIKE 'migrations'");
    if ($tableCheck->rowCount() === 0) {
        echo json_encode([
            'success' => true,
            'executed' => [],
            'pending' => array_keys($available),
            'available' => $available,
            'message' => 'Migrations table not yet created - all migrations pending'
        ]);
        exit;
    }
    
    $stmt = $pdo->query("SELECT * FROM migrations ORDER BY executed_at DESC");
    $migrations = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $executed = array_column(
        array_filter($migrations, fn($m) => $m['status'] === 'success'),
        'migration'
    );
    $pending = array_diff(array_keys($available), $executed);
    
    // Get table statistics
    $tables = [];
    $tableStats = $pdo->query("SHOW TABLES");
    while ($row = $tableStats->fetch(PDO::FETCH_NUM)) {
        $tableName = $row[0];
        try {
            $countStmt = $pdo->query("SELECT COUNT(*) FROM `$tableName`");
            $count = $countStmt->fetchColumn();
            $tables[$tableName] = (int)$count;
        } catch (Exception $e) {
            $tables[$tableName] = 'error';
        }
    }
    
    echo json_encode([
        'success' => true,
        'executed' => $migrations,
        'pending' => array_values($pending),
        'available' => $available,
        'table_counts' => $tables
    ], JSON_PRETTY_PRINT);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
