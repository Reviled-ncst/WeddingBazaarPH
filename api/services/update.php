<?php
// Update service endpoint for vendors

require_once __DIR__ . '/../config/database.php';

setJsonHeader();
setCorsHeaders();

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// Only accept PUT/PATCH requests
if (!in_array($_SERVER['REQUEST_METHOD'], ['PUT', 'PATCH', 'POST'])) {
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
if (!isset($input['id']) || !isset($input['vendor_id'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Missing required fields: id and vendor_id']);
    exit;
}

$pdo = getDBConnection();

try {
    $serviceId = (int)$input['id'];
    $vendorId = (int)$input['vendor_id'];
    
    // Verify ownership
    $checkSql = "SELECT id FROM services WHERE id = ? AND vendor_id = ?";
    $checkStmt = $pdo->prepare($checkSql);
    $checkStmt->execute([$serviceId, $vendorId]);
    
    if (!$checkStmt->fetch()) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Service not found or access denied']);
        exit;
    }
    
    // Build update query dynamically
    $updates = [];
    $params = [];
    
    $allowedFields = ['name', 'description', 'category', 'is_active', 'max_bookings_per_day'];
    foreach ($allowedFields as $field) {
        if (isset($input[$field])) {
            $updates[] = "$field = ?";
            if ($field === 'is_active') {
                $params[] = $input[$field] ? 1 : 0;
            } elseif ($field === 'max_bookings_per_day') {
                $params[] = (int)$input[$field];
            } else {
                $params[] = trim($input[$field]);
            }
        }
    }
    
    // Handle JSON fields
    $jsonFields = ['pricing_items', 'add_ons', 'details', 'inclusions', 'images'];
    foreach ($jsonFields as $field) {
        if (isset($input[$field])) {
            $updates[] = "$field = ?";
            $params[] = json_encode($input[$field]);
        }
    }
    
    // Recalculate base_total if pricing_items provided
    if (isset($input['pricing_items']) && is_array($input['pricing_items'])) {
        $baseTotal = 0;
        foreach ($input['pricing_items'] as $item) {
            $baseTotal += floatval($item['quantity'] ?? 0) * floatval($item['rate'] ?? 0);
        }
        $updates[] = "base_total = ?";
        $params[] = $baseTotal;
    }
    
    if (empty($updates)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'No fields to update']);
        exit;
    }
    
    $params[] = $serviceId;
    $params[] = $vendorId;
    
    $sql = "UPDATE services SET " . implode(', ', $updates) . " WHERE id = ? AND vendor_id = ?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    
    // Fetch updated service
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
    $service['is_active'] = (bool)$service['is_active'];
    
    echo json_encode([
        'success' => true,
        'message' => 'Service updated successfully',
        'data' => $service
    ]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Failed to update service: ' . $e->getMessage()
    ]);
}
