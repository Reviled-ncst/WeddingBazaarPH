<?php
/**
 * List Reviews API
 * GET /reviews/list.php
 * 
 * Query params:
 * - vendor_id: Get reviews for a vendor
 * - user_id: Get reviews by a user
 * - booking_id: Check if review exists for a booking
 */

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowedOrigins = ['http://localhost:3000', 'http://localhost:3001'];
$frontendUrl = getenv('FRONTEND_URL');
if ($frontendUrl) $allowedOrigins[] = $frontendUrl;

if (in_array($origin, $allowedOrigins) || preg_match('/\.vercel\.app$/', $origin)) {
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

$vendorId = $_GET['vendor_id'] ?? null;
$userId = $_GET['user_id'] ?? null;
$bookingId = $_GET['booking_id'] ?? null;

try {
    $pdo = getDBConnection();
    
    // Check if review exists for a specific booking
    if ($bookingId) {
        $stmt = $pdo->prepare("
            SELECT r.*, u.name as user_name, u.avatar as user_avatar
            FROM reviews r
            JOIN users u ON r.user_id = u.id
            WHERE r.booking_id = ?
        ");
        $stmt->execute([$bookingId]);
        $review = $stmt->fetch(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'data' => $review ?: null,
            'exists' => $review ? true : false
        ]);
        exit();
    }
    
    // Build query based on filters
    $where = [];
    $params = [];
    
    if ($vendorId) {
        $where[] = "r.vendor_id = ?";
        $params[] = $vendorId;
    }
    
    if ($userId) {
        $where[] = "r.user_id = ?";
        $params[] = $userId;
    }
    
    $whereClause = count($where) > 0 ? "WHERE " . implode(" AND ", $where) : "";
    
    $stmt = $pdo->prepare("
        SELECT 
            r.id,
            r.user_id,
            r.vendor_id,
            r.booking_id,
            r.rating,
            r.comment,
            r.created_at,
            u.name as user_name,
            u.avatar as user_avatar,
            v.business_name as vendor_name,
            s.name as service_name
        FROM reviews r
        JOIN users u ON r.user_id = u.id
        JOIN vendors v ON r.vendor_id = v.id
        LEFT JOIN bookings b ON r.booking_id = b.id
        LEFT JOIN services s ON b.service_id = s.id
        $whereClause
        ORDER BY r.created_at DESC
    ");
    $stmt->execute($params);
    $reviews = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Get rating breakdown if vendor_id provided
    $breakdown = null;
    if ($vendorId) {
        $breakdownStmt = $pdo->prepare("
            SELECT 
                rating,
                COUNT(*) as count
            FROM reviews
            WHERE vendor_id = ?
            GROUP BY rating
            ORDER BY rating DESC
        ");
        $breakdownStmt->execute([$vendorId]);
        $breakdownData = $breakdownStmt->fetchAll(PDO::FETCH_ASSOC);
        
        $breakdown = [
            5 => 0, 4 => 0, 3 => 0, 2 => 0, 1 => 0
        ];
        foreach ($breakdownData as $row) {
            $breakdown[$row['rating']] = intval($row['count']);
        }
    }
    
    echo json_encode([
        'success' => true,
        'data' => $reviews,
        'count' => count($reviews),
        'breakdown' => $breakdown
    ]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
