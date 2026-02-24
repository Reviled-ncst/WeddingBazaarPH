<?php
/**
 * Create Booking API
 * POST /bookings/create.php
 * 
 * Required: user_id, vendor_id, service_id, event_date
 * Optional: notes, total_price, payment_method
 */

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowedOrigins = ['http://localhost:3000', 'http://localhost:3001'];
$frontendUrl = getenv('FRONTEND_URL');
if ($frontendUrl) $allowedOrigins[] = $frontendUrl;

if (in_array($origin, $allowedOrigins) || preg_match('/\.railway\.app$|\.vercel\.app$/', $origin)) {
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

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit();
}

$data = json_decode(file_get_contents('php://input'), true);

// Validate required fields
$required = ['user_id', 'vendor_id', 'service_id', 'event_date'];
foreach ($required as $field) {
    if (!isset($data[$field]) || empty($data[$field])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => "Missing required field: $field"]);
        exit();
    }
}

try {
    $pdo = getDBConnection();
    
    // Get service price if not provided
    $totalPrice = $data['total_price'] ?? null;
    if (!$totalPrice) {
        $serviceStmt = $pdo->prepare("SELECT base_total FROM services WHERE id = ?");
        $serviceStmt->execute([$data['service_id']]);
        $service = $serviceStmt->fetch(PDO::FETCH_ASSOC);
        $totalPrice = $service ? $service['base_total'] : 0;
    }
    
    $paymentMethod = $data['payment_method'] ?? null;
    
    // Check which optional columns exist
    $columnCheck = $pdo->query("SHOW COLUMNS FROM bookings");
    $existingColumns = [];
    while ($col = $columnCheck->fetch(PDO::FETCH_ASSOC)) {
        $existingColumns[] = $col['Field'];
    }
    
    $hasSourceColumns = in_array('source_page', $existingColumns);
    $hasGuestCount = in_array('guest_count', $existingColumns);
    $hasEventAddress = in_array('event_address', $existingColumns);
    $hasTravelFee = in_array('travel_fee', $existingColumns);
    $hasEventCoords = in_array('event_latitude', $existingColumns) && in_array('event_longitude', $existingColumns);
    
    // Build dynamic insert query
    $columns = ['user_id', 'vendor_id', 'service_id', 'event_date', 'total_price', 'notes', 'payment_method', 'status'];
    $placeholders = ['?', '?', '?', '?', '?', '?', '?', '?'];
    $values = [
        $data['user_id'],
        $data['vendor_id'],
        $data['service_id'],
        $data['event_date'],
        $totalPrice,
        $data['notes'] ?? null,
        $paymentMethod,
        'pending'
    ];
    
    // Add guest_count if column exists
    if ($hasGuestCount) {
        $columns[] = 'guest_count';
        $placeholders[] = '?';
        $values[] = isset($data['guest_count']) && $data['guest_count'] ? (int)$data['guest_count'] : null;
    }
    
    // Add event_address if column exists
    if ($hasEventAddress) {
        $columns[] = 'event_address';
        $placeholders[] = '?';
        $values[] = $data['event_address'] ?? null;
    }
    
    // Add travel_fee if column exists
    if ($hasTravelFee) {
        $columns[] = 'travel_fee';
        $placeholders[] = '?';
        $values[] = isset($data['travel_fee']) ? (float)$data['travel_fee'] : 0;
    }
    
    // Add event coordinates if columns exist
    if ($hasEventCoords) {
        $columns[] = 'event_latitude';
        $columns[] = 'event_longitude';
        $placeholders[] = '?';
        $placeholders[] = '?';
        $values[] = isset($data['event_latitude']) ? (float)$data['event_latitude'] : null;
        $values[] = isset($data['event_longitude']) ? (float)$data['event_longitude'] : null;
    }
    
    // Add source tracking columns if they exist
    if ($hasSourceColumns) {
        $sourceColumns = [
            'source_page', 'referrer', 'utm_source', 'utm_medium', 'utm_campaign',
            'user_city', 'user_province', 'user_latitude', 'user_longitude',
            'device_type', 'browser', 'session_id'
        ];
        foreach ($sourceColumns as $col) {
            if (in_array($col, $existingColumns)) {
                $columns[] = $col;
                $placeholders[] = '?';
                $values[] = $data[$col] ?? null;
            }
        }
    }
    
    $sql = "INSERT INTO bookings (" . implode(', ', $columns) . ") VALUES (" . implode(', ', $placeholders) . ")";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($values);
    
    $bookingId = $pdo->lastInsertId();
    
    echo json_encode([
        'success' => true,
        'message' => 'Booking created successfully',
        'booking_id' => $bookingId
    ]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
