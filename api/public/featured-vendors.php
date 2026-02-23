<?php
/**
 * Get Featured Vendors API
 * Returns top-rated and/or verified vendors for homepage display
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
    
    // Get limit from query params (default 8)
    $limit = isset($_GET['limit']) ? min(20, max(1, (int)$_GET['limit'])) : 8;
    $category = isset($_GET['category']) ? trim($_GET['category']) : null;
    
    // Build query for featured vendors
    // Prioritize verified vendors with highest ratings
    $sql = "
        SELECT 
            v.id,
            v.business_name as name,
            v.category,
            v.location,
            v.city,
            v.province,
            v.rating,
            v.review_count,
            v.price_range,
            v.description,
            v.images,
            v.verification_status,
            CASE WHEN v.verification_status = 'verified' THEN 1 ELSE 0 END as is_verified,
            c.name as category_name,
            c.icon as category_icon,
            (
                SELECT MIN(s.base_total)
                FROM services s 
                WHERE s.vendor_id = v.id AND s.is_active = 1 AND s.base_total > 0
            ) as min_price,
            (
                SELECT MAX(s.base_total)
                FROM services s 
                WHERE s.vendor_id = v.id AND s.is_active = 1 AND s.base_total > 0
            ) as max_price
        FROM vendors v
        LEFT JOIN categories c ON v.category = c.slug
        WHERE v.is_active = 1
    ";
    
    $params = [];
    
    if ($category) {
        $sql .= " AND v.category = :category";
        $params['category'] = $category;
    }
    
    // Order by verified first, then rating, then review count
    $sql .= " ORDER BY 
        CASE WHEN v.verification_status = 'verified' THEN 0 ELSE 1 END,
        v.rating DESC,
        v.review_count DESC
        LIMIT :limit
    ";
    
    $stmt = $pdo->prepare($sql);
    foreach ($params as $key => $value) {
        $stmt->bindValue(":$key", $value);
    }
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->execute();
    
    $vendors = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Process vendor data
    foreach ($vendors as &$vendor) {
        // Parse images JSON
        $vendor['images'] = $vendor['images'] ? json_decode($vendor['images'], true) : [];
        
        // Get first service image or use category placeholder
        $vendor['image'] = null;
        if (!empty($vendor['images'])) {
            $firstImage = is_array($vendor['images'][0]) ? $vendor['images'][0]['url'] : $vendor['images'][0];
            $vendor['image'] = $firstImage;
        }
        
        // If no vendor images, try to get service images
        if (!$vendor['image']) {
            $serviceStmt = $pdo->prepare("
                SELECT images FROM services 
                WHERE vendor_id = :vendor_id AND is_active = 1 AND images IS NOT NULL
                LIMIT 1
            ");
            $serviceStmt->execute(['vendor_id' => $vendor['id']]);
            $service = $serviceStmt->fetch(PDO::FETCH_ASSOC);
            
            if ($service && $service['images']) {
                $serviceImages = json_decode($service['images'], true);
                if (!empty($serviceImages)) {
                    $firstImage = is_array($serviceImages[0]) ? $serviceImages[0]['url'] : $serviceImages[0];
                    $vendor['image'] = $firstImage;
                }
            }
        }
        
        // Format price range from services
        if ($vendor['min_price'] && $vendor['max_price']) {
            $vendor['price_range'] = '₱' . number_format($vendor['min_price']) . ' - ₱' . number_format($vendor['max_price']);
        } elseif (!$vendor['price_range']) {
            $vendor['price_range'] = 'Contact for pricing';
        }
        
        // Format location
        if (!$vendor['location'] && ($vendor['city'] || $vendor['province'])) {
            $parts = array_filter([$vendor['city'], $vendor['province']]);
            $vendor['location'] = implode(', ', $parts);
        }
        
        // Cast numeric values
        $vendor['id'] = (int)$vendor['id'];
        $vendor['rating'] = (float)$vendor['rating'];
        $vendor['review_count'] = (int)$vendor['review_count'];
        $vendor['is_verified'] = (bool)$vendor['is_verified'];
        
        // Clean up internal fields
        unset($vendor['min_price'], $vendor['max_price'], $vendor['city'], $vendor['province']);
    }
    
    echo json_encode([
        'success' => true,
        'vendors' => $vendors,
        'count' => count($vendors)
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Failed to fetch featured vendors',
        'message' => $e->getMessage()
    ]);
}
