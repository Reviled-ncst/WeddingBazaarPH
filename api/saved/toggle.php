<?php
/**
 * Toggle Save/Unsave Vendor API
 * POST /saved/toggle.php
 * 
 * Required: user_id, vendor_id
 * Returns: saved (boolean) - whether vendor is now saved
 */

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowedOrigins = ['http://localhost:3000', 'http://localhost:3001'];
$frontendUrl = getenv('FRONTEND_URL');
if ($frontendUrl) $allowedOrigins[] = $frontendUrl;

if (in_array($origin, $allowedOrigins) || preg_match('/\.vercel\.app$/', $origin)) {
    header("Access-Control-Allow-Origin: $origin");
} else {
    header("Access-Control-Allow-Origin: http://localhost:3000");
}
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit();
}

$data = json_decode(file_get_contents('php://input'), true);

// Validate required fields
if (!isset($data['user_id']) || !isset($data['vendor_id'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'user_id and vendor_id are required']);
    exit();
}

$userId = intval($data['user_id']);
$vendorId = intval($data['vendor_id']);

try {
    $pdo = getDBConnection();
    
    // Check if already saved
    $checkStmt = $pdo->prepare("SELECT id FROM saved_vendors WHERE user_id = ? AND vendor_id = ?");
    $checkStmt->execute([$userId, $vendorId]);
    $existing = $checkStmt->fetch();
    
    if ($existing) {
        // Unsave
        $deleteStmt = $pdo->prepare("DELETE FROM saved_vendors WHERE user_id = ? AND vendor_id = ?");
        $deleteStmt->execute([$userId, $vendorId]);
        
        echo json_encode([
            'success' => true,
            'message' => 'Vendor removed from saved',
            'saved' => false
        ]);
    } else {
        // Save
        $insertStmt = $pdo->prepare("INSERT INTO saved_vendors (user_id, vendor_id) VALUES (?, ?)");
        $insertStmt->execute([$userId, $vendorId]);
        
        echo json_encode([
            'success' => true,
            'message' => 'Vendor saved',
            'saved' => true
        ]);
    }
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
