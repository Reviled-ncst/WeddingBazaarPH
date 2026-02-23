<?php
// Toggle service active status

require_once __DIR__ . '/../config/database.php';

setJsonHeader();
setCorsHeaders();

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// Only accept POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

// Get and validate input
$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid JSON input']);
    exit;
}

if (!isset($input['id']) || !isset($input['vendor_id'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Missing required fields: id and vendor_id']);
    exit;
}

$pdo = getDBConnection();

try {
    $serviceId = (int)$input['id'];
    $vendorId = (int)$input['vendor_id'];
    
    // Toggle the is_active status
    $sql = "UPDATE services SET is_active = NOT is_active WHERE id = ? AND vendor_id = ?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$serviceId, $vendorId]);
    
    if ($stmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Service not found or access denied']);
        exit;
    }
    
    // Fetch updated status
    $fetchSql = "SELECT id, is_active FROM services WHERE id = ?";
    $fetchStmt = $pdo->prepare($fetchSql);
    $fetchStmt->execute([$serviceId]);
    $service = $fetchStmt->fetch();
    
    echo json_encode([
        'success' => true,
        'message' => $service['is_active'] ? 'Service activated' : 'Service deactivated',
        'is_active' => (bool)$service['is_active']
    ]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Failed to toggle service: ' . $e->getMessage()
    ]);
}
