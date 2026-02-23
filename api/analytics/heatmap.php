<?php
/**
 * Heatmap Data API
 * GET: Retrieve click data for heatmap visualization
 */

// Suppress PHP errors from being output as HTML
error_reporting(0);
ini_set('display_errors', '0');

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

// Get days based on period
switch($period) {
    case '24h': $days = 1; break;
    case '7d': $days = 7; break;
    case '30d': $days = 30; break;
    default: $days = 7;
}

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
        // Check if scroll_events table exists
        $scrollTableCheck = $pdo->query("SHOW TABLES LIKE 'scroll_events'");
        if ($scrollTableCheck->rowCount() === 0) {
            echo json_encode([
                'success' => true,
                'page' => $page,
                'period' => $period,
                'scrollDistribution' => [],
                'avgScrollDepth' => 0,
                'maxScrollDepth' => 0,
                'message' => 'Scroll events table not yet created'
            ]);
            exit;
        }
        
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
        
    } elseif ($type === 'geo') {
        // Check if page_views table exists
        $pvTableCheck = $pdo->query("SHOW TABLES LIKE 'page_views'");
        if ($pvTableCheck->rowCount() === 0) {
            echo json_encode([
                'success' => true,
                'period' => $period,
                'geoData' => [],
                'viewsByCity' => [],
                'message' => 'Page views table not yet created'
            ]);
            exit;
        }
        
        // Geographic heatmap data from page views and bookings
        
        // Philippine city coordinates
        $phCityCoords = [
            'Manila' => [14.5995, 120.9842],
            'Quezon City' => [14.6760, 121.0437],
            'Makati' => [14.5547, 121.0244],
            'Taguig' => [14.5176, 121.0509],
            'Pasig' => [14.5764, 121.0851],
            'Tagaytay' => [14.1153, 120.9621],
            'Cebu City' => [10.3157, 123.8854],
            'Davao City' => [7.1907, 125.4553],
            'Baguio City' => [16.4023, 120.5960],
            'Iloilo City' => [10.7202, 122.5621],
            'Cagayan de Oro' => [8.4542, 124.6319]
        ];
        
        // Get page views by city
        $stmt = $pdo->prepare("
            SELECT 
                COALESCE(city, 'Unknown') as city,
                COUNT(*) as views,
                COUNT(DISTINCT session_id) as sessions
            FROM page_views
            WHERE created_at >= ?
            AND city IS NOT NULL
            GROUP BY city
            ORDER BY views DESC
            LIMIT 50
        ");
        $stmt->execute([$startDate]);
        $viewsByCity = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Add coordinates
        $geoData = [];
        foreach ($viewsByCity as $location) {
            $cityName = $location['city'];
            if (isset($phCityCoords[$cityName])) {
                $geoData[] = [
                    'city' => $cityName,
                    'lat' => $phCityCoords[$cityName][0],
                    'lng' => $phCityCoords[$cityName][1],
                    'views' => (int)$location['views'],
                    'sessions' => (int)$location['sessions']
                ];
            }
        }
        
        echo json_encode([
            'success' => true,
            'period' => $period,
            'geoData' => $geoData,
            'viewsByCity' => $viewsByCity
        ]);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
