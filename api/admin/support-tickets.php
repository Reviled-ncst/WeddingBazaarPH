<?php
/**
 * Admin Support Tickets API
 * GET: List support tickets
 * POST: Reply to ticket
 * PUT: Update ticket status
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS');
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
    $ticketId = $_GET['ticket_id'] ?? null;
    
    // Get single ticket with replies
    if ($ticketId) {
        try {
            $stmt = $pdo->prepare("
                SELECT st.*, u.name as user_name, u.email as user_email, u.role as user_role,
                       assigned.name as assigned_name
                FROM support_tickets st
                JOIN users u ON st.user_id = u.id
                LEFT JOIN users assigned ON st.assigned_to = assigned.id
                WHERE st.id = ?
            ");
            $stmt->execute([$ticketId]);
            $ticket = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$ticket) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Ticket not found']);
                exit;
            }

            // Get replies
            $stmt = $pdo->prepare("
                SELECT tr.*, u.name as user_name, u.role as user_role
                FROM ticket_replies tr
                JOIN users u ON tr.user_id = u.id
                WHERE tr.ticket_id = ?
                ORDER BY tr.created_at ASC
            ");
            $stmt->execute([$ticketId]);
            $ticket['replies'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

            echo json_encode(['success' => true, 'ticket' => $ticket]);

        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
        }
        exit;
    }

    // List tickets
    $status = $_GET['status'] ?? null;
    $priority = $_GET['priority'] ?? null;
    $page = (int)($_GET['page'] ?? 1);
    $limit = (int)($_GET['limit'] ?? 20);
    $offset = ($page - 1) * $limit;

    try {
        $sql = "
            SELECT st.*, u.name as user_name, u.email as user_email, u.role as user_role,
                   assigned.name as assigned_name,
                   (SELECT COUNT(*) FROM ticket_replies WHERE ticket_id = st.id) as reply_count
            FROM support_tickets st
            JOIN users u ON st.user_id = u.id
            LEFT JOIN users assigned ON st.assigned_to = assigned.id
            WHERE 1=1
        ";
        $params = [];

        if ($status) {
            $sql .= " AND st.status = ?";
            $params[] = $status;
        }

        if ($priority) {
            $sql .= " AND st.priority = ?";
            $params[] = $priority;
        }

        // Count total
        $countSql = preg_replace('/SELECT .* FROM/', 'SELECT COUNT(*) as total FROM', $sql);
        $countSql = preg_replace('/,\s*\(SELECT COUNT.*?\) as reply_count/', '', $countSql);
        $stmt = $pdo->prepare($countSql);
        $stmt->execute($params);
        $total = $stmt->fetch(PDO::FETCH_ASSOC)['total'];

        $sql .= " ORDER BY 
            CASE st.status WHEN 'open' THEN 1 WHEN 'in_progress' THEN 2 WHEN 'waiting' THEN 3 ELSE 4 END,
            CASE st.priority WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END,
            st.created_at DESC
            LIMIT $limit OFFSET $offset";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $tickets = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Get stats
        $stmt = $pdo->query("SELECT status, COUNT(*) as count FROM support_tickets GROUP BY status");
        $statusStats = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $statusStats[$row['status']] = (int)$row['count'];
        }

        echo json_encode([
            'success' => true,
            'tickets' => $tickets,
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

} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $ticketId = $input['ticket_id'] ?? null;
    $message = $input['message'] ?? null;
    $isInternal = $input['is_internal'] ?? false;

    if (!$ticketId || !$message) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Ticket ID and message required']);
        exit;
    }

    try {
        $stmt = $pdo->prepare("INSERT INTO ticket_replies (ticket_id, user_id, message, is_internal) VALUES (?, ?, ?, ?)");
        $stmt->execute([$ticketId, $user['id'], $message, $isInternal]);

        // Update ticket status if not internal
        if (!$isInternal) {
            $stmt = $pdo->prepare("UPDATE support_tickets SET status = 'waiting', updated_at = NOW() WHERE id = ? AND status = 'open'");
            $stmt->execute([$ticketId]);
        }

        echo json_encode(['success' => true, 'message' => 'Reply sent']);

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }

} elseif ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $input = json_decode(file_get_contents('php://input'), true);
    $ticketId = $input['ticket_id'] ?? null;

    if (!$ticketId) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Ticket ID required']);
        exit;
    }

    try {
        $updates = [];
        $params = [];

        if (isset($input['status'])) {
            $updates[] = "status = ?";
            $params[] = $input['status'];
            if (in_array($input['status'], ['resolved', 'closed'])) {
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

        if (empty($updates)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'No updates provided']);
            exit;
        }

        $params[] = $ticketId;
        $sql = "UPDATE support_tickets SET " . implode(", ", $updates) . " WHERE id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);

        echo json_encode(['success' => true, 'message' => 'Ticket updated']);

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
}
