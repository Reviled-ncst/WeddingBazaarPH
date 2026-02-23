<?php
/**
 * Block a date (vendor marks as unavailable)
 * POST /availability/block-date.php
 * Body: { vendor_id, date, reason? }
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
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

require_once __DIR__ . '/../config/database.php';

try {
    $input = json_decode(file_get_contents('php://input'), true);
    
    $vendorId = isset($input['vendor_id']) ? (int)$input['vendor_id'] : null;
    $date = isset($input['date']) ? $input['date'] : null;
    $reason = isset($input['reason']) ? trim($input['reason']) : null;
    
    if (!$vendorId || !$date) {
        throw new Exception('vendor_id and date are required');
    }
    
    // Validate date format
    $dateObj = DateTime::createFromFormat('Y-m-d', $date);
    if (!$dateObj || $dateObj->format('Y-m-d') !== $date) {
        throw new Exception('Invalid date format. Use YYYY-MM-DD');
    }
    
    $pdo = getDBConnection();
    
    // Verify vendor exists
    $stmt = $pdo->prepare("SELECT id FROM vendors WHERE id = ?");
    $stmt->execute([$vendorId]);
    if (!$stmt->fetch()) {
        throw new Exception('Vendor not found');
    }
    
    // Insert or update the blocked date
    $stmt = $pdo->prepare("
        INSERT INTO vendor_unavailable_dates (vendor_id, unavailable_date, reason)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE reason = VALUES(reason)
    ");
    $stmt->execute([$vendorId, $date, $reason]);
    
    echo json_encode([
        'success' => true,
        'message' => 'Date blocked successfully',
        'data' => [
            'vendor_id' => $vendorId,
            'date' => $date,
            'reason' => $reason
        ]
    ]);
    
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
