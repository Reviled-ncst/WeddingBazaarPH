<?php
/**
 * Admin Location Logs API
 * GET: List location logs
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

$user = getAuthUser();
if (!$user || $user['role'] !== 'admin') {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$pdo = getDBConnection();

$userId = $_GET['user_id'] ?? null;
$purpose = $_GET['purpose'] ?? null;
$dateFrom = $_GET['date_from'] ?? null;
$dateTo = $_GET['date_to'] ?? null;
$page = (int)($_GET['page'] ?? 1);
$limit = (int)($_GET['limit'] ?? 50);
$offset = ($page - 1) * $limit;

try {
    $sql = "
        SELECT ll.*, u.name as user_name, u.email as user_email, u.role as user_role
        FROM location_logs ll
        JOIN users u ON ll.user_id = u.id
        WHERE 1=1
    ";
    $params = [];

    if ($userId) {
        $sql .= " AND ll.user_id = ?";
        $params[] = $userId;
    }

    if ($purpose) {
        $sql .= " AND ll.purpose = ?";
        $params[] = $purpose;
    }

    if ($dateFrom) {
        $sql .= " AND ll.created_at >= ?";
        $params[] = $dateFrom . ' 00:00:00';
    }

    if ($dateTo) {
        $sql .= " AND ll.created_at <= ?";
        $params[] = $dateTo . ' 23:59:59';
    }

    // Count total
    $countSql = str_replace("SELECT ll.*, u.name as user_name, u.email as user_email, u.role as user_role", "SELECT COUNT(*) as total", $sql);
    $stmt = $pdo->prepare($countSql);
    $stmt->execute($params);
    $total = $stmt->fetch(PDO::FETCH_ASSOC)['total'];

    $sql .= " ORDER BY ll.created_at DESC LIMIT $limit OFFSET $offset";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $logs = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Get stats
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM location_logs WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)");
    $logsToday = $stmt->fetch(PDO::FETCH_ASSOC)['count'];

    $stmt = $pdo->query("SELECT COUNT(DISTINCT user_id) as count FROM location_logs WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)");
    $uniqueUsersToday = $stmt->fetch(PDO::FETCH_ASSOC)['count'];

    // Get purposes for filter
    $stmt = $pdo->query("SELECT DISTINCT purpose FROM location_logs WHERE purpose IS NOT NULL ORDER BY purpose");
    $purposes = $stmt->fetchAll(PDO::FETCH_COLUMN);

    echo json_encode([
        'success' => true,
        'logs' => $logs,
        'pagination' => [
            'page' => $page,
            'limit' => $limit,
            'total' => (int)$total,
            'totalPages' => ceil($total / $limit)
        ],
        'stats' => [
            'logsToday' => (int)$logsToday,
            'uniqueUsersToday' => (int)$uniqueUsersToday
        ],
        'filters' => [
            'purposes' => $purposes
        ]
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
