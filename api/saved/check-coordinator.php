<?php
/**
 * Check if Coordinator is Saved API
 * GET /saved/check-coordinator.php?user_id=X&coordinator_id=Y
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
$coordinatorId = $_GET['coordinator_id'] ?? null;

if (!$coordinatorId) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'coordinator_id is required']);
    exit();
}

if (!$userId) {
    echo json_encode(['success' => true, 'data' => ['is_saved' => false]]);
    exit();
}

try {
    $pdo = getDBConnection();
    
    $stmt = $pdo->prepare("SELECT id FROM saved_coordinators WHERE user_id = ? AND coordinator_id = ?");
    $stmt->execute([$userId, $coordinatorId]);
    $existing = $stmt->fetch();
    
    echo json_encode([
        'success' => true,
        'data' => [
            'is_saved' => $existing ? true : false
        ]
    ]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
