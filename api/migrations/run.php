<?php
/**
 * Database Migration Runner
 * Securely run all pending migrations for Wedding Bazaar
 * 
 * Authentication: Either admin JWT token OR migration key from environment
 * 
 * Usage:
 *   GET /migrations/run.php (with Authorization: Bearer <admin_token>)
 *   GET /migrations/run.php?key=<MIGRATION_KEY> (for automated deployments)
 *   GET /migrations/run.php?migration=cms_schema (run specific migration)
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/jwt.php';

// Authentication - allow either admin JWT or migration key
$authenticated = false;
$authMethod = 'none';

// Check JWT first
try {
    $user = verifyJWT();
    if ($user && $user['role'] === 'admin') {
        $authenticated = true;
        $authMethod = 'admin_jwt';
    }
} catch (Exception $e) {
    // JWT failed, try migration key
}

// Check migration key
if (!$authenticated) {
    $migrationKey = $_GET['key'] ?? $_POST['key'] ?? $_SERVER['HTTP_X_MIGRATION_KEY'] ?? '';
    $expectedKey = getenv('MIGRATION_KEY') ?: 'wedding-bazaar-migrate-2026';
    
    if (!empty($migrationKey) && $migrationKey === $expectedKey) {
        $authenticated = true;
        $authMethod = 'migration_key';
    }
}

// Allow CLI execution without auth
if (php_sapi_name() === 'cli') {
    $authenticated = true;
    $authMethod = 'cli';
}

if (!$authenticated) {
    http_response_code(401);
    echo json_encode([
        'success' => false, 
        'message' => 'Unauthorized. Provide admin JWT token or migration key.',
        'hint' => 'Use Authorization header with admin token or ?key=<migration_key>'
    ]);
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
            `execution_time_ms` int(11) DEFAULT NULL,
            `status` enum('success','failed','rolled_back') DEFAULT 'success',
            `error_message` text DEFAULT NULL,
            PRIMARY KEY (`id`),
            UNIQUE KEY `migration` (`migration`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
}

function hasRun($pdo, $migration) {
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM migrations WHERE migration = ? AND status = 'success'");
    $stmt->execute([$migration]);
    return $stmt->fetchColumn() > 0;
}

function markAsRun($pdo, $migration, $batch, $timeMs, $status = 'success', $error = null) {
    // Delete any previous failed attempts
    $stmt = $pdo->prepare("DELETE FROM migrations WHERE migration = ? AND status != 'success'");
    $stmt->execute([$migration]);
    
    $stmt = $pdo->prepare("INSERT INTO migrations (migration, batch, execution_time_ms, status, error_message) VALUES (?, ?, ?, ?, ?)");
    $stmt->execute([$migration, $batch, $timeMs, $status, $error]);
}

function getCurrentBatch($pdo) {
    $stmt = $pdo->query("SELECT COALESCE(MAX(batch), 0) FROM migrations");
    return ((int)$stmt->fetchColumn()) + 1;
}

function executeSqlFile($pdo, $file) {
    $sql = file_get_contents($file);
    
    // Remove comments
    $sql = preg_replace('/--.*$/m', '', $sql);
    $sql = preg_replace('/\/\*[\s\S]*?\*\//', '', $sql);
    
    // Split by semicolons (handling edge cases)
    $statements = preg_split('/;\s*$/m', $sql);
    
    $executed = 0;
    foreach ($statements as $statement) {
        $statement = trim($statement);
        if (empty($statement)) continue;
        
        $pdo->exec($statement);
        $executed++;
    }
    
    return $executed;
}

// Define migrations in order
$migrations = [
    'cms_schema' => [
        'file' => __DIR__ . '/../config/cms_schema.sql',
        'description' => 'CMS tables: site_settings, content_pages, landing_sections, media_library'
    ],
    'analytics_migration' => [
        'file' => __DIR__ . '/../config/analytics_migration.sql',
        'description' => 'Analytics tables: page_views, click_events, scroll_events, custom_events'
    ],
    'blog_migration' => [
        'file' => __DIR__ . '/../config/blog_migration.sql',
        'description' => 'Blog posts table'
    ],
    'testimonials_faqs_migration' => [
        'file' => __DIR__ . '/../config/testimonials_faqs_migration.sql',
        'description' => 'Testimonials and FAQs tables with sample data'
    ],
    'booking_analytics_seed' => [
        'file' => __DIR__ . '/../config/booking_analytics_seed.sql',
        'description' => 'Demo booking data with Philippine locations for heatmaps'
    ],
];

// Check if specific migration requested
$specificMigration = $_GET['migration'] ?? $_POST['migration'] ?? null;
$dryRun = isset($_GET['dry_run']) || isset($_POST['dry_run']);

$results = [];
$errors = [];
$totalTime = 0;

try {
    createMigrationsTable($pdo);
    $batch = getCurrentBatch($pdo);
    
    // Filter to specific migration if requested
    $toRun = $migrations;
    if ($specificMigration) {
        if (!isset($migrations[$specificMigration])) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => "Unknown migration: $specificMigration",
                'available' => array_keys($migrations)
            ]);
            exit;
        }
        $toRun = [$specificMigration => $migrations[$specificMigration]];
    }
    
    foreach ($toRun as $name => $config) {
        $file = $config['file'];
        
        if (!file_exists($file)) {
            $results[$name] = [
                'status' => 'skipped',
                'reason' => 'file not found',
                'file' => basename($file)
            ];
            continue;
        }
        
        if (hasRun($pdo, $name)) {
            $results[$name] = [
                'status' => 'skipped',
                'reason' => 'already executed',
                'description' => $config['description']
            ];
            continue;
        }
        
        if ($dryRun) {
            $results[$name] = [
                'status' => 'pending',
                'description' => $config['description'],
                'would_run' => true
            ];
            continue;
        }
        
        $startTime = microtime(true);
        
        try {
            $statementsExecuted = executeSqlFile($pdo, $file);
            
            $executionTime = round((microtime(true) - $startTime) * 1000);
            $totalTime += $executionTime;
            
            markAsRun($pdo, $name, $batch, $executionTime);
            
            $results[$name] = [
                'status' => 'success',
                'description' => $config['description'],
                'statements_executed' => $statementsExecuted,
                'execution_time_ms' => $executionTime
            ];
        } catch (Exception $e) {
            $executionTime = round((microtime(true) - $startTime) * 1000);
            markAsRun($pdo, $name, $batch, $executionTime, 'failed', $e->getMessage());
            
            $results[$name] = [
                'status' => 'failed',
                'error' => $e->getMessage()
            ];
            $errors[$name] = $e->getMessage();
        }
    }
    
    $successCount = count(array_filter($results, fn($r) => $r['status'] === 'success'));
    $skipCount = count(array_filter($results, fn($r) => $r['status'] === 'skipped'));
    $failCount = count($errors);
    
    echo json_encode([
        'success' => empty($errors),
        'dry_run' => $dryRun,
        'auth_method' => $authMethod,
        'batch' => $batch,
        'summary' => [
            'success' => $successCount,
            'skipped' => $skipCount,
            'failed' => $failCount,
            'total_time_ms' => $totalTime
        ],
        'results' => $results,
        'errors' => $errors ?: null
    ], JSON_PRETTY_PRINT);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
