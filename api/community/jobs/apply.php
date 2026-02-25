<?php
/**
 * Apply to Job Posting API
 * 
 * POST - Vendor applies to a job posting
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
    
    if (empty($data['job_id']) || empty($data['vendor_id'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Missing job_id or vendor_id']);
        exit;
    }
    
    $database = new Database();
    $conn = $database->getConnection();
    
    // Verify job exists and is open
    $jobStmt = $conn->prepare("
        SELECT * FROM job_postings 
        WHERE id = :id AND status = 'open' 
        AND (expires_at IS NULL OR expires_at > NOW())
    ");
    $jobStmt->execute([':id' => $data['job_id']]);
    $job = $jobStmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$job) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Job posting not found or no longer accepting applications']);
        exit;
    }
    
    // Verify vendor exists and matches job category
    $vendorStmt = $conn->prepare("SELECT * FROM vendors WHERE id = :id");
    $vendorStmt->execute([':id' => $data['vendor_id']]);
    $vendor = $vendorStmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$vendor) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Vendor not found']);
        exit;
    }
    
    // Check if already applied
    $existingStmt = $conn->prepare("
        SELECT id FROM job_applications 
        WHERE job_id = :job_id AND vendor_id = :vendor_id
    ");
    $existingStmt->execute([':job_id' => $data['job_id'], ':vendor_id' => $data['vendor_id']]);
    if ($existingStmt->fetch()) {
        http_response_code(409);
        echo json_encode(['success' => false, 'error' => 'You have already applied to this job']);
        exit;
    }
    
    // Create application
    $sql = "INSERT INTO job_applications (
        job_id, vendor_id, cover_letter, proposed_price, 
        availability_confirmed, portfolio_links
    ) VALUES (
        :job_id, :vendor_id, :cover_letter, :proposed_price,
        :availability_confirmed, :portfolio_links
    )";
    
    $stmt = $conn->prepare($sql);
    $stmt->execute([
        ':job_id' => $data['job_id'],
        ':vendor_id' => $data['vendor_id'],
        ':cover_letter' => $data['cover_letter'] ?? null,
        ':proposed_price' => $data['proposed_price'] ?? null,
        ':availability_confirmed' => !empty($data['availability_confirmed']),
        ':portfolio_links' => !empty($data['portfolio_links']) ? json_encode($data['portfolio_links']) : null
    ]);
    
    $applicationId = $conn->lastInsertId();
    
    // Update applications count
    $conn->prepare("UPDATE job_postings SET applications_count = applications_count + 1 WHERE id = :id")
        ->execute([':id' => $data['job_id']]);
    
    // Log activity
    $logStmt = $conn->prepare("INSERT INTO activity_logs (user_id, action, entity_type, entity_id, description, ip_address) VALUES (:user_id, :action, :entity_type, :entity_id, :description, :ip)");
    $logStmt->execute([
        ':user_id' => $data['vendor_id'],
        ':action' => 'job_application_submitted',
        ':entity_type' => 'job_application',
        ':entity_id' => $applicationId,
        ':description' => "Applied to job: {$job['title']}",
        ':ip' => $_SERVER['REMOTE_ADDR'] ?? null
    ]);
    
    echo json_encode([
        'success' => true,
        'message' => 'Application submitted successfully',
        'data' => ['id' => $applicationId]
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
