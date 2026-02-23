<?php
/**
 * Admin Activity Logs API
 * GET: List activity logs with filters
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/jwt.php';

$user = verifyJWT();
if (!$user || $user['role'] !== 'admin') {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$pdo = getDBConnection();

// Get query parameters
$action = $_GET['action'] ?? null;
$role = $_GET['role'] ?? null;
$dateFrom = $_GET['date_from'] ?? null;
$dateTo = $_GET['date_to'] ?? null;
$search = $_GET['search'] ?? null;
$page = (int)($_GET['page'] ?? 1);
$limit = (int)($_GET['limit'] ?? 50);
$offset = ($page - 1) * $limit;

try {
    $sql = "
        SELECT al.*, u.name as user_name, u.email as user_email, u.role as user_role
        FROM activity_logs al
        JOIN users u ON al.user_id = u.id
        WHERE 1=1
    ";
    $params = [];

    if ($action) {
        $sql .= " AND al.action = ?";
        $params[] = $action;
    }

    if ($role) {
        $sql .= " AND u.role = ?";
        $params[] = $role;
    }

    if ($dateFrom) {
        $sql .= " AND al.created_at >= ?";
        $params[] = $dateFrom . ' 00:00:00';
    }

    if ($dateTo) {
        $sql .= " AND al.created_at <= ?";
        $params[] = $dateTo . ' 23:59:59';
    }

    if ($search) {
        $sql .= " AND (u.name LIKE ? OR u.email LIKE ? OR al.description LIKE ? OR al.ip_address LIKE ?)";
        $searchTerm = "%$search%";
        $params = array_merge($params, [$searchTerm, $searchTerm, $searchTerm, $searchTerm]);
    }

    // Count total
    $countSql = str_replace("SELECT al.*, u.name as user_name, u.email as user_email, u.role as user_role", "SELECT COUNT(*) as total", $sql);
    $stmt = $pdo->prepare($countSql);
    $stmt->execute($params);
    $total = $stmt->fetch(PDO::FETCH_ASSOC)['total'];

    // Get paginated results
    $sql .= " ORDER BY al.created_at DESC LIMIT $limit OFFSET $offset";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $logs = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Get action types for filter
    $stmt = $pdo->query("SELECT DISTINCT action FROM activity_logs ORDER BY action");
    $actionTypes = $stmt->fetchAll(PDO::FETCH_COLUMN);

    echo json_encode([
        'success' => true,
        'logs' => $logs,
        'pagination' => [
            'page' => $page,
            'limit' => $limit,
            'total' => (int)$total,
            'totalPages' => ceil($total / $limit)
        ],
        'filters' => [
            'actionTypes' => $actionTypes
        ]
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
