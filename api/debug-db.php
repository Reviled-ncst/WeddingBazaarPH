<?php
header('Content-Type: application/json');

// Debug database connection
$mysqlUrl = getenv('MYSQL_URL');

$response = [
    'mysql_url_exists' => !empty($mysqlUrl),
    'mysql_url_preview' => $mysqlUrl ? substr($mysqlUrl, 0, 30) . '...' : null,
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
