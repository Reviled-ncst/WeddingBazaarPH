<?php
/**
 * Coordinator Tasks API - List and Create
 * GET: List all tasks for the coordinator
 * POST: Create a new task
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

// Verify JWT and get user
$user = verifyJWT();
if (!$user || $user['role'] !== 'coordinator') {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized - Coordinator access required']);
    exit;
}

$pdo = getDBConnection();

// Get coordinator ID
$stmt = $pdo->prepare("SELECT id FROM coordinators WHERE user_id = ?");
$stmt->execute([$user['id']]);
$coordinator = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$coordinator) {
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'Coordinator profile not found']);
    exit;
}

$coordinatorId = $coordinator['id'];

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // List tasks with optional filters
    $completed = isset($_GET['completed']) ? filter_var($_GET['completed'], FILTER_VALIDATE_BOOLEAN) : null;
    $eventId = $_GET['event_id'] ?? null;
    $clientId = $_GET['client_id'] ?? null;
    $priority = $_GET['priority'] ?? null;
    
    $sql = "
        SELECT t.*, 
               e.title as event_title,
               c.couple_name as client_name 
        FROM coordinator_tasks t 
        LEFT JOIN coordinator_events e ON t.event_id = e.id 
        LEFT JOIN coordinator_clients c ON t.client_id = c.id 
        WHERE t.coordinator_id = ?
    ";
    $params = [$coordinatorId];
    
    if ($completed !== null) {
        $sql .= " AND t.is_completed = ?";
        $params[] = $completed ? 1 : 0;
    }
    
    if ($eventId) {
        $sql .= " AND t.event_id = ?";
        $params[] = $eventId;
    }
    
    if ($clientId) {
        $sql .= " AND t.client_id = ?";
        $params[] = $clientId;
    }
    
    if ($priority) {
        $sql .= " AND t.priority = ?";
        $params[] = $priority;
    }
    
    $sql .= " ORDER BY t.is_completed ASC, t.due_date ASC, t.priority DESC, t.created_at DESC";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $tasks = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Get counts
    $stmtCounts = $pdo->prepare("
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN is_completed = 1 THEN 1 ELSE 0 END) as completed,
            SUM(CASE WHEN is_completed = 0 THEN 1 ELSE 0 END) as pending
        FROM coordinator_tasks 
        WHERE coordinator_id = ?
    ");
    $stmtCounts->execute([$coordinatorId]);
    $counts = $stmtCounts->fetch(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true, 
        'data' => $tasks,
        'counts' => $counts
    ]);
    
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Create task
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (empty($input['title'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Title is required']);
        exit;
    }
    
    // Validate event belongs to coordinator if specified
    if (!empty($input['event_id'])) {
        $stmt = $pdo->prepare("SELECT id FROM coordinator_events WHERE id = ? AND coordinator_id = ?");
        $stmt->execute([$input['event_id'], $coordinatorId]);
        if (!$stmt->fetch()) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Invalid event']);
            exit;
        }
    }
    
    // Validate client belongs to coordinator if specified
    if (!empty($input['client_id'])) {
        $stmt = $pdo->prepare("SELECT id FROM coordinator_clients WHERE id = ? AND coordinator_id = ?");
        $stmt->execute([$input['client_id'], $coordinatorId]);
        if (!$stmt->fetch()) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Invalid client']);
            exit;
        }
    }
    
    $stmt = $pdo->prepare("
        INSERT INTO coordinator_tasks 
        (coordinator_id, event_id, client_id, title, description, due_date, priority, is_completed)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ");
    
    $stmt->execute([
        $coordinatorId,
        $input['event_id'] ?? null,
        $input['client_id'] ?? null,
        $input['title'],
        $input['description'] ?? null,
        $input['due_date'] ?? null,
        $input['priority'] ?? 'medium',
        $input['is_completed'] ?? false
    ]);
    
    $taskId = $pdo->lastInsertId();
    
    // Fetch the created task with relations
    $stmt = $pdo->prepare("
        SELECT t.*, 
               e.title as event_title,
               c.couple_name as client_name 
        FROM coordinator_tasks t 
        LEFT JOIN coordinator_events e ON t.event_id = e.id 
        LEFT JOIN coordinator_clients c ON t.client_id = c.id 
        WHERE t.id = ?
    ");
    $stmt->execute([$taskId]);
    $task = $stmt->fetch(PDO::FETCH_ASSOC);
    
    echo json_encode(['success' => true, 'data' => $task, 'message' => 'Task created successfully']);
}
