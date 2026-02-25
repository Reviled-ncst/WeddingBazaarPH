<?php
/**
 * Create Coordinator Booking API
 * POST /coordinator-bookings/create.php
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

// Required fields
$requiredFields = ['user_id', 'coordinator_id', 'event_date'];
foreach ($requiredFields as $field) {
    if (!isset($data[$field]) || empty($data[$field])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => "$field is required"]);
        exit();
    }
}

$userId = intval($data['user_id']);
$coordinatorId = intval($data['coordinator_id']);
$serviceId = isset($data['service_id']) ? intval($data['service_id']) : null;
$eventDate = $data['event_date'];
$notes = $data['notes'] ?? null;
$guestCount = isset($data['guest_count']) ? intval($data['guest_count']) : null;
$eventLocation = $data['event_location'] ?? null;
$eventLatitude = isset($data['event_latitude']) ? floatval($data['event_latitude']) : null;
$eventLongitude = isset($data['event_longitude']) ? floatval($data['event_longitude']) : null;
$travelFee = isset($data['travel_fee']) ? floatval($data['travel_fee']) : 0;
$totalPrice = isset($data['total_price']) ? floatval($data['total_price']) : null;

try {
    $pdo = getDBConnection();
    
    // Verify coordinator exists
    $coordStmt = $pdo->prepare("SELECT id, business_name FROM coordinators WHERE id = ? AND is_active = 1");
    $coordStmt->execute([$coordinatorId]);
    $coordinator = $coordStmt->fetch();
    
    if (!$coordinator) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Coordinator not found']);
        exit();
    }
    
    // Check for existing booking on same date (if service has limit)
    if ($serviceId) {
        $serviceStmt = $pdo->prepare("SELECT max_bookings_per_day FROM coordinator_services WHERE id = ?");
        $serviceStmt->execute([$serviceId]);
        $service = $serviceStmt->fetch();
        
        if ($service && $service['max_bookings_per_day'] > 0) {
            $countStmt = $pdo->prepare("
                SELECT COUNT(*) FROM coordinator_bookings 
                WHERE coordinator_id = ? AND service_id = ? AND event_date = ? AND status NOT IN ('cancelled')
            ");
            $countStmt->execute([$coordinatorId, $serviceId, $eventDate]);
            $count = $countStmt->fetchColumn();
            
            if ($count >= $service['max_bookings_per_day']) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'This date is fully booked for the selected service']);
                exit();
            }
        }
    }
    
    // Create booking
    $insertStmt = $pdo->prepare("
        INSERT INTO coordinator_bookings 
        (user_id, coordinator_id, service_id, event_date, notes, guest_count, event_location, event_latitude, event_longitude, travel_fee, total_price, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    ");
    $insertStmt->execute([
        $userId,
        $coordinatorId,
        $serviceId,
        $eventDate,
        $notes,
        $guestCount,
        $eventLocation,
        $eventLatitude,
        $eventLongitude,
        $travelFee,
        $totalPrice
    ]);
    
    $bookingId = $pdo->lastInsertId();
    
    echo json_encode([
        'success' => true,
        'message' => 'Booking request submitted successfully',
        'data' => [
            'booking_id' => $bookingId,
            'coordinator_name' => $coordinator['business_name'],
            'event_date' => $eventDate,
            'status' => 'pending'
        ]
    ]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
