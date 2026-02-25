<?php
/**
 * Create/Update Vendor Availability API
 * 
 * POST - Create or update vendor availability posting
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

require_once __DIR__ . '/../../config/database.php';

try {
    $data = json_decode(file_get_contents('php://input'), true);
    
    // Validate required fields
    $required = ['vendor_id', 'title', 'available_from', 'available_to'];
    foreach ($required as $field) {
        if (empty($data[$field])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => "Missing required field: $field"]);
            exit;
        }
    }
    
    // Validate dates
    $from = new DateTime($data['available_from']);
    $to = new DateTime($data['available_to']);
    if ($to < $from) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'End date must be after start date']);
        exit;
    }
    
    $database = new Database();
    $conn = $database->getConnection();
    
    // Verify vendor exists
    $checkStmt = $conn->prepare("SELECT id FROM vendors WHERE id = :id");
    $checkStmt->execute([':id' => $data['vendor_id']]);
    if (!$checkStmt->fetch()) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Vendor not found']);
        exit;
    }
    
    // Check if updating existing
    if (!empty($data['id'])) {
        $sql = "UPDATE vendor_availability SET
            title = :title,
            description = :description,
            available_from = :available_from,
            available_to = :available_to,
            locations = :locations,
            services_offered = :services_offered,
            special_rate = :special_rate,
            regular_rate = :regular_rate,
            discount_percent = :discount_percent,
            max_bookings = :max_bookings,
            status = :status
        WHERE id = :id AND vendor_id = :vendor_id";
        
        $stmt = $conn->prepare($sql);
        $stmt->execute([
            ':id' => $data['id'],
            ':vendor_id' => $data['vendor_id'],
            ':title' => $data['title'],
            ':description' => $data['description'] ?? null,
            ':available_from' => $data['available_from'],
            ':available_to' => $data['available_to'],
            ':locations' => !empty($data['locations']) ? json_encode($data['locations']) : null,
            ':services_offered' => !empty($data['services_offered']) ? json_encode($data['services_offered']) : null,
            ':special_rate' => $data['special_rate'] ?? null,
            ':regular_rate' => $data['regular_rate'] ?? null,
            ':discount_percent' => $data['discount_percent'] ?? null,
            ':max_bookings' => $data['max_bookings'] ?? 1,
            ':status' => $data['status'] ?? 'active'
        ]);
        
        echo json_encode([
            'success' => true,
            'message' => 'Availability updated successfully',
            'data' => ['id' => $data['id']]
        ]);
    } else {
        $sql = "INSERT INTO vendor_availability (
            vendor_id, title, description, available_from, available_to,
            locations, services_offered, special_rate, regular_rate, 
            discount_percent, max_bookings
        ) VALUES (
            :vendor_id, :title, :description, :available_from, :available_to,
            :locations, :services_offered, :special_rate, :regular_rate,
            :discount_percent, :max_bookings
        )";
        
        $stmt = $conn->prepare($sql);
        $stmt->execute([
            ':vendor_id' => $data['vendor_id'],
            ':title' => $data['title'],
            ':description' => $data['description'] ?? null,
            ':available_from' => $data['available_from'],
            ':available_to' => $data['available_to'],
            ':locations' => !empty($data['locations']) ? json_encode($data['locations']) : null,
            ':services_offered' => !empty($data['services_offered']) ? json_encode($data['services_offered']) : null,
            ':special_rate' => $data['special_rate'] ?? null,
            ':regular_rate' => $data['regular_rate'] ?? null,
            ':discount_percent' => $data['discount_percent'] ?? null,
            ':max_bookings' => $data['max_bookings'] ?? 1
        ]);
        
        $availabilityId = $conn->lastInsertId();
        
        echo json_encode([
            'success' => true,
            'message' => 'Availability posted successfully',
            'data' => ['id' => $availabilityId]
        ]);
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
