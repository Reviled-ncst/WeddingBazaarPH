<?php
/**
 * Toggle Save/Unsave Coordinator API
 * POST /saved/toggle-coordinator.php
 */

require_once '../config/database.php';

setJsonHeader();
setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit();
}

$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['user_id']) || !isset($data['coordinator_id'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'user_id and coordinator_id are required']);
    exit();
}

$userId = intval($data['user_id']);
$coordinatorId = intval($data['coordinator_id']);

try {
    $pdo = getDBConnection();
    
    $checkStmt = $pdo->prepare("SELECT id FROM saved_coordinators WHERE user_id = ? AND coordinator_id = ?");
    $checkStmt->execute([$userId, $coordinatorId]);
    $existing = $checkStmt->fetch();
    
    if ($existing) {
        $deleteStmt = $pdo->prepare("DELETE FROM saved_coordinators WHERE user_id = ? AND coordinator_id = ?");
        $deleteStmt->execute([$userId, $coordinatorId]);
        
        echo json_encode([
            'success' => true,
            'message' => 'Coordinator removed from saved',
            'data' => ['is_saved' => false]
        ]);
    } else {
        $insertStmt = $pdo->prepare("INSERT INTO saved_coordinators (user_id, coordinator_id) VALUES (?, ?)");
        $insertStmt->execute([$userId, $coordinatorId]);
        
        echo json_encode([
            'success' => true,
            'message' => 'Coordinator saved',
            'data' => ['is_saved' => true]
        ]);
    }
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
