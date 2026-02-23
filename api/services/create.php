<?php
// Create service endpoint for vendors - with pricing breakdown

require_once __DIR__ . '/../config/database.php';

setJsonHeader();
setCorsHeaders();

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

// Required fields
$requiredFields = ['vendor_id', 'name', 'description', 'category', 'pricing_items'];
foreach ($requiredFields as $field) {
    if (!isset($input[$field])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => "Missing required field: $field"]);
        exit;
    }
}

// Validate pricing_items is an array with at least one item
if (!is_array($input['pricing_items']) || count($input['pricing_items']) === 0) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'At least one pricing item is required']);
    exit;
}

// Validate each pricing item and compute base_total
$baseTotal = 0;
foreach ($input['pricing_items'] as $item) {
    if (!isset($item['description']) || !isset($item['quantity']) || !isset($item['rate'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Each pricing item must have description, quantity, and rate']);
        exit;
    }
    $baseTotal += floatval($item['quantity']) * floatval($item['rate']);
}

$pdo = getDBConnection();

try {
    $vendorId = (int)$input['vendor_id'];
    
    // Insert the service with pricing breakdown
    $sql = "
        INSERT INTO services (
            vendor_id, name, description, category, 
            pricing_items, base_total, add_ons, details, inclusions, images
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        $vendorId,
        trim($input['name']),
        trim($input['description']),
        trim($input['category']),
        json_encode($input['pricing_items']),
        $baseTotal,
        isset($input['add_ons']) ? json_encode($input['add_ons']) : null,
        isset($input['details']) ? json_encode($input['details']) : null,
        isset($input['inclusions']) ? json_encode($input['inclusions']) : null,
        isset($input['images']) ? json_encode($input['images']) : null,
    ]);
    
    $serviceId = $pdo->lastInsertId();
    
    // Fetch the created service
    $fetchSql = "SELECT * FROM services WHERE id = ?";
    $fetchStmt = $pdo->prepare($fetchSql);
    $fetchStmt->execute([$serviceId]);
    $service = $fetchStmt->fetch();
    
    // Parse JSON fields
    $service['pricing_items'] = json_decode($service['pricing_items'], true) ?? [];
    $service['add_ons'] = $service['add_ons'] ? json_decode($service['add_ons'], true) : [];
    $service['details'] = $service['details'] ? json_decode($service['details'], true) : [];
    $service['inclusions'] = $service['inclusions'] ? json_decode($service['inclusions'], true) : [];
    $service['images'] = $service['images'] ? json_decode($service['images'], true) : [];
    $service['base_total'] = (float)$service['base_total'];
    
    echo json_encode([
        'success' => true,
        'message' => 'Service created successfully',
        'service_id' => (int)$serviceId,
        'data' => $service
    ]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Failed to create service: ' . $e->getMessage()
    ]);
}
