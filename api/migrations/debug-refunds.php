<?php
/**
 * Debug Refund Table Structure
 */

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowedOrigins = ['http://localhost:3000', 'http://localhost:3001'];
$frontendUrl = getenv('FRONTEND_URL');
if ($frontendUrl) $allowedOrigins[] = $frontendUrl;

if (in_array($origin, $allowedOrigins) || preg_match('/\.railway\.app$|\.vercel\.app$/', $origin)) {
    header("Access-Control-Allow-Origin: $origin");
} else {
    header("Access-Control-Allow-Origin: http://localhost:3000");
}
header("Content-Type: application/json");

require_once '../config/database.php';

try {
    $pdo = getDBConnection();
    
    // Get table structure
    $stmt = $pdo->query("SHOW CREATE TABLE refund_requests");
    $tableCreate = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Get column info
    $stmt = $pdo->query("SHOW COLUMNS FROM refund_requests WHERE Field = 'status'");
    $statusColumn = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Count rows
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM refund_requests");
    $count = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Get existing refund requests
    $stmt = $pdo->query("SELECT id, booking_id, status FROM refund_requests LIMIT 10");
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Get available bookings
    $stmt = $pdo->query("
        SELECT b.id, b.status, b.payment_status, b.total_price, b.amount_paid
        FROM bookings b
        WHERE b.id NOT IN (SELECT booking_id FROM refund_requests)
        AND b.status != 'cancelled'
        LIMIT 10
    ");
    $availableBookings = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'status_column' => $statusColumn,
        'refund_count' => $count['count'],
        'existing_refunds' => $rows,
        'available_bookings' => $availableBookings,
        'table_create' => $tableCreate
    ], JSON_PRETTY_PRINT);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
