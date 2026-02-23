<?php
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

if (!isset($data['coordinator_id'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Coordinator ID is required']);
    exit();
}

$coordinatorId = intval($data['coordinator_id']);

// Build update query dynamically based on provided fields
$updateFields = [];
$params = [];

// Business info
if (isset($data['business_name'])) {
    $updateFields[] = 'business_name = ?';
    $params[] = $data['business_name'];
}

if (isset($data['description'])) {
    $updateFields[] = 'description = ?';
    $params[] = $data['description'];
}

// Specialties (JSON array)
if (isset($data['specialties'])) {
    $updateFields[] = 'specialties = ?';
    $params[] = is_array($data['specialties']) ? json_encode($data['specialties']) : $data['specialties'];
}

// Address fields
if (isset($data['address_line1'])) {
    $updateFields[] = 'address_line1 = ?';
    $params[] = $data['address_line1'];
}

if (isset($data['address_line2'])) {
    $updateFields[] = 'address_line2 = ?';
    $params[] = $data['address_line2'];
}

if (isset($data['city'])) {
    $updateFields[] = 'city = ?';
    $params[] = $data['city'];
    
    // Also update location field for backward compatibility
    $location = $data['city'];
    if (isset($data['province'])) {
        $location .= ', ' . $data['province'];
    }
    $updateFields[] = 'location = ?';
    $params[] = $location;
}

if (isset($data['province'])) {
    $updateFields[] = 'province = ?';
    $params[] = $data['province'];
}

if (isset($data['postal_code'])) {
    $updateFields[] = 'postal_code = ?';
    $params[] = $data['postal_code'];
}

// Vehicle type for travel pricing
if (isset($data['vehicle_type'])) {
    $validTypes = ['motorcycle', 'car', 'suv', 'van', 'truck'];
    if (in_array($data['vehicle_type'], $validTypes)) {
        $updateFields[] = 'vehicle_type = ?';
        $params[] = $data['vehicle_type'];
    }
}

// Geolocation
if (isset($data['latitude'])) {
    $updateFields[] = 'latitude = ?';
    $params[] = $data['latitude'];
}

if (isset($data['longitude'])) {
    $updateFields[] = 'longitude = ?';
    $params[] = $data['longitude'];
}

// Travel pricing
if (isset($data['base_travel_fee'])) {
    $updateFields[] = 'base_travel_fee = ?';
    $params[] = floatval($data['base_travel_fee']);
}

if (isset($data['per_km_rate'])) {
    $updateFields[] = 'per_km_rate = ?';
    $params[] = floatval($data['per_km_rate']);
}

if (isset($data['free_km_radius'])) {
    $updateFields[] = 'free_km_radius = ?';
    $params[] = intval($data['free_km_radius']);
}

// Price range
if (isset($data['price_range'])) {
    $updateFields[] = 'price_range = ?';
    $params[] = $data['price_range'];
}

// Weddings completed
if (isset($data['weddings_completed'])) {
    $updateFields[] = 'weddings_completed = ?';
    $params[] = intval($data['weddings_completed']);
}

// Verification documents
if (isset($data['verification_documents'])) {
    $updateFields[] = 'verification_documents = ?';
    $params[] = json_encode($data['verification_documents']);
}

// Images
if (isset($data['images'])) {
    $updateFields[] = 'images = ?';
    $params[] = is_array($data['images']) ? json_encode($data['images']) : $data['images'];
}

if (empty($updateFields)) {
    http_response_code(400);
    echo json_encode(['error' => 'No fields to update']);
    exit();
}

// Add coordinator_id to params
$params[] = $coordinatorId;

$query = "UPDATE coordinators SET " . implode(', ', $updateFields) . " WHERE id = ?";

try {
    $pdo = getDBConnection();
    $stmt = $pdo->prepare($query);
    
    if ($stmt->execute($params)) {
        // Fetch updated coordinator profile
        $fetchQuery = "SELECT c.*, u.email, u.name as user_name, u.phone
                       FROM coordinators c
                       JOIN users u ON c.user_id = u.id
                       WHERE c.id = ?";
        $fetchStmt = $pdo->prepare($fetchQuery);
        $fetchStmt->execute([$coordinatorId]);
        $coordinator = $fetchStmt->fetch(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'message' => 'Profile updated successfully',
            'coordinator' => $coordinator
        ]);
    } else {
        http_response_code(500);
        echo json_encode([
            'error' => 'Failed to update profile'
        ]);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Database error',
        'details' => $e->getMessage()
    ]);
}
?>
