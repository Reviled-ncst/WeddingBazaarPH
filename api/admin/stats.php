<?php
/**
 * Admin Dashboard Stats API
 * GET: Get dashboard statistics
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

// Verify JWT and admin role
$user = verifyJWT();
if (!$user || $user['role'] !== 'admin') {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized - Admin access required']);
    exit;
}

$pdo = getDBConnection();

try {
    // Total Users
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM users WHERE role != 'admin'");
    $totalUsers = $stmt->fetch(PDO::FETCH_ASSOC)['count'];

    // Active Vendors
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM vendors WHERE is_active = 1");
    $activeVendors = $stmt->fetch(PDO::FETCH_ASSOC)['count'];

    // Pending Verifications
    $stmt = $pdo->query("
        SELECT COUNT(*) as count FROM (
            SELECT id FROM vendors WHERE verification_status = 'pending'
            UNION ALL
            SELECT id FROM coordinators WHERE verification_status = 'pending'
        ) as pending
    ");
    $pendingVerifications = $stmt->fetch(PDO::FETCH_ASSOC)['count'];

    // Total Bookings
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM bookings");
    $totalBookings = $stmt->fetch(PDO::FETCH_ASSOC)['count'];

    // Total Revenue (from completed bookings)
    $stmt = $pdo->query("SELECT COALESCE(SUM(total_price), 0) as total FROM bookings WHERE status = 'completed'");
    $totalRevenue = $stmt->fetch(PDO::FETCH_ASSOC)['total'];

    // Monthly Revenue (current month)
    $stmt = $pdo->query("
        SELECT COALESCE(SUM(total_price), 0) as total 
        FROM bookings 
        WHERE status = 'completed' 
        AND MONTH(created_at) = MONTH(CURRENT_DATE)
        AND YEAR(created_at) = YEAR(CURRENT_DATE)
    ");
    $monthlyRevenue = $stmt->fetch(PDO::FETCH_ASSOC)['total'];

    // Open Support Tickets
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM support_tickets WHERE status IN ('open', 'in_progress')");
    $openTickets = $stmt->fetch(PDO::FETCH_ASSOC)['count'] ?? 0;

    // Pending Complaints
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM complaints WHERE status IN ('pending', 'investigating')");
    $pendingComplaints = $stmt->fetch(PDO::FETCH_ASSOC)['count'] ?? 0;

    // Users by role
    $stmt = $pdo->query("SELECT role, COUNT(*) as count FROM users GROUP BY role");
    $usersByRole = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $usersByRole[$row['role']] = (int)$row['count'];
    }

    // New users this week
    $stmt = $pdo->query("
        SELECT COUNT(*) as count FROM users 
        WHERE created_at >= DATE_SUB(CURRENT_DATE, INTERVAL 7 DAY)
    ");
    $newUsersThisWeek = $stmt->fetch(PDO::FETCH_ASSOC)['count'];

    // Recent activity
    $stmt = $pdo->query("
        SELECT al.*, u.name as user_name, u.email as user_email, u.role as user_role
        FROM activity_logs al
        JOIN users u ON al.user_id = u.id
        ORDER BY al.created_at DESC
        LIMIT 10
    ");
    $recentActivity = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'stats' => [
            'totalUsers' => (int)$totalUsers,
            'activeVendors' => (int)$activeVendors,
            'pendingVerifications' => (int)$pendingVerifications,
            'totalBookings' => (int)$totalBookings,
            'totalRevenue' => (float)$totalRevenue,
            'monthlyRevenue' => (float)$monthlyRevenue,
            'openTickets' => (int)$openTickets,
            'pendingComplaints' => (int)$pendingComplaints,
            'newUsersThisWeek' => (int)$newUsersThisWeek,
            'usersByRole' => $usersByRole
        ],
        'recentActivity' => $recentActivity
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
