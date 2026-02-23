<?php
// Get coordinator profile by user_id

require_once __DIR__ . '/../config/database.php';

setJsonHeader();
setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendError('Method not allowed', 405);
}

// Get user_id from query params
$userId = isset($_GET['user_id']) ? intval($_GET['user_id']) : 0;

if (!$userId) {
    sendError('User ID is required', 400);
}

$pdo = getDBConnection();

try {
    $query = "SELECT 
                c.*,
                u.email,
                u.name as user_name,
                u.phone
              FROM coordinators c
              JOIN users u ON c.user_id = u.id
              WHERE c.user_id = ?";

    $stmt = $pdo->prepare($query);
    $stmt->execute([$userId]);
    $coordinator = $stmt->fetch();

    if (!$coordinator) {
        sendError('Coordinator profile not found', 404);
    }

    // Parse JSON fields
    $coordinator['images'] = $coordinator['images'] ? json_decode($coordinator['images'], true) : [];
    $coordinator['specialties'] = $coordinator['specialties'] ? json_decode($coordinator['specialties'], true) : [];
    $coordinator['verification_documents'] = $coordinator['verification_documents'] 
        ? json_decode($coordinator['verification_documents'], true) 
        : [];

    // Convert numeric fields
    $coordinator['id'] = (int)$coordinator['id'];
    $coordinator['user_id'] = (int)$coordinator['user_id'];
    $coordinator['rating'] = (float)$coordinator['rating'];
    $coordinator['review_count'] = (int)$coordinator['review_count'];
    $coordinator['weddings_completed'] = (int)$coordinator['weddings_completed'];
    $coordinator['is_active'] = (bool)$coordinator['is_active'];
    $coordinator['latitude'] = $coordinator['latitude'] ? (float)$coordinator['latitude'] : null;
    $coordinator['longitude'] = $coordinator['longitude'] ? (float)$coordinator['longitude'] : null;
    $coordinator['base_travel_fee'] = $coordinator['base_travel_fee'] ? (float)$coordinator['base_travel_fee'] : 0;
    $coordinator['per_km_rate'] = $coordinator['per_km_rate'] ? (float)$coordinator['per_km_rate'] : 0;
    $coordinator['free_km_radius'] = $coordinator['free_km_radius'] ? (int)$coordinator['free_km_radius'] : 0;

    sendResponse([
        'success' => true,
        'coordinator' => $coordinator
    ]);
} catch (PDOException $e) {
    sendError('Database error: ' . $e->getMessage(), 500);
}
?>
