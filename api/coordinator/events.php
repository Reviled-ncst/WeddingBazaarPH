<?php
/**
 * Coordinator Events API - List and Create
 * GET: List all events for the coordinator
 * POST: Create a new event
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
    // List events with optional filters
    $status = $_GET['status'] ?? null;
    $clientId = $_GET['client_id'] ?? null;
    $upcoming = isset($_GET['upcoming']);
    
    $sql = "
        SELECT e.*, c.couple_name as client_name 
        FROM coordinator_events e 
        LEFT JOIN coordinator_clients c ON e.client_id = c.id 
        WHERE e.coordinator_id = ?
    ";
    $params = [$coordinatorId];
    
    if ($status) {
        $sql .= " AND e.status = ?";
        $params[] = $status;
    }
    
    if ($clientId) {
        $sql .= " AND e.client_id = ?";
        $params[] = $clientId;
    }
    
    if ($upcoming) {
        $sql .= " AND e.event_date >= CURDATE() AND e.status != 'cancelled'";
    }
    
    $sql .= " ORDER BY e.event_date ASC, e.event_time ASC";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $events = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode(['success' => true, 'data' => $events]);
    
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Create event
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (empty($input['title']) || empty($input['event_date'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Title and event date are required']);
        exit;
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
        INSERT INTO coordinator_events 
        (coordinator_id, client_id, title, event_date, event_time, location, description, event_type, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");
    
    $stmt->execute([
        $coordinatorId,
        $input['client_id'] ?? null,
        $input['title'],
        $input['event_date'],
        $input['event_time'] ?? null,
        $input['location'] ?? null,
        $input['description'] ?? null,
        $input['event_type'] ?? 'wedding',
        $input['status'] ?? 'upcoming'
    ]);
    
    $eventId = $pdo->lastInsertId();
    
    // Fetch the created event with client name
    $stmt = $pdo->prepare("
        SELECT e.*, c.couple_name as client_name 
        FROM coordinator_events e 
        LEFT JOIN coordinator_clients c ON e.client_id = c.id 
        WHERE e.id = ?
    ");
    $stmt->execute([$eventId]);
    $event = $stmt->fetch(PDO::FETCH_ASSOC);
    
    echo json_encode(['success' => true, 'data' => $event, 'message' => 'Event created successfully']);
}
