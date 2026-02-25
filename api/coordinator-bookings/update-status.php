<?php
/**
 * Update Coordinator Booking Status API
 * POST /coordinator-bookings/update-status.php
 */

require_once '../config/database.php';

setJsonHeader();
setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit();
}

$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['booking_id']) || !isset($data['status'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'booking_id and status are required']);
    exit();
}

$bookingId = intval($data['booking_id']);
$status = $data['status'];

$validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
if (!in_array($status, $validStatuses)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid status. Must be: ' . implode(', ', $validStatuses)]);
    exit();
}

try {
    $pdo = getDBConnection();
    
    // Verify booking exists
    $checkStmt = $pdo->prepare("SELECT id, status FROM coordinator_bookings WHERE id = ?");
    $checkStmt->execute([$bookingId]);
    $booking = $checkStmt->fetch();
    
    if (!$booking) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Booking not found']);
        exit();
    }
    
    // Update status
    $updateStmt = $pdo->prepare("UPDATE coordinator_bookings SET status = ?, updated_at = NOW() WHERE id = ?");
    $updateStmt->execute([$status, $bookingId]);
    
    echo json_encode([
        'success' => true,
        'message' => 'Booking status updated successfully',
        'data' => [
            'booking_id' => $bookingId,
            'status' => $status
        ]
    ]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
