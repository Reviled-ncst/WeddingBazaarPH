<?php
/**
 * List Vendor Availability API
 * 
 * GET - List vendor availability postings
 * Query params: vendor_id, location, date_from, date_to, category
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
    
    // Pagination
    $page = isset($_GET['page']) ? max(1, (int)$_GET['page']) : 1;
    $limit = isset($_GET['limit']) ? min(50, max(1, (int)$_GET['limit'])) : 20;
    $offset = ($page - 1) * $limit;
    
    // Build WHERE conditions
    $conditions = ["va.status = 'active'", "va.available_to >= CURDATE()"];
    $params = [];
    
    if (!empty($_GET['vendor_id'])) {
        $conditions[] = "va.vendor_id = :vendor_id";
        $params[':vendor_id'] = (int)$_GET['vendor_id'];
        // If viewing own availability, show all statuses
        $conditions = array_filter($conditions, fn($c) => $c !== "va.status = 'active'");
    }
    
    if (!empty($_GET['category'])) {
        $conditions[] = "v.category = :category";
        $params[':category'] = $_GET['category'];
    }
    
    if (!empty($_GET['location'])) {
        $conditions[] = "(v.location LIKE :location OR va.locations LIKE :location2)";
        $params[':location'] = '%' . $_GET['location'] . '%';
        $params[':location2'] = '%' . $_GET['location'] . '%';
    }
    
    if (!empty($_GET['date_from'])) {
        $conditions[] = "va.available_to >= :date_from";
        $params[':date_from'] = $_GET['date_from'];
    }
    
    if (!empty($_GET['date_to'])) {
        $conditions[] = "va.available_from <= :date_to";
        $params[':date_to'] = $_GET['date_to'];
    }
    
    $whereClause = implode(' AND ', $conditions);
    
    // Count total
    $countSql = "SELECT COUNT(*) as total FROM vendor_availability va JOIN vendors v ON va.vendor_id = v.id WHERE $whereClause";
    $countStmt = $conn->prepare($countSql);
    $countStmt->execute($params);
    $total = $countStmt->fetch(PDO::FETCH_ASSOC)['total'];
    
    // Fetch availability with vendor info
    $sql = "SELECT 
        va.*,
        v.business_name,
        v.category,
        v.location as vendor_location,
        v.rating,
        v.review_count,
        v.price_range,
        v.images,
        v.is_verified
    FROM vendor_availability va
    JOIN vendors v ON va.vendor_id = v.id
    WHERE $whereClause
    ORDER BY va.available_from ASC, va.created_at DESC
    LIMIT :limit OFFSET :offset";
    
    $stmt = $conn->prepare($sql);
    foreach ($params as $key => $value) {
        $stmt->bindValue($key, $value);
    }
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();
    
    $availability = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Parse JSON fields
    foreach ($availability as &$item) {
        $item['locations'] = $item['locations'] ? json_decode($item['locations'], true) : [];
        $item['services_offered'] = $item['services_offered'] ? json_decode($item['services_offered'], true) : [];
        $item['images'] = $item['images'] ? json_decode($item['images'], true) : [];
    }
    
    echo json_encode([
        'success' => true,
        'data' => $availability,
        'pagination' => [
            'page' => $page,
            'limit' => $limit,
            'total' => (int)$total,
            'pages' => ceil($total / $limit)
        ]
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
