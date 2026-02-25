<?php
// Get coordinator detail by ID - public endpoint for browsing

require_once __DIR__ . '/../config/database.php';

setJsonHeader();
setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

// Get coordinator ID from query params
$coordinatorId = isset($_GET['id']) ? intval($_GET['id']) : 0;

if (!$coordinatorId) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Coordinator ID is required']);
    exit;
}

$pdo = getDBConnection();

try {
    // Get coordinator details
    $query = "SELECT 
                c.*,
                c.user_id,
                u.email,
                u.name as owner_name,
                u.phone
              FROM coordinators c
              JOIN users u ON c.user_id = u.id
              WHERE c.id = ? AND c.is_active = 1";

    $stmt = $pdo->prepare($query);
    $stmt->execute([$coordinatorId]);
    $coordinator = $stmt->fetch();

    if (!$coordinator) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Coordinator not found']);
        exit;
    }

    // Parse JSON fields
    $coordinator['images'] = $coordinator['images'] ? json_decode($coordinator['images'], true) : [];
    $coordinator['specialties'] = $coordinator['specialties'] ? json_decode($coordinator['specialties'], true) : [];

    // Convert numeric fields
    $coordinator['id'] = (int)$coordinator['id'];
    $coordinator['user_id'] = (int)$coordinator['user_id'];
    $coordinator['rating'] = (float)$coordinator['rating'];
    $coordinator['review_count'] = (int)$coordinator['review_count'];
    $coordinator['weddings_completed'] = (int)$coordinator['weddings_completed'];
    $coordinator['is_verified'] = $coordinator['verification_status'] === 'verified';
    $coordinator['latitude'] = $coordinator['latitude'] ? (float)$coordinator['latitude'] : null;
    $coordinator['longitude'] = $coordinator['longitude'] ? (float)$coordinator['longitude'] : null;
    $coordinator['base_travel_fee'] = $coordinator['base_travel_fee'] ? (float)$coordinator['base_travel_fee'] : 0;
    $coordinator['per_km_rate'] = $coordinator['per_km_rate'] ? (float)$coordinator['per_km_rate'] : 0;
    $coordinator['free_km_radius'] = $coordinator['free_km_radius'] ? (int)$coordinator['free_km_radius'] : 0;

    // Get affiliated vendors
    $vendorsQuery = "SELECT 
                        v.id,
                        v.business_name,
                        v.category,
                        v.description,
                        v.location,
                        v.price_range,
                        v.rating,
                        v.review_count,
                        v.images,
                        CASE WHEN v.verification_status = 'verified' THEN 1 ELSE 0 END as is_verified,
                        cv.status as affiliation_status,
                        cv.commission_rate,
                        cv.notes as affiliation_notes
                     FROM coordinator_vendors cv
                     JOIN vendors v ON cv.vendor_id = v.id
                     WHERE cv.coordinator_id = ? AND cv.status = 'active' AND v.is_active = 1
                     ORDER BY v.rating DESC";
    
    $vendorsStmt = $pdo->prepare($vendorsQuery);
    $vendorsStmt->execute([$coordinatorId]);
    $affiliatedVendors = $vendorsStmt->fetchAll();

    // Parse vendor JSON fields
    foreach ($affiliatedVendors as &$vendor) {
        $vendor['images'] = $vendor['images'] ? json_decode($vendor['images'], true) : [];
        $vendor['id'] = (int)$vendor['id'];
        $vendor['rating'] = (float)$vendor['rating'];
        $vendor['review_count'] = (int)$vendor['review_count'];
        $vendor['is_verified'] = (bool)$vendor['is_verified'];
        $vendor['commission_rate'] = (float)$vendor['commission_rate'];
    }

    $coordinator['affiliated_vendors'] = $affiliatedVendors;

    // Get packages
    $packagesQuery = "SELECT 
                        cp.id,
                        cp.name,
                        cp.description,
                        cp.package_type,
                        cp.base_price,
                        cp.discount_percentage,
                        cp.is_featured
                      FROM coordinator_packages cp
                      WHERE cp.coordinator_id = ? AND cp.is_active = 1
                      ORDER BY cp.is_featured DESC, cp.base_price ASC";
    
    $packagesStmt = $pdo->prepare($packagesQuery);
    $packagesStmt->execute([$coordinatorId]);
    $packages = $packagesStmt->fetchAll();

    // Get package items for each package
    foreach ($packages as &$package) {
        $package['id'] = (int)$package['id'];
        $package['base_price'] = (float)$package['base_price'];
        $package['discount_percentage'] = (float)$package['discount_percentage'];
        $package['is_featured'] = (bool)$package['is_featured'];
        $package['discounted_price'] = $package['base_price'] * (1 - $package['discount_percentage'] / 100);

        // Get vendors in this package
        $itemsQuery = "SELECT 
                        cpi.id,
                        cpi.vendor_id,
                        cpi.service_id,
                        cpi.custom_price,
                        cpi.notes,
                        v.business_name,
                        v.category,
                        v.images as vendor_images,
                        s.name as service_name,
                        s.base_total as service_price
                       FROM coordinator_package_items cpi
                       JOIN vendors v ON cpi.vendor_id = v.id
                       LEFT JOIN services s ON cpi.service_id = s.id
                       WHERE cpi.package_id = ?";
        
        $itemsStmt = $pdo->prepare($itemsQuery);
        $itemsStmt->execute([$package['id']]);
        $items = $itemsStmt->fetchAll();

        foreach ($items as &$item) {
            $item['id'] = (int)$item['id'];
            $item['vendor_id'] = (int)$item['vendor_id'];
            $item['service_id'] = $item['service_id'] ? (int)$item['service_id'] : null;
            $item['custom_price'] = $item['custom_price'] ? (float)$item['custom_price'] : null;
            $item['service_price'] = $item['service_price'] ? (float)$item['service_price'] : null;
            $item['vendor_images'] = $item['vendor_images'] ? json_decode($item['vendor_images'], true) : [];
        }

        $package['items'] = $items;
    }

    $coordinator['packages'] = $packages;

    // Get reviews for coordinator
    $reviewsQuery = "SELECT 
                        r.id,
                        r.rating,
                        r.comment,
                        r.created_at,
                        u.name as user_name
                     FROM reviews r
                     JOIN users u ON r.user_id = u.id
                     JOIN coordinators c ON c.user_id = r.vendor_id
                     WHERE c.id = ?
                     ORDER BY r.created_at DESC
                     LIMIT 10";
    
    // Note: For now we'll return empty reviews since the reviews table references vendor_id
    // In a full implementation, we'd need a coordinator_reviews table or modify the reviews table
    $coordinator['reviews'] = [];

    echo json_encode([
        'success' => true,
        'data' => $coordinator
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
?>
