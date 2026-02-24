<?php
/**
 * Admin Users API
 * GET: List users with filters
 * PUT: Update user status/role
 */

// Must be first - suppress ALL PHP errors as HTML
ini_set('display_errors', '0');
ini_set('log_errors', '1');
error_reporting(E_ALL);

set_error_handler(function($severity, $message, $file, $line) {
    throw new ErrorException($message, 0, $severity, $file, $line);
});

set_exception_handler(function($e) {
    header('Content-Type: application/json');
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'users' => [],
        'pagination' => ['page' => 1, 'limit' => 20, 'total' => 0, 'totalPages' => 0]
    ]);
    exit;
});

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

// Check if status column exists; if not, add it
try {
    $columns = $pdo->query("SHOW COLUMNS FROM users LIKE 'status'")->fetch();
    if (!$columns) {
        $pdo->exec("
            ALTER TABLE users 
            ADD COLUMN status ENUM('active', 'suspended', 'banned') DEFAULT 'active',
            ADD COLUMN suspended_at TIMESTAMP NULL,
            ADD COLUMN suspended_reason TEXT
        ");
    }
} catch (PDOException $e) {
    // Ignore - columns may already exist or table doesn't exist
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $role = $_GET['role'] ?? null;
    $status = $_GET['status'] ?? null;
    $search = $_GET['search'] ?? null;
    $page = (int)($_GET['page'] ?? 1);
    $limit = (int)($_GET['limit'] ?? 20);
    $offset = ($page - 1) * $limit;

    try {
        // Check which columns exist
        $columnsResult = $pdo->query("SHOW COLUMNS FROM users")->fetchAll(PDO::FETCH_COLUMN);
        $hasStatus = in_array('status', $columnsResult);
        $hasSuspendedAt = in_array('suspended_at', $columnsResult);
        $hasSuspendedReason = in_array('suspended_reason', $columnsResult);
        
        // Check if bookings table exists
        $hasBookings = false;
        try {
            $bookingsCheck = $pdo->query("SHOW TABLES LIKE 'bookings'");
            $hasBookings = $bookingsCheck->rowCount() > 0;
        } catch (PDOException $e) {
            $hasBookings = false;
        }
        
        // Build dynamic SELECT
        $statusSelect = $hasStatus ? "u.status" : "'active' as status";
        $suspendedAtSelect = $hasSuspendedAt ? "u.suspended_at" : "NULL as suspended_at";
        $suspendedReasonSelect = $hasSuspendedReason ? "u.suspended_reason" : "NULL as suspended_reason";
        $bookingCountSelect = $hasBookings ? "(SELECT COUNT(*) FROM bookings WHERE user_id = u.id) as booking_count" : "0 as booking_count";
        
        $sql = "
            SELECT u.id, u.email, u.name, u.role, u.phone, u.avatar, 
                   u.email_verified, $statusSelect, $suspendedAtSelect, $suspendedReasonSelect,
                   u.created_at, u.updated_at,
                   $bookingCountSelect
            FROM users u
            WHERE u.role != 'admin'
        ";
        $params = [];

        if ($role) {
            $sql .= " AND u.role = ?";
            $params[] = $role;
        }

        if ($status && $hasStatus) {
            $sql .= " AND u.status = ?";
            $params[] = $status;
        }

        if ($search) {
            $sql .= " AND (u.name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)";
            $searchTerm = "%$search%";
            $params = array_merge($params, [$searchTerm, $searchTerm, $searchTerm]);
        }

        // Count total
        $countSql = "SELECT COUNT(*) as total FROM users u WHERE u.role != 'admin'";
        $countParams = [];
        
        if ($role) {
            $countSql .= " AND u.role = ?";
            $countParams[] = $role;
        }
        if ($status && $hasStatus) {
            $countSql .= " AND u.status = ?";
            $countParams[] = $status;
        }
        if ($search) {
            $countSql .= " AND (u.name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)";
            $searchTerm = "%$search%";
            $countParams = array_merge($countParams, [$searchTerm, $searchTerm, $searchTerm]);
        }
        
        $stmt = $pdo->prepare($countSql);
        $stmt->execute($countParams);
        $total = $stmt->fetch(PDO::FETCH_ASSOC)['total'];

        // Get paginated results
        $sql .= " ORDER BY u.created_at DESC LIMIT $limit OFFSET $offset";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Format and enrich user data
        foreach ($users as &$u) {
            $u['id'] = (int)$u['id'];
            $u['booking_count'] = (int)($u['booking_count'] ?? 0);
            $u['email_verified'] = (bool)$u['email_verified'];
            $u['status'] = $u['status'] ?? 'active';
            
            // Get vendor/coordinator info - wrapped in try/catch
            if ($u['role'] === 'vendor') {
                try {
                    $vendorStmt = $pdo->prepare("SELECT id, business_name, verification_status FROM vendors WHERE user_id = ? LIMIT 1");
                    $vendorStmt->execute([$u['id']]);
                    $vendorData = $vendorStmt->fetch(PDO::FETCH_ASSOC);
                    $u['vendor'] = $vendorData ?: null;
                } catch (PDOException $e) {
                    $u['vendor'] = null;
                }
            } elseif ($u['role'] === 'coordinator') {
                try {
                    $coordStmt = $pdo->prepare("SELECT id, business_name, verification_status FROM coordinators WHERE user_id = ? LIMIT 1");
                    $coordStmt->execute([$u['id']]);
                    $coordData = $coordStmt->fetch(PDO::FETCH_ASSOC);
                    $u['coordinator'] = $coordData ?: null;
                } catch (PDOException $e) {
                    $u['coordinator'] = null;
                }
            }
        }
        unset($u); // break reference

        // Get stats
        $stmt = $pdo->query("SELECT role, COUNT(*) as count FROM users WHERE role != 'admin' GROUP BY role");
        $roleStats = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $roleStats[$row['role']] = (int)$row['count'];
        }

        $statusStats = ['active' => 0, 'suspended' => 0, 'banned' => 0];
        if ($hasStatus) {
            $stmt = $pdo->query("SELECT COALESCE(status, 'active') as status, COUNT(*) as count FROM users WHERE role != 'admin' GROUP BY COALESCE(status, 'active')");
            while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $statusStats[$row['status']] = (int)$row['count'];
            }
        } else {
            // If no status column, all users are "active"
            $stmt = $pdo->query("SELECT COUNT(*) as count FROM users WHERE role != 'admin'");
            $statusStats['active'] = (int)$stmt->fetch(PDO::FETCH_ASSOC)['count'];
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
        echo json_encode([
            'success' => false, 
            'message' => 'Database error: ' . $e->getMessage(),
            'users' => [],
            'pagination' => ['page' => 1, 'limit' => 20, 'total' => 0, 'totalPages' => 0],
            'stats' => ['byRole' => [], 'byStatus' => ['active' => 0]]
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false, 
            'message' => 'Error: ' . $e->getMessage(),
            'users' => [],
            'pagination' => ['page' => 1, 'limit' => 20, 'total' => 0, 'totalPages' => 0],
            'stats' => ['byRole' => [], 'byStatus' => ['active' => 0]]
        ]);
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
