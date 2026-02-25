<?php
/**
 * Update Job Application Status API
 * 
 * POST - Update application status (coordinator only)
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
    
    if (empty($data['application_id']) || empty($data['status'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Missing application_id or status']);
        exit;
    }
    
    $validStatuses = ['pending', 'shortlisted', 'accepted', 'rejected'];
    if (!in_array($data['status'], $validStatuses)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid status']);
        exit;
    }
    
    $database = new Database();
    $conn = $database->getConnection();
    
    // Verify application exists
    $checkStmt = $conn->prepare("
        SELECT ja.*, jp.coordinator_id 
        FROM job_applications ja
        JOIN job_postings jp ON ja.job_id = jp.id
        WHERE ja.id = :id
    ");
    $checkStmt->execute([':id' => $data['application_id']]);
    $application = $checkStmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$application) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Application not found']);
        exit;
    }
    
    // Update application
    $sql = "UPDATE job_applications SET status = :status, coordinator_notes = :notes WHERE id = :id";
    $stmt = $conn->prepare($sql);
    $stmt->execute([
        ':id' => $data['application_id'],
        ':status' => $data['status'],
        ':notes' => $data['notes'] ?? null
    ]);
    
    // If accepted, mark job as filled optionally
    if ($data['status'] === 'accepted' && !empty($data['fill_job'])) {
        $conn->prepare("UPDATE job_postings SET status = 'filled' WHERE id = :id")
            ->execute([':id' => $application['job_id']]);
    }
    
    echo json_encode([
        'success' => true,
        'message' => 'Application status updated'
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
