<?php
/**
 * List Job Postings API
 * 
 * GET - List all job postings with filters
 * Query params: category, location, status, coordinator_id, page, limit
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
    $conditions = ["jp.status = 'open'", "(jp.expires_at IS NULL OR jp.expires_at > NOW())"];
    $params = [];
    
    if (!empty($_GET['category'])) {
        $conditions[] = "jp.category = :category";
        $params[':category'] = $_GET['category'];
    }
    
    if (!empty($_GET['location'])) {
        $conditions[] = "jp.location LIKE :location";
        $params[':location'] = '%' . $_GET['location'] . '%';
    }
    
    if (!empty($_GET['coordinator_id'])) {
        $conditions[] = "jp.coordinator_id = :coordinator_id";
        $params[':coordinator_id'] = (int)$_GET['coordinator_id'];
        // If viewing own jobs, show all statuses
        $conditions = array_filter($conditions, fn($c) => $c !== "jp.status = 'open'");
    }
    
    if (!empty($_GET['status'])) {
        $conditions[] = "jp.status = :status";
        $params[':status'] = $_GET['status'];
    }
    
    if (!empty($_GET['urgency'])) {
        $conditions[] = "jp.urgency = :urgency";
        $params[':urgency'] = $_GET['urgency'];
    }
    
    $whereClause = implode(' AND ', $conditions);
    
    // Count total
    $countSql = "SELECT COUNT(*) as total FROM job_postings jp WHERE $whereClause";
    $countStmt = $conn->prepare($countSql);
    $countStmt->execute($params);
    $total = $countStmt->fetch(PDO::FETCH_ASSOC)['total'];
    
    // Fetch jobs with coordinator info
    $sql = "SELECT 
        jp.*,
        c.business_name as coordinator_name,
        c.rating as coordinator_rating,
        c.review_count as coordinator_reviews,
        c.weddings_completed,
        u.name as owner_name
    FROM job_postings jp
    JOIN coordinators c ON jp.coordinator_id = c.id
    JOIN users u ON c.user_id = u.id
    WHERE $whereClause
    ORDER BY 
        CASE jp.urgency 
            WHEN 'urgent' THEN 1 
            WHEN 'high' THEN 2 
            WHEN 'medium' THEN 3 
            ELSE 4 
        END,
        jp.created_at DESC
    LIMIT :limit OFFSET :offset";
    
    $stmt = $conn->prepare($sql);
    foreach ($params as $key => $value) {
        $stmt->bindValue($key, $value);
    }
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();
    
    $jobs = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Parse JSON fields
    foreach ($jobs as &$job) {
        $job['requirements'] = $job['requirements'] ? json_decode($job['requirements'], true) : [];
    }
    
    echo json_encode([
        'success' => true,
        'data' => $jobs,
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
