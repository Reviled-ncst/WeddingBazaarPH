<?php
/**
 * Create Checkout Session API
 * POST /payments/create-checkout.php
 * 
 * Creates a PayMongo checkout session for a booking
 * 
 * Required: booking_id
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
require_once '../config/paymongo.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit();
}

$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['booking_id'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Missing booking_id']);
    exit();
}

try {
    $pdo = getDBConnection();
    
    // Get booking details with service and user info
    $stmt = $pdo->prepare("
        SELECT 
            b.id,
            b.total_price,
            b.event_date,
            b.payment_status,
            b.checkout_url,
            s.name as service_name,
            v.business_name as vendor_name,
            u.name as customer_name,
            u.email as customer_email
        FROM bookings b
        JOIN services s ON b.service_id = s.id
        JOIN vendors v ON b.vendor_id = v.id
        JOIN users u ON b.user_id = u.id
        WHERE b.id = ?
    ");
    $stmt->execute([$data['booking_id']]);
    $booking = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$booking) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Booking not found']);
        exit();
    }
    
    // Check if already paid
    if ($booking['payment_status'] === 'paid') {
        echo json_encode([
            'success' => false,
            'message' => 'This booking has already been paid'
        ]);
        exit();
    }
    
    // If there's an existing valid checkout URL, return it
    if ($booking['checkout_url'] && $booking['payment_status'] === 'pending') {
        echo json_encode([
            'success' => true,
            'checkout_url' => $booking['checkout_url'],
            'message' => 'Using existing checkout session'
        ]);
        exit();
    }
    
    // Create PayMongo checkout session
    $eventDate = date('M d, Y', strtotime($booking['event_date']));
    $description = "{$booking['service_name']} by {$booking['vendor_name']} - Event: {$eventDate}";
    
    $checkoutParams = [
        'amount' => toCentavos($booking['total_price']),
        'description' => $description,
        'service_name' => $booking['service_name'],
        'booking_id' => $booking['id'],
        'customer_name' => $booking['customer_name'],
        'customer_email' => $booking['customer_email'],
    ];
    
    $result = createCheckoutSession($checkoutParams);
    
    if (isset($result['errors'])) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Failed to create checkout session',
            'errors' => $result['errors']
        ]);
        exit();
    }
    
    $checkoutData = $result['data']['attributes'];
    $checkoutId = $result['data']['id'];
    $checkoutUrl = $checkoutData['checkout_url'];
    
    // Update booking with checkout session info
    $updateStmt = $pdo->prepare("
        UPDATE bookings 
        SET checkout_session_id = ?,
            checkout_url = ?,
            payment_status = 'pending'
        WHERE id = ?
    ");
    $updateStmt->execute([$checkoutId, $checkoutUrl, $booking['id']]);
    
    echo json_encode([
        'success' => true,
        'checkout_url' => $checkoutUrl,
        'checkout_session_id' => $checkoutId
    ]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
}
