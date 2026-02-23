<?php
/**
 * Debug endpoint to check login_attempts table and API response format
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once __DIR__ . '/../config/database.php';

try {
    $pdo = getDBConnection();
    
    // Test exact query from login-security.php
    $sql = "
        SELECT la.id, la.user_id, la.email, la.ip_address, la.user_agent,
               CASE WHEN la.success = 1 THEN 'success' ELSE 'failed' END as status,
               la.failure_reason, la.created_at, la.location,
               u.name as user_name, u.role as user_role
        FROM login_attempts la
        LEFT JOIN users u ON la.user_id = u.id
        ORDER BY la.created_at DESC
        LIMIT 20 OFFSET 0
    ";
    $stmt = $pdo->query($sql);
    $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Get stats
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM login_attempts WHERE success = 1");
    $successCount = $stmt->fetch(PDO::FETCH_ASSOC)['count'];

    $stmt = $pdo->query("SELECT COUNT(*) as count FROM login_attempts WHERE success = 0");
    $failedCount = $stmt->fetch(PDO::FETCH_ASSOC)['count'];

    // Get count
    $stmt = $pdo->query("SELECT COUNT(*) as total FROM login_attempts");
    $total = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
    
    // Format exactly like login-security.php
    echo json_encode([
        'success' => true,
        'attempts' => $data,
        'pagination' => [
            'page' => 1,
            'limit' => 20,
            'total' => (int)$total,
            'totalPages' => ceil($total / 20)
        ],
        'stats' => [
            'success' => (int)$successCount,
            'failed' => (int)$failedCount,
            'blocked' => 0
        ]
    ], JSON_PRETTY_PRINT);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
