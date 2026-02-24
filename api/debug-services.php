<?php
/**
 * Debug Services Table
 */
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once __DIR__ . '/config/database.php';

try {
    $pdo = getDBConnection();
    
    // Get table structure
    $stmt = $pdo->query("SHOW COLUMNS FROM services");
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Count services
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM services");
    $count = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Get sample
    $stmt = $pdo->query("SELECT id, name, category, is_active, base_total FROM services LIMIT 5");
    $sample = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'columns' => $columns,
        'count' => $count['count'],
        'sample' => $sample
    ], JSON_PRETTY_PRINT);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
