<?php
/**
 * Check availability for a specific date and service
 * GET /availability/check.php?vendor_id=X&service_id=Y&date=YYYY-MM-DD
 * 
 * Returns:
 * - available: boolean
 * - reason: string (if unavailable)
 * - current_bookings: number of bookings on that date
 * - max_bookings: max allowed bookings
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../config/database.php';

try {
    $vendorId = isset($_GET['vendor_id']) ? (int)$_GET['vendor_id'] : null;
    $serviceId = isset($_GET['service_id']) ? (int)$_GET['service_id'] : null;
    $date = isset($_GET['date']) ? $_GET['date'] : null;
    
    if (!$vendorId || !$date) {
        throw new Exception('vendor_id and date are required');
    }
    
    // Validate date format
    $dateObj = DateTime::createFromFormat('Y-m-d', $date);
    if (!$dateObj || $dateObj->format('Y-m-d') !== $date) {
        throw new Exception('Invalid date format. Use YYYY-MM-DD');
    }
    
    // Check if date is in the past
    $today = new DateTime();
    $today->setTime(0, 0, 0);
    if ($dateObj < $today) {
        echo json_encode([
            'success' => true,
            'data' => [
                'available' => false,
                'reason' => 'Date is in the past',
                'current_bookings' => 0,
                'max_bookings' => 0
            ]
        ]);
        exit;
    }
    
    $pdo = getDBConnection();
    
    // Check if vendor has blocked this date
    $stmt = $pdo->prepare("
        SELECT reason FROM vendor_unavailable_dates 
        WHERE vendor_id = ? AND unavailable_date = ?
    ");
    $stmt->execute([$vendorId, $date]);
    $blockedDate = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($blockedDate) {
        echo json_encode([
            'success' => true,
            'data' => [
                'available' => false,
                'reason' => $blockedDate['reason'] ?: 'Vendor unavailable',
                'current_bookings' => 0,
                'max_bookings' => 0
            ]
        ]);
        exit;
    }
    
    // Get service max_bookings_per_day if service_id provided
    $maxBookings = 1; // Default
    if ($serviceId) {
        $stmt = $pdo->prepare("SELECT max_bookings_per_day FROM services WHERE id = ?");
        $stmt->execute([$serviceId]);
        $service = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($service && $service['max_bookings_per_day']) {
            $maxBookings = (int)$service['max_bookings_per_day'];
        }
    }
    
    // Count existing bookings for this date
    $query = "
        SELECT COUNT(*) as booking_count 
        FROM bookings 
        WHERE vendor_id = ? 
        AND event_date = ? 
        AND status NOT IN ('cancelled')
    ";
    $params = [$vendorId, $date];
    
    // If service_id provided, only count bookings for that specific service
    if ($serviceId) {
        $query = "
            SELECT COUNT(*) as booking_count 
            FROM bookings 
            WHERE vendor_id = ? 
            AND service_id = ?
            AND event_date = ? 
            AND status NOT IN ('cancelled')
        ";
        $params = [$vendorId, $serviceId, $date];
    }
    
    $stmt = $pdo->prepare($query);
    $stmt->execute($params);
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    $currentBookings = (int)$result['booking_count'];
    
    $available = $currentBookings < $maxBookings;
    
    echo json_encode([
        'success' => true,
        'data' => [
            'available' => $available,
            'reason' => $available ? null : 'Fully booked',
            'current_bookings' => $currentBookings,
            'max_bookings' => $maxBookings
        ]
    ]);
    
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
