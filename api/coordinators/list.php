<?php
// List coordinators endpoint for Wedding Bazaar

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

// Get query parameters
$location = isset($_GET['location']) ? trim($_GET['location']) : null;
$page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
$limit = isset($_GET['limit']) ? min((int)$_GET['limit'], 50) : 12;
$offset = ($page - 1) * $limit;

// Get database connection
$pdo = getDBConnection();

try {
    // Build query - using coordinators table
    $where = ["c.is_active = 1"];
    $params = [];

    if ($location) {
        $where[] = 'c.location LIKE ?';
        $params[] = '%' . $location . '%';
    }

    $whereClause = implode(' AND ', $where);

    // Get total count
    $countSql = "SELECT COUNT(*) FROM coordinators c WHERE $whereClause";
    $countStmt = $pdo->prepare($countSql);
    $countStmt->execute($params);
    $total = (int)$countStmt->fetchColumn();

    // Get coordinators
    $sql = "
        SELECT 
            c.id,
            c.user_id,
            c.business_name,
            'coordinator' as category,
            c.description,
            c.location,
            c.price_range,
            c.rating,
            c.review_count,
            c.images,
            c.specialties,
            c.weddings_completed,
            CASE WHEN c.verification_status = 'verified' THEN 1 ELSE 0 END as is_verified,
            u.name as owner_name,
            u.phone,
            u.email
        FROM coordinators c
        JOIN users u ON c.user_id = u.id
        WHERE $whereClause
        ORDER BY c.verification_status DESC, c.rating DESC
        LIMIT ? OFFSET ?
    ";

    $params[] = $limit;
    $params[] = $offset;

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $coordinators = $stmt->fetchAll();

    // Parse JSON fields
    foreach ($coordinators as &$coordinator) {
        $coordinator['id'] = (int)$coordinator['id'];
        $coordinator['user_id'] = (int)$coordinator['user_id'];
        $coordinator['images'] = $coordinator['images'] ? json_decode($coordinator['images'], true) : [];
        $coordinator['specialties'] = $coordinator['specialties'] ? json_decode($coordinator['specialties'], true) : [];
        $coordinator['rating'] = (float)$coordinator['rating'];
        $coordinator['review_count'] = (int)$coordinator['review_count'];
        $coordinator['weddings_completed'] = (int)$coordinator['weddings_completed'];
        $coordinator['is_verified'] = (bool)$coordinator['is_verified'];
        $coordinator['services'] = []; // Coordinators don't have separate services for now
    }

    echo json_encode([
        'success' => true,
        'data' => [
            'coordinators' => $coordinators,
            'pagination' => [
                'page' => $page,
                'limit' => $limit,
                'total' => $total,
                'totalPages' => ceil($total / $limit)
            ]
        ]
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Failed to fetch coordinators',
        'debug' => $e->getMessage()
    ]);
}
