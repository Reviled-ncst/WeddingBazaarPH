<?php
/**
 * Check Payment Status API
 * GET /payments/status.php?booking_id=X
 * 
 * Checks payment status from PayMongo and updates booking
 */

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, ['http://localhost:3000', 'http://localhost:3001'])) {
    header("Access-Control-Allow-Origin: $origin");
} else {
    header("Access-Control-Allow-Origin: http://localhost:3000");
}
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/database.php';
require_once '../config/paymongo.php';

if (!isset($_GET['booking_id'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Missing booking_id']);
    exit();
}

try {
    $pdo = getDBConnection();
    
    // Get booking
    $stmt = $pdo->prepare("
        SELECT 
            b.id,
            b.payment_id,
            b.payment_status,
            b.payment_method,
            b.total_price,
            b.paid_at,
            s.name as service_name,
            v.business_name as vendor_name
        FROM bookings b
        JOIN services s ON b.service_id = s.id
        JOIN vendors v ON b.vendor_id = v.id
        WHERE b.id = ?
    ");
    $stmt->execute([$_GET['booking_id']]);
    $booking = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$booking) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Booking not found']);
        exit();
    }
    
    // If already paid, return status
    if ($booking['payment_status'] === 'paid') {
        echo json_encode([
            'success' => true,
            'payment_status' => 'paid',
            'paid_at' => $booking['paid_at'],
            'amount' => $booking['total_price'],
        ]);
        exit();
    }
    
    // If no payment started
    if (!$booking['payment_id']) {
        echo json_encode([
            'success' => true,
            'payment_status' => 'unpaid',
            'message' => 'No payment initiated'
        ]);
        exit();
    }
    
    // Check source status from PayMongo
    $sourceResult = getSource($booking['payment_id']);
    
    if (isset($sourceResult['errors'])) {
        echo json_encode([
            'success' => true,
            'payment_status' => $booking['payment_status'],
            'message' => 'Could not fetch payment status'
        ]);
        exit();
    }
    
    $sourceStatus = $sourceResult['data']['attributes']['status'] ?? 'unknown';
    
    // Map PayMongo source status to our status
    $paymentStatus = $booking['payment_status'];
    $paidAt = null;
    
    switch ($sourceStatus) {
        case 'chargeable':
            // Source is authorized, create payment
            $paymentResult = createPaymentFromSource([
                'source_id' => $booking['payment_id'],
                'amount' => toCentavos($booking['total_price']),
                'description' => "{$booking['service_name']} - {$booking['vendor_name']}"
            ]);
            
            if (!isset($paymentResult['errors'])) {
                $paymentStatus = 'paid';
                $paidAt = date('Y-m-d H:i:s');
                
                // Update booking
                $updateStmt = $pdo->prepare("
                    UPDATE bookings 
                    SET payment_status = 'paid',
                        paid_at = NOW(),
                        status = 'confirmed'
                    WHERE id = ?
                ");
                $updateStmt->execute([$booking['id']]);
            }
            break;
            
        case 'paid':
            $paymentStatus = 'paid';
            $paidAt = date('Y-m-d H:i:s');
            
            // Update booking if not already updated
            if ($booking['payment_status'] !== 'paid') {
                $updateStmt = $pdo->prepare("
                    UPDATE bookings 
                    SET payment_status = 'paid',
                        paid_at = NOW(),
                        status = 'confirmed'
                    WHERE id = ?
                ");
                $updateStmt->execute([$booking['id']]);
            }
            break;
            
        case 'expired':
        case 'cancelled':
            $paymentStatus = 'failed';
            $updateStmt = $pdo->prepare("
                UPDATE bookings SET payment_status = 'failed' WHERE id = ?
            ");
            $updateStmt->execute([$booking['id']]);
            break;
            
        case 'pending':
        default:
            $paymentStatus = 'pending';
            break;
    }
    
    echo json_encode([
        'success' => true,
        'payment_status' => $paymentStatus,
        'source_status' => $sourceStatus,
        'paid_at' => $paidAt,
        'amount' => $booking['total_price'],
    ]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
}
