<?php
/**
 * Coordinator Event Update/Delete API
 * PUT: Update an event
 * DELETE: Delete an event
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

$eventId = $_GET['id'] ?? null;
if (!$eventId) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Event ID is required']);
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

// Verify event belongs to coordinator
$stmt = $pdo->prepare("SELECT * FROM coordinator_events WHERE id = ? AND coordinator_id = ?");
$stmt->execute([$eventId, $coordinator['id']]);
$event = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$event) {
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'Event not found']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    // Update event
    $input = json_decode(file_get_contents('php://input'), true);
    
    $fields = [];
    $params = [];
    
    $allowedFields = ['client_id', 'title', 'event_date', 'event_time', 'location', 'description', 'event_type', 'status'];
    
    foreach ($allowedFields as $field) {
        if (isset($input[$field])) {
            $fields[] = "$field = ?";
            $params[] = $input[$field];
        }
    }
    
    if (empty($fields)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'No fields to update']);
        exit;
    }
    
    $params[] = $eventId;
    $sql = "UPDATE coordinator_events SET " . implode(', ', $fields) . " WHERE id = ?";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    
    // Fetch updated event with client name
    $stmt = $pdo->prepare("
        SELECT e.*, c.couple_name as client_name 
        FROM coordinator_events e 
        LEFT JOIN coordinator_clients c ON e.client_id = c.id 
        WHERE e.id = ?
    ");
    $stmt->execute([$eventId]);
    $event = $stmt->fetch(PDO::FETCH_ASSOC);
    
    echo json_encode(['success' => true, 'data' => $event, 'message' => 'Event updated successfully']);
    
} elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    // Delete event
    $stmt = $pdo->prepare("DELETE FROM coordinator_events WHERE id = ?");
    $stmt->execute([$eventId]);
    
    echo json_encode(['success' => true, 'message' => 'Event deleted successfully']);
}
