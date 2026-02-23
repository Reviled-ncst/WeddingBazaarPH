<?php
/**
 * Coordinator Clients API - List and Create
 * GET: List all clients for the coordinator
 * POST: Create a new client
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
    // List clients
    $status = $_GET['status'] ?? null;
    
    $sql = "SELECT * FROM coordinator_clients WHERE coordinator_id = ?";
    $params = [$coordinatorId];
    
    if ($status) {
        $sql .= " AND status = ?";
        $params[] = $status;
    }
    
    $sql .= " ORDER BY wedding_date ASC, created_at DESC";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $clients = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode(['success' => true, 'data' => $clients]);
    
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Create client
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (empty($input['couple_name'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Couple name is required']);
        exit;
    }
    
    $stmt = $pdo->prepare("
        INSERT INTO coordinator_clients 
        (coordinator_id, couple_name, partner1_name, partner2_name, email, phone, wedding_date, venue_name, budget, notes, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");
    
    $stmt->execute([
        $coordinatorId,
        $input['couple_name'],
        $input['partner1_name'] ?? null,
        $input['partner2_name'] ?? null,
        $input['email'] ?? null,
        $input['phone'] ?? null,
        $input['wedding_date'] ?? null,
        $input['venue_name'] ?? null,
        $input['budget'] ?? null,
        $input['notes'] ?? null,
        $input['status'] ?? 'active'
    ]);
    
    $clientId = $pdo->lastInsertId();
    
    // Fetch the created client
    $stmt = $pdo->prepare("SELECT * FROM coordinator_clients WHERE id = ?");
    $stmt->execute([$clientId]);
    $client = $stmt->fetch(PDO::FETCH_ASSOC);
    
    echo json_encode(['success' => true, 'data' => $client, 'message' => 'Client created successfully']);
}
