<?php
/**
 * Get availability for an entire month
 * GET /availability/month.php?vendor_id=X&service_id=Y&year=YYYY&month=MM
 * 
 * Returns array of dates with their availability status
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
    $year = isset($_GET['year']) ? (int)$_GET['year'] : (int)date('Y');
    $month = isset($_GET['month']) ? (int)$_GET['month'] : (int)date('m');
    
    if (!$vendorId) {
        throw new Exception('vendor_id is required');
    }
    
    if ($month < 1 || $month > 12) {
        throw new Exception('Invalid month');
    }
    
    $pdo = getDBConnection();
    
    // Get first and last day of the month
    $firstDay = sprintf('%04d-%02d-01', $year, $month);
    $lastDay = date('Y-m-t', strtotime($firstDay));
    
    // Get service max_bookings_per_day if service_id provided
    $maxBookings = 1;
    if ($serviceId) {
        $stmt = $pdo->prepare("SELECT max_bookings_per_day FROM services WHERE id = ?");
        $stmt->execute([$serviceId]);
        $service = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($service && $service['max_bookings_per_day']) {
            $maxBookings = (int)$service['max_bookings_per_day'];
        }
    }
    
    // Get all blocked dates for this vendor in this month
    $stmt = $pdo->prepare("
        SELECT unavailable_date, reason 
        FROM vendor_unavailable_dates 
        WHERE vendor_id = ? 
        AND unavailable_date BETWEEN ? AND ?
    ");
    $stmt->execute([$vendorId, $firstDay, $lastDay]);
    $blockedDates = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $blockedDates[$row['unavailable_date']] = $row['reason'] ?: 'Unavailable';
    }
    
    // Get booking counts per day for this month
    $query = "
        SELECT event_date, COUNT(*) as booking_count 
        FROM bookings 
        WHERE vendor_id = ? 
        AND event_date BETWEEN ? AND ?
        AND status NOT IN ('cancelled')
    ";
    $params = [$vendorId, $firstDay, $lastDay];
    
    if ($serviceId) {
        $query = "
            SELECT event_date, COUNT(*) as booking_count 
            FROM bookings 
            WHERE vendor_id = ? 
            AND service_id = ?
            AND event_date BETWEEN ? AND ?
            AND status NOT IN ('cancelled')
            GROUP BY event_date
        ";
        $params = [$vendorId, $serviceId, $firstDay, $lastDay];
    } else {
        $query .= " GROUP BY event_date";
    }
    
    $stmt = $pdo->prepare($query);
    $stmt->execute($params);
    $bookingCounts = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $bookingCounts[$row['event_date']] = (int)$row['booking_count'];
    }
    
    // Build the availability array for each day
    $today = new DateTime();
    $today->setTime(0, 0, 0);
    
    $availability = [];
    $currentDate = new DateTime($firstDay);
    $endDate = new DateTime($lastDay);
    
    while ($currentDate <= $endDate) {
        $dateStr = $currentDate->format('Y-m-d');
        $dayNum = (int)$currentDate->format('j');
        
        $status = 'available';
        $reason = null;
        $bookings = $bookingCounts[$dateStr] ?? 0;
        
        // Check if in the past
        if ($currentDate < $today) {
            $status = 'past';
            $reason = 'Past date';
        }
        // Check if blocked
        elseif (isset($blockedDates[$dateStr])) {
            $status = 'blocked';
            $reason = $blockedDates[$dateStr];
        }
        // Check if fully booked
        elseif ($bookings >= $maxBookings) {
            $status = 'full';
            $reason = 'Fully booked';
        }
        // Partially booked
        elseif ($bookings > 0) {
            $status = 'partial';
            $reason = $bookings . ' of ' . $maxBookings . ' booked';
        }
        
        $availability[$dayNum] = [
            'date' => $dateStr,
            'status' => $status,
            'reason' => $reason,
            'bookings' => $bookings,
            'max_bookings' => $maxBookings,
            'available' => $status === 'available' || $status === 'partial'
        ];
        
        $currentDate->modify('+1 day');
    }
    
    echo json_encode([
        'success' => true,
        'data' => [
            'year' => $year,
            'month' => $month,
            'max_bookings_per_day' => $maxBookings,
            'days' => $availability
        ]
    ]);
    
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
