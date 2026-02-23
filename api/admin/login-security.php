<?php
/**
 * Admin Login Security API
 * GET: List login attempts and account lockouts
 * POST: Unlock an account
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
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
    $type = $_GET['type'] ?? 'attempts'; // 'attempts' or 'lockouts'
    $page = (int)($_GET['page'] ?? 1);
    $limit = (int)($_GET['limit'] ?? 50);
    $offset = ($page - 1) * $limit;
    $statusFilter = $_GET['status'] ?? null;
    $search = $_GET['search'] ?? null;

    try {
        if ($type === 'attempts') {
            // Build WHERE conditions
            $where = [];
            $params = [];
            
            if ($statusFilter && in_array($statusFilter, ['success', 'failed', 'blocked'])) {
                $where[] = "la.status = ?";
                $params[] = $statusFilter;
            }
            
            if ($search) {
                $where[] = "(la.email LIKE ? OR la.ip_address LIKE ? OR u.name LIKE ?)";
                $params[] = "%$search%";
                $params[] = "%$search%";
                $params[] = "%$search%";
            }
            
            $whereClause = count($where) > 0 ? "WHERE " . implode(" AND ", $where) : "";
            
            $sql = "
                SELECT la.id, la.user_id, la.email, la.ip_address, la.user_agent,
                       la.status, la.failure_reason, la.created_at,
                       u.name as user_name, u.role as user_role
                FROM login_attempts la
                LEFT JOIN users u ON la.user_id = u.id
                $whereClause
                ORDER BY la.created_at DESC
                LIMIT $limit OFFSET $offset
            ";
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            $data = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Count total for pagination
            $countSql = "SELECT COUNT(*) as total FROM login_attempts la LEFT JOIN users u ON la.user_id = u.id $whereClause";
            $stmt = $pdo->prepare($countSql);
            $stmt->execute($params);
            $total = $stmt->fetch(PDO::FETCH_ASSOC)['total'];

            // Get stats (last 24 hours)
            $stmt = $pdo->query("SELECT COUNT(*) as count FROM login_attempts WHERE status = 'success' AND created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)");
            $successCount = $stmt->fetch(PDO::FETCH_ASSOC)['count'];

            $stmt = $pdo->query("SELECT COUNT(*) as count FROM login_attempts WHERE status = 'failed' AND created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)");
            $failedCount = $stmt->fetch(PDO::FETCH_ASSOC)['count'];

            $stmt = $pdo->query("SELECT COUNT(*) as count FROM login_attempts WHERE status = 'blocked' AND created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)");
            $blockedCount = $stmt->fetch(PDO::FETCH_ASSOC)['count'];

            echo json_encode([
                'success' => true,
                'attempts' => $data,
                'pagination' => [
                    'page' => $page,
                    'limit' => $limit,
                    'total' => (int)$total,
                    'totalPages' => ceil($total / $limit)
                ],
                'stats' => [
                    'success' => (int)$successCount,
                    'failed' => (int)$failedCount,
                    'blocked' => (int)$blockedCount
                ]
            ]);

        } else {
            $sql = "
                SELECT al.*, 
                       u.name as user_name, u.email as user_email, u.role as user_role,
                       admin.name as unlocked_by_name
                FROM account_lockouts al
                JOIN users u ON al.user_id = u.id
                LEFT JOIN users admin ON al.unlocked_by = admin.id
                ORDER BY al.locked_at DESC
                LIMIT $limit OFFSET $offset
            ";
            $stmt = $pdo->query($sql);
            $data = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $stmt = $pdo->query("SELECT COUNT(*) as total FROM account_lockouts");
            $total = $stmt->fetch(PDO::FETCH_ASSOC)['total'];

            $stmt = $pdo->query("SELECT COUNT(*) as count FROM account_lockouts WHERE unlocked_at IS NULL");
            $activeLockouts = $stmt->fetch(PDO::FETCH_ASSOC)['count'];

            echo json_encode([
                'success' => true,
                'lockouts' => $data,
                'pagination' => [
                    'page' => $page,
                    'limit' => $limit,
                    'total' => (int)$total,
                    'totalPages' => ceil($total / $limit)
                ],
                'stats' => [
                    'activeLockouts' => (int)$activeLockouts
                ]
            ]);
        }

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }

} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $action = $input['action'] ?? null;

    if ($action === 'unlock') {
        $lockoutId = $input['lockout_id'] ?? null;
        $reason = $input['reason'] ?? 'Unlocked by admin';

        if (!$lockoutId) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Lockout ID required']);
            exit;
        }

        try {
            $stmt = $pdo->prepare("
                UPDATE account_lockouts 
                SET unlocked_at = NOW(), unlocked_by = ?, unlock_reason = ?
                WHERE id = ? AND unlocked_at IS NULL
            ");
            $stmt->execute([$user['id'], $reason, $lockoutId]);

            if ($stmt->rowCount() > 0) {
                echo json_encode(['success' => true, 'message' => 'Account unlocked']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Lockout not found or already unlocked']);
            }

        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
        }
    }
}
