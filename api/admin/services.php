<?php
/**
 * Admin Services API
 * GET: List all services across vendors
 * PUT: Update service status
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, PUT, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/jwt.php';

$user = getAuthUser();
if (!$user || $user['role'] !== 'admin') {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$pdo = getDBConnection();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $category = $_GET['category'] ?? null;
    $status = $_GET['status'] ?? null;
    $search = $_GET['search'] ?? null;
    $page = (int)($_GET['page'] ?? 1);
    $limit = (int)($_GET['limit'] ?? 20);
    $offset = ($page - 1) * $limit;

    try {
        $sql = "
            SELECT s.*, 
                   v.id as vendor_id, v.business_name as vendor_name, 
                   v.verification_status as vendor_status, v.city as vendor_city,
                   u.email as vendor_email,
                   COALESCE(r.avg_rating, 0) as rating,
                   COALESCE(r.review_count, 0) as review_count,
                   COALESCE(b.booking_count, 0) as booking_count
            FROM services s
            JOIN vendors v ON s.vendor_id = v.id
            JOIN users u ON v.user_id = u.id
            LEFT JOIN (
                SELECT vendor_id, AVG(rating) as avg_rating, COUNT(*) as review_count 
                FROM reviews GROUP BY vendor_id
            ) r ON v.id = r.vendor_id
            LEFT JOIN (
                SELECT vendor_id, COUNT(*) as booking_count 
                FROM bookings WHERE status != 'cancelled' GROUP BY vendor_id
            ) b ON v.id = b.vendor_id
            WHERE 1=1
        ";
        $params = [];

        if ($category) {
            $sql .= " AND s.category = ?";
            $params[] = $category;
        }

        if ($status === 'active') {
            $sql .= " AND s.is_active = 1";
        } elseif ($status === 'inactive') {
            $sql .= " AND s.is_active = 0";
        }

        if ($search) {
            $sql .= " AND (s.name LIKE ? OR v.business_name LIKE ?)";
            $searchTerm = "%$search%";
            $params = array_merge($params, [$searchTerm, $searchTerm]);
        }

        // Count total - simpler count query
        $countSql = "SELECT COUNT(*) as total FROM services s 
                     JOIN vendors v ON s.vendor_id = v.id 
                     JOIN users u ON v.user_id = u.id WHERE 1=1";
        if ($category) $countSql .= " AND s.category = ?";
        if ($status === 'active') $countSql .= " AND s.is_active = 1";
        elseif ($status === 'inactive') $countSql .= " AND s.is_active = 0";
        if ($search) $countSql .= " AND (s.name LIKE ? OR v.business_name LIKE ?)";
        
        $stmt = $pdo->prepare($countSql);
        $stmt->execute($params);
        $total = $stmt->fetch(PDO::FETCH_ASSOC)['total'];

        $sql .= " ORDER BY s.created_at DESC LIMIT $limit OFFSET $offset";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $services = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Format services for frontend
        $formattedServices = [];
        foreach ($services as $service) {
            $formattedServices[] = [
                'id' => (int)$service['id'],
                'name' => $service['name'],
                'description' => $service['description'],
                'category' => $service['category'],
                'subcategory' => $service['subcategory'] ?? null,
                'price_range' => $service['base_total'] ? '₱' . number_format($service['base_total'], 0) : 'Contact for price',
                'location' => $service['vendor_city'] ?? 'Philippines',
                'status' => $service['is_active'] ? 'active' : 'inactive',
                'is_featured' => (bool)($service['is_featured'] ?? false),
                'rating' => round((float)$service['rating'], 1),
                'review_count' => (int)$service['review_count'],
                'booking_count' => (int)$service['booking_count'],
                'created_at' => $service['created_at'],
                'vendor' => [
                    'id' => (int)$service['vendor_id'],
                    'name' => $service['vendor_name'],
                    'verified' => $service['vendor_status'] === 'verified',
                    'email' => $service['vendor_email']
                ],
                'pricing_items' => $service['pricing_items'] ? json_decode($service['pricing_items'], true) : [],
                'add_ons' => $service['add_ons'] ? json_decode($service['add_ons'], true) : [],
                'inclusions' => $service['inclusions'] ? json_decode($service['inclusions'], true) : [],
                'images' => $service['images'] ? json_decode($service['images'], true) : [],
                'base_total' => $service['base_total']
            ];
        }

        // Get stats
        $stmt = $pdo->query("SELECT category, COUNT(*) as count FROM services GROUP BY category ORDER BY count DESC");
        $categoryStats = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $categoryStats[$row['category']] = (int)$row['count'];
        }

        $stmt = $pdo->query("SELECT COUNT(*) as total, SUM(is_active) as active, SUM(is_featured) as featured FROM services");
        $totals = $stmt->fetch(PDO::FETCH_ASSOC);
        
        $activeCount = (int)($totals['active'] ?? 0);
        $inactiveCount = (int)$totals['total'] - $activeCount;
        $featuredCount = (int)($totals['featured'] ?? 0);

        echo json_encode([
            'success' => true,
            'services' => $formattedServices,
            'pagination' => [
                'page' => $page,
                'limit' => $limit,
                'total' => (int)$total,
                'totalPages' => ceil($total / $limit)
            ],
            'stats' => [
                'total' => (int)$totals['total'],
                'byStatus' => [
                    'active' => $activeCount,
                    'inactive' => $inactiveCount,
                    'pending' => 0,
                    'flagged' => 0
                ],
                'featured' => $featuredCount,
                'byCategory' => $categoryStats
            ]
        ]);

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }

} elseif ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $input = json_decode(file_get_contents('php://input'), true);
    $serviceId = $input['service_id'] ?? null;
    
    if (!$serviceId) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Service ID required']);
        exit;
    }

    try {
        $updates = [];
        $params = [];
        $actions = [];

        // Handle status update (frontend sends 'status': 'active'/'inactive')
        if (isset($input['status'])) {
            $isActive = $input['status'] === 'active' ? 1 : 0;
            $updates[] = 'is_active = ?';
            $params[] = $isActive;
            $actions[] = $isActive ? 'enabled' : 'disabled';
        }
        
        // Also support direct is_active
        if (isset($input['is_active'])) {
            $isActive = $input['is_active'] ? 1 : 0;
            $updates[] = 'is_active = ?';
            $params[] = $isActive;
            $actions[] = $isActive ? 'enabled' : 'disabled';
        }

        // Handle is_featured update
        if (isset($input['is_featured'])) {
            $updates[] = 'is_featured = ?';
            $params[] = $input['is_featured'] ? 1 : 0;
            $actions[] = $input['is_featured'] ? 'featured' : 'unfeatured';
        }

        if (empty($updates)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'No updates provided']);
            exit;
        }

        $params[] = $serviceId;
        $sql = "UPDATE services SET " . implode(', ', $updates) . " WHERE id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);

        // Log activity
        $actionStr = implode(' and ', $actions);
        $stmt = $pdo->prepare("INSERT INTO activity_logs (user_id, action, entity_type, entity_id, description, ip_address) VALUES (?, ?, 'service', ?, ?, ?)");
        $stmt->execute([$user['id'], "service_update", $serviceId, "Service #$serviceId $actionStr by admin", $_SERVER['REMOTE_ADDR'] ?? '']);

        echo json_encode(['success' => true, 'message' => "Service $actionStr"]);

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
}
