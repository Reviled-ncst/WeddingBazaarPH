<?php
// List services for a vendor - with pricing breakdown structure

require_once __DIR__ . '/../config/database.php';

setJsonHeader();
setCorsHeaders();

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// Only accept GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

$vendorId = isset($_GET['vendor_id']) ? intval($_GET['vendor_id']) : null;

if (!$vendorId) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'vendor_id is required']);
    exit;
}

$pdo = getDBConnection();

try {
    $sql = "
        SELECT 
            id, vendor_id, name, description, category, 
            pricing_items, base_total, add_ons, details, inclusions, images,
            is_active, created_at, updated_at
        FROM services 
        WHERE vendor_id = ? 
        ORDER BY created_at DESC
    ";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$vendorId]);
    $services = $stmt->fetchAll();
    
    // Parse JSON fields
    foreach ($services as &$service) {
        $service['pricing_items'] = json_decode($service['pricing_items'], true) ?? [];
        $service['add_ons'] = $service['add_ons'] ? json_decode($service['add_ons'], true) : [];
        $service['details'] = $service['details'] ? json_decode($service['details'], true) : [];
        $service['inclusions'] = $service['inclusions'] ? json_decode($service['inclusions'], true) : [];
        $service['images'] = $service['images'] ? json_decode($service['images'], true) : [];
        $service['base_total'] = (float)$service['base_total'];
        $service['is_active'] = (bool)$service['is_active'];
    }
    
    echo json_encode([
        'success' => true,
        'services' => $services,
        'count' => count($services)
    ]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}
