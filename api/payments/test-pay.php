<?php
/**
 * Test Payment API
 * Simulates completing a payment with a test card
 * 
 * Test Cards:
 * - 4343434343434345 = Success
 * - 4444444444444442 = Declined
 * - 4000000000000002 = Insufficient funds
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once '../config/paymongo.php';

$input = json_decode(file_get_contents('php://input'), true);
$sourceId = $input['source_id'] ?? '';
$cardNumber = preg_replace('/\s+/', '', $input['card_number'] ?? '');

if (!$sourceId) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Missing source_id']);
    exit;
}

if (!$cardNumber) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Missing card_number']);
    exit;
}

// Simulate card validation
if ($cardNumber === '4343434343434345') {
    // Success - mark source as chargeable
    if (markTestSourceChargeable($sourceId)) {
        echo json_encode([
            'success' => true,
            'status' => 'success',
            'message' => 'Payment successful!'
        ]);
    } else {
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'status' => 'error',
            'message' => 'Source not found'
        ]);
    }
} elseif ($cardNumber === '4444444444444442') {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'status' => 'declined',
        'message' => 'Card declined. Please try another card.'
    ]);
} elseif ($cardNumber === '4000000000000002') {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'status' => 'insufficient',
        'message' => 'Insufficient funds. Please try another card.'
    ]);
} elseif (strlen($cardNumber) < 16) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'status' => 'invalid',
        'message' => 'Invalid card number. Please enter 16 digits.'
    ]);
} else {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'status' => 'declined',
        'message' => 'Card not recognized. Use test card: 4343434343434345'
    ]);
}
