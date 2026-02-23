<?php
/**
 * Create Review API
 * POST /reviews/create.php
 * 
 * Required: user_id, vendor_id, rating (1-5)
 * Optional: booking_id, comment
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
$required = ['user_id', 'vendor_id', 'rating'];
foreach ($required as $field) {
    if (!isset($data[$field])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => "Missing required field: $field"]);
        exit();
    }
}

// Validate rating range
$rating = intval($data['rating']);
if ($rating < 1 || $rating > 5) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Rating must be between 1 and 5']);
    exit();
}

try {
    $pdo = getDBConnection();
    
    // Check if user already reviewed this vendor (optionally for same booking)
    $checkStmt = $pdo->prepare("
        SELECT id FROM reviews 
        WHERE user_id = ? AND vendor_id = ?
        " . (isset($data['booking_id']) ? "AND booking_id = ?" : "") . "
    ");
    
    $checkParams = [$data['user_id'], $data['vendor_id']];
    if (isset($data['booking_id'])) {
        $checkParams[] = $data['booking_id'];
    }
    $checkStmt->execute($checkParams);
    
    if ($checkStmt->fetch()) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'You have already reviewed this vendor']);
        exit();
    }
    
    // If booking_id provided, verify the booking belongs to the user and is completed
    if (isset($data['booking_id'])) {
        $bookingStmt = $pdo->prepare("
            SELECT id, status FROM bookings 
            WHERE id = ? AND user_id = ? AND vendor_id = ?
        ");
        $bookingStmt->execute([$data['booking_id'], $data['user_id'], $data['vendor_id']]);
        $booking = $bookingStmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$booking) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Invalid booking']);
            exit();
        }
        
        if ($booking['status'] !== 'completed' && $booking['status'] !== 'confirmed') {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Can only review completed or confirmed bookings']);
            exit();
        }
    }
    
    // Create the review
    $stmt = $pdo->prepare("
        INSERT INTO reviews (user_id, vendor_id, booking_id, rating, comment)
        VALUES (?, ?, ?, ?, ?)
    ");
    
    $stmt->execute([
        $data['user_id'],
        $data['vendor_id'],
        $data['booking_id'] ?? null,
        $rating,
        $data['comment'] ?? null
    ]);
    
    $reviewId = $pdo->lastInsertId();
    
    // Update vendor's average rating and review count
    $updateStmt = $pdo->prepare("
        UPDATE vendors 
        SET rating = (
            SELECT ROUND(AVG(rating), 1) FROM reviews WHERE vendor_id = ?
        ),
        review_count = (
            SELECT COUNT(*) FROM reviews WHERE vendor_id = ?
        )
        WHERE id = ?
    ");
    $updateStmt->execute([$data['vendor_id'], $data['vendor_id'], $data['vendor_id']]);
    
    // Mark booking as reviewed if booking_id was provided
    if (isset($data['booking_id'])) {
        $markReviewedStmt = $pdo->prepare("
            UPDATE bookings SET has_review = 1 WHERE id = ?
        ");
        $markReviewedStmt->execute([$data['booking_id']]);
    }
    
    echo json_encode([
        'success' => true,
        'message' => 'Review submitted successfully',
        'review_id' => $reviewId
    ]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
