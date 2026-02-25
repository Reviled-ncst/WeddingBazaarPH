<?php
/**
 * Create Job Posting API
 * 
 * POST - Create a new job posting (coordinator only)
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
    $required = ['coordinator_id', 'title', 'description', 'category', 'location'];
    foreach ($required as $field) {
        if (empty($data[$field])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => "Missing required field: $field"]);
            exit;
        }
    }
    
    $database = new Database();
    $conn = $database->getConnection();
    
    // Verify coordinator exists
    $checkStmt = $conn->prepare("SELECT id FROM coordinators WHERE id = :id");
    $checkStmt->execute([':id' => $data['coordinator_id']]);
    if (!$checkStmt->fetch()) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Coordinator not found']);
        exit;
    }
    
    // Calculate expiry date (default 30 days)
    $expiresAt = null;
    if (!empty($data['expires_in_days'])) {
        $expiresAt = date('Y-m-d H:i:s', strtotime('+' . (int)$data['expires_in_days'] . ' days'));
    } else {
        $expiresAt = date('Y-m-d H:i:s', strtotime('+30 days'));
    }
    
    $sql = "INSERT INTO job_postings (
        coordinator_id, title, description, category, location,
        event_date, budget_min, budget_max, requirements, urgency, expires_at
    ) VALUES (
        :coordinator_id, :title, :description, :category, :location,
        :event_date, :budget_min, :budget_max, :requirements, :urgency, :expires_at
    )";
    
    $stmt = $conn->prepare($sql);
    $stmt->execute([
        ':coordinator_id' => $data['coordinator_id'],
        ':title' => $data['title'],
        ':description' => $data['description'],
        ':category' => $data['category'],
        ':location' => $data['location'],
        ':event_date' => $data['event_date'] ?? null,
        ':budget_min' => $data['budget_min'] ?? null,
        ':budget_max' => $data['budget_max'] ?? null,
        ':requirements' => !empty($data['requirements']) ? json_encode($data['requirements']) : null,
        ':urgency' => $data['urgency'] ?? 'medium',
        ':expires_at' => $expiresAt
    ]);
    
    $jobId = $conn->lastInsertId();
    
    // Log activity
    $logStmt = $conn->prepare("INSERT INTO activity_logs (user_id, action, entity_type, entity_id, description, ip_address) VALUES (:user_id, :action, :entity_type, :entity_id, :description, :ip)");
    $logStmt->execute([
        ':user_id' => $data['coordinator_id'],
        ':action' => 'job_posting_created',
        ':entity_type' => 'job_posting',
        ':entity_id' => $jobId,
        ':description' => "Created job posting: {$data['title']}",
        ':ip' => $_SERVER['REMOTE_ADDR'] ?? null
    ]);
    
    echo json_encode([
        'success' => true,
        'message' => 'Job posting created successfully',
        'data' => ['id' => $jobId]
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
