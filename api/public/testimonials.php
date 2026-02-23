<?php
/**
 * Get Testimonials API
 * Returns approved testimonials/reviews for homepage display
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../config/database.php';

try {
    $database = new Database();
    $pdo = $database->getConnection();
    
    // Get limit from query params (default 6)
    $limit = isset($_GET['limit']) ? min(20, max(1, (int)$_GET['limit'])) : 6;
    
    // Check if testimonials table exists
    $tableCheck = $pdo->query("SHOW TABLES LIKE 'testimonials'");
    $hasTestimonialsTable = $tableCheck->rowCount() > 0;
    
    $testimonials = [];
    
    if ($hasTestimonialsTable) {
        // Fetch from testimonials table
        $sql = "
            SELECT 
                t.id,
                t.couple_names as name,
                t.location,
                t.avatar as image,
                t.rating,
                t.testimonial as text,
                DATE_FORMAT(t.wedding_date, '%M %Y') as date,
                t.vendor_name,
                t.service_type
            FROM testimonials t
            WHERE t.is_approved = 1 AND t.is_featured = 1
            ORDER BY t.wedding_date DESC, t.created_at DESC
            LIMIT :limit
        ";
        
        $stmt = $pdo->prepare($sql);
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();
        
        $testimonials = $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    // If no testimonials in dedicated table, try reviews table
    if (empty($testimonials)) {
        $reviewCheck = $pdo->query("SELECT COUNT(*) FROM reviews WHERE rating >= 4");
        $hasReviews = $reviewCheck->fetchColumn() > 0;
        
        if ($hasReviews) {
            $sql = "
                SELECT 
                    r.id,
                    u.name,
                    v.location,
                    u.avatar as image,
                    r.rating,
                    r.comment as text,
                    DATE_FORMAT(r.created_at, '%M %Y') as date,
                    v.business_name as vendor_name,
                    v.category as service_type
                FROM reviews r
                JOIN users u ON r.user_id = u.id
                JOIN vendors v ON r.vendor_id = v.id
                WHERE r.rating >= 4 AND r.comment IS NOT NULL AND r.comment != ''
                ORDER BY r.rating DESC, r.created_at DESC
                LIMIT :limit
            ";
            
            $stmt = $pdo->prepare($sql);
            $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
            $stmt->execute();
            
            $testimonials = $stmt->fetchAll(PDO::FETCH_ASSOC);
        }
    }
    
    // If still no testimonials, return default featured testimonials
    if (empty($testimonials)) {
        // Check if we have any completed bookings to create testimonials from
        $bookingCheck = $pdo->query("
            SELECT COUNT(*) FROM bookings 
            WHERE status = 'completed' AND payment_status = 'paid'
        ");
        $hasCompletedBookings = $bookingCheck->fetchColumn() > 0;
        
        if ($hasCompletedBookings) {
            // Generate from completed bookings
            $sql = "
                SELECT 
                    b.id,
                    u.name,
                    COALESCE(v.location, 'Metro Manila') as location,
                    u.avatar as image,
                    5 as rating,
                    CONCAT('Had an amazing experience with ', v.business_name, '. Highly recommended for any wedding!') as text,
                    DATE_FORMAT(b.event_date, '%M %Y') as date,
                    v.business_name as vendor_name,
                    v.category as service_type
                FROM bookings b
                JOIN users u ON b.user_id = u.id
                JOIN vendors v ON b.vendor_id = v.id
                WHERE b.status = 'completed' OR b.payment_status = 'paid'
                ORDER BY b.event_date DESC
                LIMIT :limit
            ";
            
            $stmt = $pdo->prepare($sql);
            $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
            $stmt->execute();
            
            $testimonials = $stmt->fetchAll(PDO::FETCH_ASSOC);
        }
    }
    
    // Process testimonials
    foreach ($testimonials as &$testimonial) {
        $testimonial['id'] = (int)$testimonial['id'];
        $testimonial['rating'] = (int)$testimonial['rating'];
        
        // Provide default image if none exists
        if (empty($testimonial['image'])) {
            $testimonial['image'] = null;
        }
    }
    
    echo json_encode([
        'success' => true,
        'testimonials' => $testimonials,
        'count' => count($testimonials),
        'source' => $hasTestimonialsTable ? 'testimonials' : (!empty($testimonials) ? 'reviews' : 'generated')
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Failed to fetch testimonials',
        'message' => $e->getMessage()
    ]);
}
