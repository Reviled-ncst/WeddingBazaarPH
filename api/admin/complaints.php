<?php
/**
 * Admin Complaints API
 * GET: List complaints
 * PUT: Update complaint status
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
    $status = $_GET['status'] ?? null;
    $priority = $_GET['priority'] ?? null;
    $page = (int)($_GET['page'] ?? 1);
    $limit = (int)($_GET['limit'] ?? 20);
    $offset = ($page - 1) * $limit;

    try {
        $sql = "
            SELECT c.*, 
                   complainant.name as complainant_name, complainant.email as complainant_email,
                   reported.name as reported_name, reported.email as reported_email,
                   assigned.name as assigned_name
            FROM complaints c
            JOIN users complainant ON c.complainant_id = complainant.id
            JOIN users reported ON c.reported_id = reported.id
            LEFT JOIN users assigned ON c.assigned_to = assigned.id
            WHERE 1=1
        ";
        $params = [];

        if ($status) {
            $sql .= " AND c.status = ?";
            $params[] = $status;
        }

        if ($priority) {
            $sql .= " AND c.priority = ?";
            $params[] = $priority;
        }

        // Count total
        $countSql = preg_replace('/SELECT .* FROM/', 'SELECT COUNT(*) as total FROM', $sql);
        $stmt = $pdo->prepare($countSql);
        $stmt->execute($params);
        $total = $stmt->fetch(PDO::FETCH_ASSOC)['total'];

        $sql .= " ORDER BY 
            CASE c.priority WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END,
            c.created_at DESC
            LIMIT $limit OFFSET $offset";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $complaints = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Decode JSON fields
        foreach ($complaints as &$complaint) {
            $complaint['evidence'] = $complaint['evidence'] ? json_decode($complaint['evidence'], true) : [];
        }

        // Get stats
        $stmt = $pdo->query("SELECT status, COUNT(*) as count FROM complaints GROUP BY status");
        $statusStats = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $statusStats[$row['status']] = (int)$row['count'];
        }

        echo json_encode([
            'success' => true,
            'complaints' => $complaints,
            'pagination' => [
                'page' => $page,
                'limit' => $limit,
                'total' => (int)$total,
                'totalPages' => ceil($total / $limit)
            ],
            'stats' => $statusStats
        ]);

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }

} elseif ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $input = json_decode(file_get_contents('php://input'), true);
    $complaintId = $input['complaint_id'] ?? null;

    if (!$complaintId) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Complaint ID required']);
        exit;
    }

    try {
        $updates = [];
        $params = [];

        if (isset($input['status'])) {
            $updates[] = "status = ?";
            $params[] = $input['status'];
            if ($input['status'] === 'resolved') {
                $updates[] = "resolved_at = NOW()";
            }
        }

        if (isset($input['priority'])) {
            $updates[] = "priority = ?";
            $params[] = $input['priority'];
        }

        if (isset($input['assigned_to'])) {
            $updates[] = "assigned_to = ?";
            $params[] = $input['assigned_to'];
        }

        if (isset($input['resolution'])) {
            $updates[] = "resolution = ?";
            $params[] = $input['resolution'];
        }

        if (empty($updates)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'No updates provided']);
            exit;
        }

        $params[] = $complaintId;
        $sql = "UPDATE complaints SET " . implode(", ", $updates) . " WHERE id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);

        echo json_encode(['success' => true, 'message' => 'Complaint updated']);

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
}
