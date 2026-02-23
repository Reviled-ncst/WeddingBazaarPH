<?php
/**
 * Heatmap Data API
 * GET: Retrieve click data for heatmap visualization
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/jwt.php';

// Verify JWT and admin role
$user = verifyJWT();
if (!$user || $user['role'] !== 'admin') {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$pdo = getDBConnection();

// Get query parameters
$page = $_GET['page'] ?? '/';
$period = $_GET['period'] ?? '7d';
$type = $_GET['type'] ?? 'clicks'; // clicks, scroll

$days = match($period) {
    '24h' => 1,
    '7d' => 7,
    '30d' => 30,
    default => 7
};

$startDate = date('Y-m-d H:i:s', strtotime("-{$days} days"));

try {
    // Check if tables exist
    $tableCheck = $pdo->query("SHOW TABLES LIKE 'click_events'");
    if ($tableCheck->rowCount() === 0) {
        echo json_encode([
            'success' => true,
            'heatmapData' => [],
            'scrollData' => [],
            'message' => 'Analytics tables not yet created'
        ]);
        exit;
    }
    
    if ($type === 'clicks') {
        // Get click heatmap data
        // Normalize clicks to common viewport size (1920x1080)
        $stmt = $pdo->prepare("
            SELECT 
                ROUND(click_x * (1920 / NULLIF(viewport_width, 0))) as x,
                ROUND(click_y * (1080 / NULLIF(viewport_height, 0))) as y,
                COUNT(*) as intensity,
                element_tag,
                element_id,
                element_text
            FROM click_events
            WHERE page_path = ? 
            AND created_at >= ?
            AND viewport_width > 0
            AND viewport_height > 0
            GROUP BY 
                ROUND(click_x * (1920 / NULLIF(viewport_width, 0)) / 20) * 20,
                ROUND(click_y * (1080 / NULLIF(viewport_height, 0)) / 20) * 20,
                element_tag,
                element_id,
                element_text
            ORDER BY intensity DESC
            LIMIT 1000
        ");
        $stmt->execute([$page, $startDate]);
        $clicks = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Format for heatmap.js
        $heatmapData = [];
        foreach ($clicks as $click) {
            if ($click['x'] !== null && $click['y'] !== null) {
                $heatmapData[] = [
                    'x' => (int)$click['x'],
                    'y' => (int)$click['y'],
                    'value' => (int)$click['intensity'],
                    'element' => $click['element_tag'],
                    'elementId' => $click['element_id'],
                    'text' => substr($click['element_text'] ?? '', 0, 50)
                ];
            }
        }
        
        // Top clicked elements
        $stmt = $pdo->prepare("
            SELECT 
                element_tag,
                element_id,
                element_class,
                SUBSTRING(element_text, 1, 100) as element_text,
                COUNT(*) as clicks
            FROM click_events
            WHERE page_path = ? AND created_at >= ?
            GROUP BY element_tag, element_id, element_class, SUBSTRING(element_text, 1, 100)
            ORDER BY clicks DESC
            LIMIT 20
        ");
        $stmt->execute([$page, $startDate]);
        $topElements = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'page' => $page,
            'period' => $period,
            'totalClicks' => count($clicks),
            'heatmapData' => $heatmapData,
            'topElements' => $topElements,
            'viewportNormalized' => ['width' => 1920, 'height' => 1080]
        ]);
        
    } elseif ($type === 'scroll') {
        // Scroll depth distribution
        $stmt = $pdo->prepare("
            SELECT 
                FLOOR(scroll_depth / 10) * 10 as depth_bucket,
                COUNT(*) as count
            FROM scroll_events
            WHERE page_path = ? AND created_at >= ?
            GROUP BY depth_bucket
            ORDER BY depth_bucket
        ");
        $stmt->execute([$page, $startDate]);
        $scrollDistribution = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Average scroll depth
        $stmt = $pdo->prepare("
            SELECT AVG(scroll_depth) as avg_depth, MAX(scroll_depth) as max_depth
            FROM page_views
            WHERE page_path = ? AND created_at >= ?
        ");
        $stmt->execute([$page, $startDate]);
        $scrollStats = $stmt->fetch(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'page' => $page,
            'period' => $period,
            'scrollDistribution' => $scrollDistribution,
            'avgScrollDepth' => round((float)$scrollStats['avg_depth'], 1),
            'maxScrollDepth' => round((float)$scrollStats['max_depth'], 1)
        ]);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
