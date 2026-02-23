<?php
// Get single vendor details

require_once __DIR__ . '/../config/database.php';

// Set headers
setJsonHeader();
setCorsHeaders();

// Only accept GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => 'Method not allowed'
    ]);
    exit;
}

// Get vendor ID
$id = isset($_GET['id']) ? (int)$_GET['id'] : 0;

if (!$id) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Vendor ID is required'
    ]);
    exit;
}

$pdo = getDBConnection();

try {
    // Get vendor details
    $sql = "
        SELECT 
            v.id,
            v.business_name,
            v.category,
            v.description,
            v.location,
            v.latitude,
            v.longitude,
            v.price_range,
            v.rating,
            v.review_count,
            v.images,
            v.is_verified,
            v.created_at,
            v.base_travel_fee,
            v.per_km_rate,
            v.free_km_radius,
            u.name as owner_name,
            u.phone,
            u.email
        FROM vendors v
        JOIN users u ON v.user_id = u.id
        WHERE v.id = ? AND v.is_active = 1
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([$id]);
    $vendor = $stmt->fetch();

    if (!$vendor) {
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'message' => 'Vendor not found'
        ]);
        exit;
    }

    // Parse JSON images
    $vendor['images'] = $vendor['images'] ? json_decode($vendor['images'], true) : [];
    $vendor['rating'] = (float)$vendor['rating'];
    $vendor['review_count'] = (int)$vendor['review_count'];
    $vendor['is_verified'] = (bool)$vendor['is_verified'];
    
    // Parse travel fee numbers
    $vendor['latitude'] = $vendor['latitude'] ? (float)$vendor['latitude'] : null;
    $vendor['longitude'] = $vendor['longitude'] ? (float)$vendor['longitude'] : null;
    $vendor['base_travel_fee'] = $vendor['base_travel_fee'] ? (float)$vendor['base_travel_fee'] : 0;
    $vendor['per_km_rate'] = $vendor['per_km_rate'] ? (float)$vendor['per_km_rate'] : 0;
    $vendor['free_km_radius'] = $vendor['free_km_radius'] ? (float)$vendor['free_km_radius'] : 0;

    // Get services
    $servicesSql = "
        SELECT id, name, description, pricing_items, base_total, add_ons, details, inclusions, images, is_active, max_bookings_per_day
        FROM services
        WHERE vendor_id = ? AND is_active = 1
        ORDER BY base_total ASC
    ";
    $servicesStmt = $pdo->prepare($servicesSql);
    $servicesStmt->execute([$id]);
    $services = $servicesStmt->fetchAll();

    foreach ($services as &$service) {
        $service['price'] = (float)$service['base_total']; // backward compatibility
        $service['base_total'] = (float)$service['base_total'];
        $service['pricing_items'] = $service['pricing_items'] ? json_decode($service['pricing_items'], true) : [];
        $service['add_ons'] = $service['add_ons'] ? json_decode($service['add_ons'], true) : [];
        $service['details'] = $service['details'] ? json_decode($service['details'], true) : [];
        $service['inclusions'] = $service['inclusions'] ? json_decode($service['inclusions'], true) : [];
        $service['images'] = $service['images'] ? json_decode($service['images'], true) : [];
        $service['is_active'] = (bool)$service['is_active'];
        $service['max_bookings_per_day'] = (int)($service['max_bookings_per_day'] ?? 1);
    }

    $vendor['services'] = $services;

    // Get reviews
    $reviewsSql = "
        SELECT 
            r.id,
            r.rating,
            r.comment,
            r.created_at,
            u.name as user_name
        FROM reviews r
        JOIN users u ON r.user_id = u.id
        WHERE r.vendor_id = ?
        ORDER BY r.created_at DESC
        LIMIT 10
    ";
    $reviewsStmt = $pdo->prepare($reviewsSql);
    $reviewsStmt->execute([$id]);
    $reviews = $reviewsStmt->fetchAll();

    foreach ($reviews as &$review) {
        $review['rating'] = (int)$review['rating'];
    }

    $vendor['reviews'] = $reviews;

    echo json_encode([
        'success' => true,
        'data' => $vendor
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Failed to fetch vendor details'
    ]);
}
