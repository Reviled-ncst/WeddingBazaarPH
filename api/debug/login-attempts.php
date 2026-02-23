<?php
/**
 * Debug endpoint to check login_attempts table
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once __DIR__ . '/../config/database.php';

try {
    $pdo = getDBConnection();
    
    // Check table structure
    $stmt = $pdo->query("DESCRIBE login_attempts");
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Get recent attempts
    $stmt = $pdo->query("SELECT * FROM login_attempts ORDER BY created_at DESC LIMIT 10");
    $attempts = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Get count
    $stmt = $pdo->query("SELECT COUNT(*) as total FROM login_attempts");
    $count = $stmt->fetch(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'columns' => $columns,
        'total_count' => $count['total'],
        'recent_attempts' => $attempts
    ], JSON_PRETTY_PRINT);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
