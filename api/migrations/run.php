<?php
/**
 * Database Migration Runner
 * Run all pending migrations for Wedding Bazaar
 * 
 * Usage: Access this endpoint as admin or run via CLI
 * GET /migrations/run.php?key=<migration_key>
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once __DIR__ . '/../config/database.php';

// Simple security - require a key for remote execution
$migrationKey = $_GET['key'] ?? $_POST['key'] ?? '';
$expectedKey = getenv('MIGRATION_KEY') ?: 'wedding-bazaar-migrate-2026';

if ($migrationKey !== $expectedKey && php_sapi_name() !== 'cli') {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Invalid migration key']);
    exit;
}

$pdo = getDBConnection();

// Track migration status
function createMigrationsTable($pdo) {
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS `migrations` (
            `id` int(11) NOT NULL AUTO_INCREMENT,
            `migration` varchar(255) NOT NULL,
            `batch` int(11) NOT NULL,
            `executed_at` timestamp NOT NULL DEFAULT current_timestamp(),
            PRIMARY KEY (`id`),
            UNIQUE KEY `migration` (`migration`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
}

function hasRun($pdo, $migration) {
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM migrations WHERE migration = ?");
    $stmt->execute([$migration]);
    return $stmt->fetchColumn() > 0;
}

function markAsRun($pdo, $migration, $batch) {
    $stmt = $pdo->prepare("INSERT INTO migrations (migration, batch) VALUES (?, ?)");
    $stmt->execute([$migration, $batch]);
}

function getCurrentBatch($pdo) {
    $stmt = $pdo->query("SELECT MAX(batch) FROM migrations");
    return ((int)$stmt->fetchColumn()) + 1;
}

// Define migrations in order
$migrations = [
    'cms_schema' => __DIR__ . '/../config/cms_schema.sql',
    'analytics_migration' => __DIR__ . '/../config/analytics_migration.sql',
    'blog_migration' => __DIR__ . '/../config/blog_migration.sql',
    'testimonials_faqs_migration' => __DIR__ . '/../config/testimonials_faqs_migration.sql',
    'booking_analytics_seed' => __DIR__ . '/../config/booking_analytics_seed.sql',
];

$results = [];
$errors = [];

try {
    createMigrationsTable($pdo);
    $batch = getCurrentBatch($pdo);
    
    foreach ($migrations as $name => $file) {
        if (!file_exists($file)) {
            $results[$name] = 'skipped - file not found';
            continue;
        }
        
        if (hasRun($pdo, $name)) {
            $results[$name] = 'skipped - already run';
            continue;
        }
        
        $sql = file_get_contents($file);
        
        // Split by semicolon but handle edge cases
        // Use a simple approach - execute statements one by one
        $statements = array_filter(
            array_map('trim', explode(';', $sql)),
            function($s) { return !empty($s) && !preg_match('/^--/', $s); }
        );
        
        $pdo->beginTransaction();
        
        try {
            foreach ($statements as $statement) {
                if (empty(trim($statement))) continue;
                if (preg_match('/^(--|#|\/\*)/', trim($statement))) continue;
                
                // Skip comments-only statements
                $cleanStmt = preg_replace('/--.*$/m', '', $statement);
                $cleanStmt = trim($cleanStmt);
                if (empty($cleanStmt)) continue;
                
                $pdo->exec($statement);
            }
            
            $pdo->commit();
            markAsRun($pdo, $name, $batch);
            $results[$name] = 'success';
        } catch (Exception $e) {
            $pdo->rollBack();
            $results[$name] = 'failed';
            $errors[$name] = $e->getMessage();
        }
    }
    
    echo json_encode([
        'success' => empty($errors),
        'batch' => $batch,
        'results' => $results,
        'errors' => $errors
    ], JSON_PRETTY_PRINT);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
