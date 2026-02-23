<?php
// Approve or reject a verification request

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit();
}

$data = json_decode(file_get_contents('php://input'), true);

// Validate required fields
if (!isset($data['id']) || !isset($data['type']) || !isset($data['action'])) {
    http_response_code(400);
    echo json_encode(['error' => 'ID, type, and action are required']);
    exit();
}

$id = intval($data['id']);
$type = $data['type']; // 'vendor' or 'coordinator'
$action = $data['action']; // 'approve' or 'reject'
$notes = isset($data['notes']) ? trim($data['notes']) : '';

// Validate type
if (!in_array($type, ['vendor', 'coordinator'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid type. Must be vendor or coordinator']);
    exit();
}

// Validate action
if (!in_array($action, ['approve', 'reject'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid action. Must be approve or reject']);
    exit();
}

// Determine table and new status
$table = $type === 'vendor' ? 'vendors' : 'coordinators';
$newStatus = $action === 'approve' ? 'verified' : 'rejected';

$pdo = getDBConnection();

// Build update query
if ($action === 'approve') {
    $query = "UPDATE $table SET 
                verification_status = ?,
                verification_notes = ?,
                verified_at = NOW()
              WHERE id = ?";
} else {
    $query = "UPDATE $table SET 
                verification_status = ?,
                verification_notes = ?,
                verified_at = NULL
              WHERE id = ?";
}

$stmt = $pdo->prepare($query);

try {
    $stmt->execute([$newStatus, $notes, $id]);
    if ($stmt->rowCount() > 0) {
        echo json_encode([
            'success' => true,
            'message' => ucfirst($type) . ' verification ' . ($action === 'approve' ? 'approved' : 'rejected') . ' successfully',
            'status' => $action === 'approve' ? 'approved' : 'rejected'
        ]);
    } else {
        http_response_code(404);
        echo json_encode(['error' => ucfirst($type) . ' not found']);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Failed to update verification status',
        'details' => $e->getMessage()
    ]);
}
?>
