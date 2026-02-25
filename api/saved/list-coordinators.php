<?php
/**
 * List Saved Coordinators API
 * GET /saved/list-coordinators.php?user_id=X
 */

require_once '../config/database.php';

setJsonHeader();
setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit();
}

$userId = $_GET['user_id'] ?? null;

if (!$userId) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'user_id is required']);
    exit();
}

try {
    $pdo = getDBConnection();
    
    $stmt = $pdo->prepare("
        SELECT 
            c.id,
            c.business_name,
            c.description,
            c.location,
            c.price_range,
            c.rating,
            c.review_count,
            c.images,
            c.specialties,
            c.weddings_completed,
            CASE WHEN c.verification_status = 'verified' THEN 1 ELSE 0 END as is_verified,
            sc.created_at as saved_at
        FROM saved_coordinators sc
        JOIN coordinators c ON sc.coordinator_id = c.id
        WHERE sc.user_id = ? AND c.is_active = 1
        ORDER BY sc.created_at DESC
    ");
    $stmt->execute([$userId]);
    $coordinators = $stmt->fetchAll();
    
    foreach ($coordinators as &$coordinator) {
        $coordinator['images'] = $coordinator['images'] ? json_decode($coordinator['images'], true) : [];
        $coordinator['specialties'] = $coordinator['specialties'] ? json_decode($coordinator['specialties'], true) : [];
        $coordinator['rating'] = (float)$coordinator['rating'];
        $coordinator['review_count'] = (int)$coordinator['review_count'];
        $coordinator['weddings_completed'] = (int)$coordinator['weddings_completed'];
        $coordinator['is_verified'] = (bool)$coordinator['is_verified'];
    }
    
    echo json_encode([
        'success' => true,
        'data' => $coordinators
    ]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
