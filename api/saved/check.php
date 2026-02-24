<?php
/**
 * Check if Vendor is Saved API
 * GET /saved/check.php?user_id=X&vendor_id=Y
 * 
 * Returns: saved (boolean)
 */

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowedOrigins = ['http://localhost:3000', 'http://localhost:3001'];
$frontendUrl = getenv('FRONTEND_URL');
if ($frontendUrl) $allowedOrigins[] = $frontendUrl;

if (in_array($origin, $allowedOrigins) || preg_match('/\.railway\.app$|\.vercel\.app$/', $origin)) {
    header("Access-Control-Allow-Origin: $origin");
} else {
    header("Access-Control-Allow-Origin: http://localhost:3000");
}
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit();
}

$userId = $_GET['user_id'] ?? null;
$vendorId = $_GET['vendor_id'] ?? null;

// If user_id is missing, return is_saved: false (unauthenticated user)
if (!$vendorId) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'vendor_id is required']);
    exit();
}

if (!$userId) {
    // Not logged in, return is_saved: false
    echo json_encode(['success' => true, 'data' => ['is_saved' => false]]);
    exit();
}

try {
    $pdo = getDBConnection();
    
    $stmt = $pdo->prepare("SELECT id FROM saved_vendors WHERE user_id = ? AND vendor_id = ?");
    $stmt->execute([$userId, $vendorId]);
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
