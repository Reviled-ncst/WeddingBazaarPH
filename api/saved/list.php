<?php
/**
 * List Saved Vendors API
 * GET /saved/list.php?user_id=X
 * 
 * Returns list of saved vendors with full vendor info
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

if (!$userId) {
    // Not logged in, return empty array
    echo json_encode(['success' => true, 'data' => []]);
    exit();
}

try {
    $pdo = getDBConnection();
    
    $stmt = $pdo->prepare("
        SELECT 
            v.id,
            v.user_id,
            v.business_name,
            v.category,
            v.description,
            v.location,
            v.city,
            v.province,
            v.price_range,
            v.rating,
            v.review_count,
            v.images,
            v.verification_status,
            sv.created_at as saved_at
        FROM saved_vendors sv
        JOIN vendors v ON sv.vendor_id = v.id
        WHERE sv.user_id = ?
        ORDER BY sv.created_at DESC
    ");
    $stmt->execute([$userId]);
    $vendors = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Parse JSON fields
    foreach ($vendors as &$vendor) {
        if (isset($vendor['images'])) {
            $vendor['images'] = json_decode($vendor['images'], true) ?? [];
        }
    }
    
    echo json_encode([
        'success' => true,
        'data' => $vendors,
        'count' => count($vendors)
    ]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
