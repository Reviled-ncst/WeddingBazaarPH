<?php
/**
 * Coordinator Task Update/Delete API
 * PUT: Update a task
 * DELETE: Delete a task
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: PUT, DELETE, OPTIONS');
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

$taskId = $_GET['id'] ?? null;
if (!$taskId) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Task ID is required']);
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

// Verify task belongs to coordinator
$stmt = $pdo->prepare("SELECT * FROM coordinator_tasks WHERE id = ? AND coordinator_id = ?");
$stmt->execute([$taskId, $coordinator['id']]);
$task = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$task) {
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'Task not found']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    // Update task
    $input = json_decode(file_get_contents('php://input'), true);
    
    $fields = [];
    $params = [];
    
    $allowedFields = ['event_id', 'client_id', 'title', 'description', 'due_date', 'priority', 'is_completed'];
    
    foreach ($allowedFields as $field) {
        if (isset($input[$field])) {
            $fields[] = "$field = ?";
            $params[] = $input[$field];
            
            // Set completed_at timestamp when marking as completed
            if ($field === 'is_completed' && $input[$field]) {
                $fields[] = "completed_at = NOW()";
            } elseif ($field === 'is_completed' && !$input[$field]) {
                $fields[] = "completed_at = NULL";
            }
        }
    }
    
    if (empty($fields)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'No fields to update']);
        exit;
    }
    
    $params[] = $taskId;
    $sql = "UPDATE coordinator_tasks SET " . implode(', ', $fields) . " WHERE id = ?";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    
    // Fetch updated task with relations
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
    
    echo json_encode(['success' => true, 'data' => $task, 'message' => 'Task updated successfully']);
    
} elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    // Delete task
    $stmt = $pdo->prepare("DELETE FROM coordinator_tasks WHERE id = ?");
    $stmt->execute([$taskId]);
    
    echo json_encode(['success' => true, 'message' => 'Task deleted successfully']);
}
