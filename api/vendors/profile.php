<?php
// Get vendor profile by user_id

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
                v.*,
                u.email,
                u.name as user_name,
                u.phone
              FROM vendors v
              JOIN users u ON v.user_id = u.id
              WHERE v.user_id = ?";

    $stmt = $pdo->prepare($query);
    $stmt->execute([$userId]);
    $vendor = $stmt->fetch();

    if (!$vendor) {
        sendError('Vendor profile not found', 404);
    }

    // Parse JSON fields
    $vendor['images'] = $vendor['images'] ? json_decode($vendor['images'], true) : [];
    $vendor['verification_documents'] = $vendor['verification_documents'] 
        ? json_decode($vendor['verification_documents'], true) 
        : [];

    // Convert numeric fields
    $vendor['id'] = (int)$vendor['id'];
    $vendor['user_id'] = (int)$vendor['user_id'];
    $vendor['rating'] = (float)$vendor['rating'];
    $vendor['review_count'] = (int)$vendor['review_count'];
    $vendor['is_verified'] = (bool)$vendor['is_verified'];
    $vendor['is_active'] = (bool)$vendor['is_active'];
    $vendor['latitude'] = $vendor['latitude'] ? (float)$vendor['latitude'] : null;
    $vendor['longitude'] = $vendor['longitude'] ? (float)$vendor['longitude'] : null;
    $vendor['base_travel_fee'] = $vendor['base_travel_fee'] ? (float)$vendor['base_travel_fee'] : 0;
    $vendor['per_km_rate'] = $vendor['per_km_rate'] ? (float)$vendor['per_km_rate'] : 0;
    $vendor['free_km_radius'] = $vendor['free_km_radius'] ? (int)$vendor['free_km_radius'] : 0;

    sendResponse([
        'success' => true,
        'vendor' => $vendor
    ]);
} catch (PDOException $e) {
    sendError('Database error: ' . $e->getMessage(), 500);
}
?>
