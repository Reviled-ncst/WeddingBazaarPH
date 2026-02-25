<?php
/**
 * List Job Applications API
 * 
 * GET - List applications for a job (coordinator) or by vendor
 * Query params: job_id, vendor_id, status
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../../config/database.php';

try {
    $database = new Database();
    $conn = $database->getConnection();
    
    $conditions = [];
    $params = [];
    
    // Filter by job
    if (!empty($_GET['job_id'])) {
        $conditions[] = "ja.job_id = :job_id";
        $params[':job_id'] = (int)$_GET['job_id'];
    }
    
    // Filter by vendor (vendor viewing their own applications)
    if (!empty($_GET['vendor_id'])) {
        $conditions[] = "ja.vendor_id = :vendor_id";
        $params[':vendor_id'] = (int)$_GET['vendor_id'];
    }
    
    // Filter by status
    if (!empty($_GET['status'])) {
        $conditions[] = "ja.status = :status";
        $params[':status'] = $_GET['status'];
    }
    
    if (empty($conditions)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Must specify job_id or vendor_id']);
        exit;
    }
    
    $whereClause = implode(' AND ', $conditions);
    
    $sql = "SELECT 
        ja.*,
        v.business_name as vendor_name,
        v.category as vendor_category,
        v.rating as vendor_rating,
        v.review_count as vendor_reviews,
        v.price_range as vendor_price_range,
        v.location as vendor_location,
        v.images as vendor_images,
        v.is_verified as vendor_verified,
        jp.title as job_title,
        jp.category as job_category,
        jp.event_date as job_event_date,
        c.business_name as coordinator_name
    FROM job_applications ja
    JOIN vendors v ON ja.vendor_id = v.id
    JOIN job_postings jp ON ja.job_id = jp.id
    JOIN coordinators c ON jp.coordinator_id = c.id
    WHERE $whereClause
    ORDER BY 
        CASE ja.status WHEN 'pending' THEN 1 WHEN 'shortlisted' THEN 2 ELSE 3 END,
        ja.created_at DESC";
    
    $stmt = $conn->prepare($sql);
    $stmt->execute($params);
    $applications = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Parse JSON fields
    foreach ($applications as &$app) {
        $app['portfolio_links'] = $app['portfolio_links'] ? json_decode($app['portfolio_links'], true) : [];
        $app['vendor_images'] = $app['vendor_images'] ? json_decode($app['vendor_images'], true) : [];
    }
    
    echo json_encode([
        'success' => true,
        'data' => $applications
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
