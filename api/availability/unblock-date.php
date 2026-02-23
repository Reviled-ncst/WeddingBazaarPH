<?php
/**
 * Unblock a date (vendor removes unavailable date)
 * POST /availability/unblock-date.php
 * Body: { vendor_id, date }
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
    
    if (!$vendorId || !$date) {
        throw new Exception('vendor_id and date are required');
    }
    
    $pdo = getDBConnection();
    
    $stmt = $pdo->prepare("
        DELETE FROM vendor_unavailable_dates 
        WHERE vendor_id = ? AND unavailable_date = ?
    ");
    $stmt->execute([$vendorId, $date]);
    
    echo json_encode([
        'success' => true,
        'message' => $stmt->rowCount() > 0 ? 'Date unblocked' : 'Date was not blocked',
        'data' => [
            'vendor_id' => $vendorId,
            'date' => $date
        ]
    ]);
    
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
