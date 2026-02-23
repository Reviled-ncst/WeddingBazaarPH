<?php
// List vendors endpoint for Wedding Bazaar

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
$category = isset($_GET['category']) ? trim($_GET['category']) : null;
$location = isset($_GET['location']) ? trim($_GET['location']) : null;
$page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
$limit = isset($_GET['limit']) ? min((int)$_GET['limit'], 50) : 12;
$offset = ($page - 1) * $limit;

// Get database connection
$pdo = getDBConnection();

try {
    // Build query
    $where = ['v.is_active = 1', "v.category != 'coordinator'"];
    $params = [];

    if ($category && $category !== 'all') {
        $where[] = 'v.category = ?';
        $params[] = $category;
    }

    if ($location) {
        $where[] = 'v.location LIKE ?';
        $params[] = '%' . $location . '%';
    }

    $whereClause = implode(' AND ', $where);

    // Get total count
    $countSql = "SELECT COUNT(*) FROM vendors v WHERE $whereClause";
    $countStmt = $pdo->prepare($countSql);
    $countStmt->execute($params);
    $total = (int)$countStmt->fetchColumn();

    // Get vendors with calculated price range from services
    $sql = "
        SELECT 
            v.id,
            v.business_name,
            v.category,
            v.description,
            v.location,
            v.price_range,
            v.rating,
            v.review_count,
            v.images,
            v.is_verified,
            u.name as owner_name,
            u.phone,
            u.email,
            MIN(COALESCE(s.price, s.base_total)) as min_price,
            MAX(COALESCE(s.price, s.base_total)) as max_price
        FROM vendors v
        JOIN users u ON v.user_id = u.id
        LEFT JOIN services s ON s.vendor_id = v.id AND s.is_active = 1
        WHERE $whereClause
        GROUP BY v.id, v.business_name, v.category, v.description, v.location, 
                 v.price_range, v.rating, v.review_count, v.images, v.is_verified,
                 u.name, u.phone, u.email
        ORDER BY v.is_verified DESC, v.rating DESC
        LIMIT ? OFFSET ?
    ";

    $params[] = $limit;
    $params[] = $offset;

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $vendors = $stmt->fetchAll();

    // Parse JSON images and calculate price range
    foreach ($vendors as &$vendor) {
        $vendor['images'] = $vendor['images'] ? json_decode($vendor['images'], true) : [];
        $vendor['rating'] = (float)$vendor['rating'];
        $vendor['review_count'] = (int)$vendor['review_count'];
        $vendor['is_verified'] = (bool)$vendor['is_verified'];
        
        // Calculate price_range from services if not set or empty
        if (empty($vendor['price_range']) && $vendor['min_price']) {
            $minPrice = (int)$vendor['min_price'];
            $maxPrice = (int)$vendor['max_price'];
            
            if ($minPrice === $maxPrice) {
                $vendor['price_range'] = '₱' . number_format($minPrice);
            } else {
                $vendor['price_range'] = '₱' . number_format($minPrice) . ' - ₱' . number_format($maxPrice);
            }
        }
        
        // Clean up temp fields
        unset($vendor['min_price'], $vendor['max_price']);
    }

    echo json_encode([
        'success' => true,
        'data' => [
            'vendors' => $vendors,
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
        'message' => 'Failed to fetch vendors'
    ]);
}
