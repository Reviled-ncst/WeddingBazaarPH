<?php
/**
 * List Coordinator Bookings API
 * GET /coordinator-bookings/list.php?user_id=X or ?coordinator_id=Y
 */

require_once '../config/database.php';

setJsonHeader();
setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit();
}

$userId = $_GET['user_id'] ?? null;
$coordinatorId = $_GET['coordinator_id'] ?? null;
$status = $_GET['status'] ?? null;

if (!$userId && !$coordinatorId) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'user_id or coordinator_id is required']);
    exit();
}

try {
    $pdo = getDBConnection();
    
    $where = [];
    $params = [];
    
    if ($userId) {
        $where[] = "cb.user_id = ?";
        $params[] = $userId;
    }
    
    if ($coordinatorId) {
        $where[] = "cb.coordinator_id = ?";
        $params[] = $coordinatorId;
    }
    
    if ($status) {
        $where[] = "cb.status = ?";
        $params[] = $status;
    }
    
    $whereClause = implode(' AND ', $where);
    
    $stmt = $pdo->prepare("
        SELECT 
            cb.*,
            c.business_name as coordinator_name,
            c.images as coordinator_images,
            c.location as coordinator_location,
            cs.name as service_name,
            cs.base_total as service_price,
            u.name as client_name,
            u.email as client_email,
            u.phone as client_phone
        FROM coordinator_bookings cb
        JOIN coordinators c ON cb.coordinator_id = c.id
        LEFT JOIN coordinator_services cs ON cb.service_id = cs.id
        JOIN users u ON cb.user_id = u.id
        WHERE $whereClause
        ORDER BY cb.event_date DESC, cb.created_at DESC
    ");
    $stmt->execute($params);
    $bookings = $stmt->fetchAll();
    
    foreach ($bookings as &$booking) {
        $booking['id'] = (int)$booking['id'];
        $booking['user_id'] = (int)$booking['user_id'];
        $booking['coordinator_id'] = (int)$booking['coordinator_id'];
        $booking['service_id'] = $booking['service_id'] ? (int)$booking['service_id'] : null;
        $booking['total_price'] = $booking['total_price'] ? (float)$booking['total_price'] : null;
        $booking['travel_fee'] = (float)$booking['travel_fee'];
        $booking['guest_count'] = $booking['guest_count'] ? (int)$booking['guest_count'] : null;
        $booking['has_review'] = (bool)$booking['has_review'];
        $booking['coordinator_images'] = $booking['coordinator_images'] ? json_decode($booking['coordinator_images'], true) : [];
        $booking['service_price'] = $booking['service_price'] ? (float)$booking['service_price'] : null;
    }
    
    echo json_encode([
        'success' => true,
        'data' => $bookings
    ]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
