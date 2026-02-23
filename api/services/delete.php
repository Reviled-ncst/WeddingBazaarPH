<?php
// Delete service endpoint for vendors

require_once __DIR__ . '/../config/database.php';

setJsonHeader();
setCorsHeaders();

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// Accept DELETE or POST with _method=DELETE
if ($_SERVER['REQUEST_METHOD'] !== 'DELETE' && $_SERVER['REQUEST_METHOD'] !== 'POST') {
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
    
    // Verify ownership and delete
    $sql = "DELETE FROM services WHERE id = ? AND vendor_id = ?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$serviceId, $vendorId]);
    
    if ($stmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Service not found or access denied']);
        exit;
    }
    
    echo json_encode([
        'success' => true,
        'message' => 'Service deleted successfully'
    ]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Failed to delete service: ' . $e->getMessage()
    ]);
}
