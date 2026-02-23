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
            SELECT s.*, v.business_name as vendor_name, v.verification_status as vendor_status,
                   u.email as vendor_email
            FROM services s
            JOIN vendors v ON s.vendor_id = v.id
            JOIN users u ON v.user_id = u.id
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

        // Count total
        $countSql = preg_replace('/SELECT .* FROM/', 'SELECT COUNT(*) as total FROM', $sql);
        $stmt = $pdo->prepare($countSql);
        $stmt->execute($params);
        $total = $stmt->fetch(PDO::FETCH_ASSOC)['total'];

        $sql .= " ORDER BY s.created_at DESC LIMIT $limit OFFSET $offset";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $services = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Decode JSON fields
        foreach ($services as &$service) {
            $service['pricing_items'] = $service['pricing_items'] ? json_decode($service['pricing_items'], true) : [];
            $service['add_ons'] = $service['add_ons'] ? json_decode($service['add_ons'], true) : [];
            $service['inclusions'] = $service['inclusions'] ? json_decode($service['inclusions'], true) : [];
            $service['images'] = $service['images'] ? json_decode($service['images'], true) : [];
        }

        // Get stats
        $stmt = $pdo->query("SELECT category, COUNT(*) as count FROM services GROUP BY category ORDER BY count DESC");
        $categoryStats = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $categoryStats[$row['category']] = (int)$row['count'];
        }

        $stmt = $pdo->query("SELECT COUNT(*) as total, SUM(is_active) as active FROM services");
        $totals = $stmt->fetch(PDO::FETCH_ASSOC);

        echo json_encode([
            'success' => true,
            'services' => $services,
            'pagination' => [
                'page' => $page,
                'limit' => $limit,
                'total' => (int)$total,
                'totalPages' => ceil($total / $limit)
            ],
            'stats' => [
                'total' => (int)$totals['total'],
                'active' => (int)$totals['active'],
                'inactive' => (int)$totals['total'] - (int)$totals['active'],
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
    $isActive = $input['is_active'] ?? null;

    if (!$serviceId || $isActive === null) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Service ID and is_active required']);
        exit;
    }

    try {
        $stmt = $pdo->prepare("UPDATE services SET is_active = ? WHERE id = ?");
        $stmt->execute([$isActive ? 1 : 0, $serviceId]);

        // Log activity
        $action = $isActive ? 'enabled' : 'disabled';
        $stmt = $pdo->prepare("INSERT INTO activity_logs (user_id, action, entity_type, entity_id, description, ip_address) VALUES (?, ?, 'service', ?, ?, ?)");
        $stmt->execute([$user['id'], "service_$action", $serviceId, "Service #$serviceId $action by admin", $_SERVER['REMOTE_ADDR'] ?? '']);

        echo json_encode(['success' => true, 'message' => "Service $action"]);

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
}
