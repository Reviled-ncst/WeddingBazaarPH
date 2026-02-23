<?php
/**
 * Confirm Card Payment API
 * POST /payments/confirm-card.php
 * 
 * For demo purposes - confirms a card payment and updates booking status
 */

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, ['http://localhost:3000', 'http://localhost:3001'])) {
    header("Access-Control-Allow-Origin: $origin");
} else {
    header("Access-Control-Allow-Origin: http://localhost:3000");
}
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/database.php';

$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['booking_id'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Missing booking_id']);
    exit();
}

$bookingId = $input['booking_id'];
$transactionId = $input['transaction_id'] ?? 'TXN-' . time();
$cardLastFour = $input['card_last_four'] ?? '****';

try {
    $pdo = getDBConnection();
    
    // Update booking with payment info
    $stmt = $pdo->prepare("
        UPDATE bookings 
        SET 
            payment_status = 'paid',
            payment_method = 'card',
            payment_id = :transaction_id,
            paid_at = NOW(),
            status = 'confirmed'
        WHERE id = :booking_id
    ");
    
    $stmt->execute([
        'transaction_id' => $transactionId,
        'booking_id' => $bookingId
    ]);
    
    if ($stmt->rowCount() > 0) {
        echo json_encode([
            'success' => true,
            'message' => 'Card payment confirmed',
            'transaction_id' => $transactionId,
            'card_last_four' => $cardLastFour
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Booking not found'
        ]);
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}
