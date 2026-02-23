<?php
/**
 * Create Payment Source API
 * POST /payments/create-source.php
 * 
 * Creates a PayMongo source for e-wallet payments (GCash, GrabPay)
 * Returns the authorization URL to show in an iframe/modal
 * 
 * Required: booking_id, payment_type (gcash, grab_pay)
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

if (!isset($data['booking_id']) || !isset($data['payment_type'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Missing booking_id or payment_type']);
    exit();
}

$validTypes = ['gcash', 'grab_pay'];
if (!in_array($data['payment_type'], $validTypes)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid payment_type. Must be: ' . implode(', ', $validTypes)]);
    exit();
}

try {
    $pdo = getDBConnection();
    
    // Get booking details
    $stmt = $pdo->prepare("
        SELECT 
            b.id,
            b.total_price,
            b.event_date,
            b.payment_status,
            b.payment_id,
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
    
    // Create PayMongo source
    $eventDate = date('M d, Y', strtotime($booking['event_date']));
    $description = "{$booking['service_name']} by {$booking['vendor_name']} - {$eventDate}";
    
    $sourceParams = [
        'amount' => toCentavos($booking['total_price']),
        'type' => $data['payment_type'],
        'booking_id' => $booking['id'],
        'description' => $description,
        'customer_name' => $booking['customer_name'],
        'customer_email' => $booking['customer_email'],
    ];
    
    $result = createSource($sourceParams);
    
    if (isset($result['errors'])) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Failed to create payment source',
            'errors' => $result['errors']
        ]);
        exit();
    }
    
    $sourceData = $result['data']['attributes'];
    $sourceId = $result['data']['id'];
    $checkoutUrl = $sourceData['redirect']['checkout_url'];
    
    // Update booking with source info
    $updateStmt = $pdo->prepare("
        UPDATE bookings 
        SET payment_id = ?,
            payment_method = ?,
            payment_status = 'pending',
            checkout_url = ?
        WHERE id = ?
    ");
    $updateStmt->execute([$sourceId, $data['payment_type'], $checkoutUrl, $booking['id']]);
    
    echo json_encode([
        'success' => true,
        'source_id' => $sourceId,
        'checkout_url' => $checkoutUrl,
        'status' => $sourceData['status'],
        'amount' => fromCentavos($sourceData['amount']),
    ]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
}
