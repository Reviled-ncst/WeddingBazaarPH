<?php
/**
 * List Bookings API
 * GET /bookings/list.php?user_id=X OR ?vendor_id=X
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
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit();
}

$userId = $_GET['user_id'] ?? null;
$vendorId = $_GET['vendor_id'] ?? null;

if (!$userId && !$vendorId) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'user_id or vendor_id required']);
    exit();
}

try {
    $pdo = getDBConnection();
    
    if ($userId) {
        // Get bookings for a user (couple)
        $stmt = $pdo->prepare("
            SELECT 
                b.*,
                v.business_name,
                v.business_name as vendor_name,
                v.category,
                v.images as vendor_images,
                s.name as service_name,
                s.description as service_description,
                u.name as vendor_contact_name,
                u.phone as vendor_phone,
                u.email as vendor_email,
                COALESCE(b.has_review, 0) as has_review
            FROM bookings b
            JOIN vendors v ON b.vendor_id = v.id
            JOIN users u ON v.user_id = u.id
            LEFT JOIN services s ON b.service_id = s.id
            WHERE b.user_id = ?
            ORDER BY b.event_date ASC
        ");
        $stmt->execute([$userId]);
    } else {
        // Get bookings for a vendor
        $stmt = $pdo->prepare("
            SELECT 
                b.*,
                u.name as client_name,
                u.phone as client_phone,
                u.email as client_email,
                s.name as service_name,
                s.description as service_description
            FROM bookings b
            JOIN users u ON b.user_id = u.id
            LEFT JOIN services s ON b.service_id = s.id
            WHERE b.vendor_id = ?
            ORDER BY b.event_date ASC
        ");
        $stmt->execute([$vendorId]);
    }
    
    $bookings = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Parse JSON fields
    foreach ($bookings as &$booking) {
        if (isset($booking['vendor_images'])) {
            $booking['vendor_images'] = json_decode($booking['vendor_images'], true) ?? [];
        }
    }
    
    echo json_encode([
        'success' => true,
        'data' => $bookings
    ]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
