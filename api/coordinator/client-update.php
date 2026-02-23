<?php
/**
 * Coordinator Client Update/Delete API
 * PUT: Update a client
 * DELETE: Delete a client
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

$clientId = $_GET['id'] ?? null;
if (!$clientId) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Client ID is required']);
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

// Verify client belongs to coordinator
$stmt = $pdo->prepare("SELECT * FROM coordinator_clients WHERE id = ? AND coordinator_id = ?");
$stmt->execute([$clientId, $coordinator['id']]);
$client = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$client) {
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'Client not found']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    // Update client
    $input = json_decode(file_get_contents('php://input'), true);
    
    $fields = [];
    $params = [];
    
    $allowedFields = ['couple_name', 'partner1_name', 'partner2_name', 'email', 'phone', 'wedding_date', 'venue_name', 'budget', 'notes', 'status'];
    
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
    
    $params[] = $clientId;
    $sql = "UPDATE coordinator_clients SET " . implode(', ', $fields) . " WHERE id = ?";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    
    // Fetch updated client
    $stmt = $pdo->prepare("SELECT * FROM coordinator_clients WHERE id = ?");
    $stmt->execute([$clientId]);
    $client = $stmt->fetch(PDO::FETCH_ASSOC);
    
    echo json_encode(['success' => true, 'data' => $client, 'message' => 'Client updated successfully']);
    
} elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    // Delete client
    $stmt = $pdo->prepare("DELETE FROM coordinator_clients WHERE id = ?");
    $stmt->execute([$clientId]);
    
    echo json_encode(['success' => true, 'message' => 'Client deleted successfully']);
}
