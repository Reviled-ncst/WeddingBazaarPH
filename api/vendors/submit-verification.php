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

if (!isset($data['vendor_id'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Vendor ID is required']);
    exit();
}

$vendorId = intval($data['vendor_id']);

$pdo = getDBConnection();

// Validate that vendor exists and has required fields
$checkQuery = "SELECT id, latitude, longitude, business_name FROM vendors WHERE id = ?";
$checkStmt = $pdo->prepare($checkQuery);
$checkStmt->execute([$vendorId]);
$vendor = $checkStmt->fetch();

if (!$vendor) {
    http_response_code(404);
    echo json_encode(['error' => 'Vendor not found']);
    exit();
}

// Check if location is set
if (!$vendor['latitude'] || !$vendor['longitude']) {
    http_response_code(400);
    echo json_encode(['error' => 'Please set your business location before submitting for verification']);
    exit();
}

// Update verification status to pending
$verificationDocs = isset($data['verification_documents']) 
    ? json_encode($data['verification_documents']) 
    : '[]';

$updateQuery = "UPDATE vendors SET 
                verification_status = 'pending',
                verification_documents = ?,
                verification_notes = NULL
                WHERE id = ?";

$stmt = $pdo->prepare($updateQuery);

try {
    $stmt->execute([$verificationDocs, $vendorId]);
    echo json_encode([
        'success' => true,
        'message' => 'Verification request submitted successfully',
        'status' => 'pending'
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Failed to submit verification request',
        'details' => $e->getMessage()
    ]);
}
?>
