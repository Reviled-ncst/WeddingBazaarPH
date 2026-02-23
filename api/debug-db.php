<?php
header('Content-Type: application/json');

// Debug database connection - try multiple methods
$mysqlUrl = getenv('MYSQL_URL') ?: ($_ENV['MYSQL_URL'] ?? ($_SERVER['MYSQL_URL'] ?? null));

// Also check all environment variables containing MYSQL or DB
$allEnv = [];
foreach (getenv() as $key => $value) {
    if (stripos($key, 'MYSQL') !== false || stripos($key, 'DB') !== false || stripos($key, 'RAILWAY') !== false) {
        $allEnv[$key] = substr($value, 0, 20) . '...';
    }
}

$response = [
    'mysql_url_exists' => !empty($mysqlUrl),
    'mysql_url_preview' => $mysqlUrl ? substr($mysqlUrl, 0, 30) . '...' : null,
    'env_vars_found' => $allEnv,
];

if ($mysqlUrl) {
    $dbParts = parse_url($mysqlUrl);
    $response['parsed'] = [
        'host' => $dbParts['host'] ?? null,
        'port' => $dbParts['port'] ?? null,
        'user' => $dbParts['user'] ?? null,
        'database' => ltrim($dbParts['path'] ?? '', '/'),
    ];
    
    // Try to connect
    try {
        $dsn = "mysql:host=" . ($dbParts['host'] ?? 'localhost') . 
               ";port=" . ($dbParts['port'] ?? '3306') . 
               ";dbname=" . ltrim($dbParts['path'] ?? '/railway', '/') . 
               ";charset=utf8mb4";
        $pdo = new PDO(
            $dsn,
            $dbParts['user'] ?? 'root',
            $dbParts['pass'] ?? '',
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
        );
        $response['connection'] = 'success';
        
        // Check tables
        $stmt = $pdo->query("SHOW TABLES");
        $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
        $response['tables'] = $tables;
    } catch (PDOException $e) {
        $response['connection'] = 'failed';
        $response['error'] = $e->getMessage();
    }
} else {
    $response['error'] = 'MYSQL_URL not set';
}

echo json_encode($response, JSON_PRETTY_PRINT);
