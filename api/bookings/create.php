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
    
    // Check if location/source columns exist
    $columnCheck = $pdo->query("SHOW COLUMNS FROM bookings LIKE 'source_page'");
    $hasSourceColumns = $columnCheck->rowCount() > 0;
    
    if ($hasSourceColumns) {
        // Insert with source tracking
        $stmt = $pdo->prepare("
            INSERT INTO bookings (
                user_id, vendor_id, service_id, event_date, total_price, notes, payment_method, status,
                source_page, referrer, utm_source, utm_medium, utm_campaign,
                user_city, user_province, user_latitude, user_longitude,
                device_type, browser, session_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        
        $stmt->execute([
            $data['user_id'],
            $data['vendor_id'],
            $data['service_id'],
            $data['event_date'],
            $totalPrice,
            $data['notes'] ?? null,
            $paymentMethod,
            $data['source_page'] ?? null,
            $data['referrer'] ?? null,
            $data['utm_source'] ?? null,
            $data['utm_medium'] ?? null,
            $data['utm_campaign'] ?? null,
            $data['user_city'] ?? null,
            $data['user_province'] ?? null,
            $data['user_latitude'] ?? null,
            $data['user_longitude'] ?? null,
            $data['device_type'] ?? null,
            $data['browser'] ?? null,
            $data['session_id'] ?? null
        ]);
    } else {
        // Fallback without source tracking
        $stmt = $pdo->prepare("
            INSERT INTO bookings (user_id, vendor_id, service_id, event_date, total_price, notes, payment_method, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
        ");
        
        $stmt->execute([
            $data['user_id'],
            $data['vendor_id'],
            $data['service_id'],
            $data['event_date'],
            $totalPrice,
            $data['notes'] ?? null,
            $paymentMethod
        ]);
    }
    
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
