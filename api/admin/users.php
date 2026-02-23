<?php
/**
 * Admin Users API
 * GET: List users with filters
 * PUT: Update user status/role
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

$user = verifyJWT();
if (!$user || $user['role'] !== 'admin') {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$pdo = getDBConnection();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $role = $_GET['role'] ?? null;
    $status = $_GET['status'] ?? null;
    $search = $_GET['search'] ?? null;
    $page = (int)($_GET['page'] ?? 1);
    $limit = (int)($_GET['limit'] ?? 20);
    $offset = ($page - 1) * $limit;

    try {
        $sql = "
            SELECT u.id, u.email, u.name, u.role, u.phone, u.avatar, 
                   u.email_verified, u.status, u.suspended_at, u.suspended_reason,
                   u.created_at, u.updated_at,
                   (SELECT COUNT(*) FROM bookings WHERE user_id = u.id) as booking_count
            FROM users u
            WHERE u.role != 'admin'
        ";
        $params = [];

        if ($role) {
            $sql .= " AND u.role = ?";
            $params[] = $role;
        }

        if ($status) {
            $sql .= " AND u.status = ?";
            $params[] = $status;
        }

        if ($search) {
            $sql .= " AND (u.name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)";
            $searchTerm = "%$search%";
            $params = array_merge($params, [$searchTerm, $searchTerm, $searchTerm]);
        }

        // Count total
        $countSql = preg_replace('/SELECT .* FROM/', 'SELECT COUNT(*) as total FROM', $sql);
        $countSql = preg_replace('/,\s*\(SELECT COUNT.*?\) as booking_count/', '', $countSql);
        $stmt = $pdo->prepare($countSql);
        $stmt->execute($params);
        $total = $stmt->fetch(PDO::FETCH_ASSOC)['total'];

        // Get paginated results
        $sql .= " ORDER BY u.created_at DESC LIMIT $limit OFFSET $offset";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Get vendor/coordinator info for relevant users
        foreach ($users as &$u) {
            if ($u['role'] === 'vendor') {
                $stmt = $pdo->prepare("SELECT business_name, verification_status, rating, review_count FROM vendors WHERE user_id = ?");
                $stmt->execute([$u['id']]);
                $u['vendor'] = $stmt->fetch(PDO::FETCH_ASSOC);
            } elseif ($u['role'] === 'coordinator') {
                $stmt = $pdo->prepare("SELECT business_name, verification_status, rating, review_count FROM coordinators WHERE user_id = ?");
                $stmt->execute([$u['id']]);
                $u['coordinator'] = $stmt->fetch(PDO::FETCH_ASSOC);
            }
        }

        // Get stats
        $stmt = $pdo->query("SELECT role, COUNT(*) as count FROM users WHERE role != 'admin' GROUP BY role");
        $roleStats = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $roleStats[$row['role']] = (int)$row['count'];
        }

        $stmt = $pdo->query("SELECT status, COUNT(*) as count FROM users WHERE role != 'admin' GROUP BY status");
        $statusStats = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $statusStats[$row['status'] ?? 'active'] = (int)$row['count'];
        }

        echo json_encode([
            'success' => true,
            'users' => $users,
            'pagination' => [
                'page' => $page,
                'limit' => $limit,
                'total' => (int)$total,
                'totalPages' => ceil($total / $limit)
            ],
            'stats' => [
                'byRole' => $roleStats,
                'byStatus' => $statusStats
            ]
        ]);

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }

} elseif ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $input = json_decode(file_get_contents('php://input'), true);
    $userId = $input['user_id'] ?? null;
    $action = $input['action'] ?? null;

    if (!$userId || !$action) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'User ID and action required']);
        exit;
    }

    try {
        switch ($action) {
            case 'suspend':
                $reason = $input['reason'] ?? 'Suspended by admin';
                $stmt = $pdo->prepare("UPDATE users SET status = 'suspended', suspended_at = NOW(), suspended_reason = ? WHERE id = ?");
                $stmt->execute([$reason, $userId]);
                
                // Log activity
                $stmt = $pdo->prepare("INSERT INTO activity_logs (user_id, action, entity_type, entity_id, description, ip_address) VALUES (?, 'user_suspend', 'user', ?, ?, ?)");
                $stmt->execute([$user['id'], $userId, "Suspended user #$userId: $reason", $_SERVER['REMOTE_ADDR'] ?? '']);
                break;

            case 'activate':
                $stmt = $pdo->prepare("UPDATE users SET status = 'active', suspended_at = NULL, suspended_reason = NULL WHERE id = ?");
                $stmt->execute([$userId]);
                
                $stmt = $pdo->prepare("INSERT INTO activity_logs (user_id, action, entity_type, entity_id, description, ip_address) VALUES (?, 'user_activate', 'user', ?, ?, ?)");
                $stmt->execute([$user['id'], $userId, "Activated user #$userId", $_SERVER['REMOTE_ADDR'] ?? '']);
                break;

            case 'ban':
                $reason = $input['reason'] ?? 'Banned by admin';
                $stmt = $pdo->prepare("UPDATE users SET status = 'banned', suspended_at = NOW(), suspended_reason = ? WHERE id = ?");
                $stmt->execute([$reason, $userId]);
                
                $stmt = $pdo->prepare("INSERT INTO activity_logs (user_id, action, entity_type, entity_id, description, ip_address) VALUES (?, 'user_ban', 'user', ?, ?, ?)");
                $stmt->execute([$user['id'], $userId, "Banned user #$userId: $reason", $_SERVER['REMOTE_ADDR'] ?? '']);
                break;

            default:
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Invalid action']);
                exit;
        }

        echo json_encode(['success' => true, 'message' => "User $action completed"]);

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
}
