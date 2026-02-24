<?php
/**
 * Heatmap Data API
 * GET: Retrieve click data for heatmap visualization
 */

// Must be first - suppress ALL PHP errors as HTML
ini_set('display_errors', '0');
ini_set('log_errors', '1');
error_reporting(E_ALL);

// Custom error handler before anything else
set_error_handler(function($severity, $message, $file, $line) {
    throw new ErrorException($message, 0, $severity, $file, $line);
});

set_exception_handler(function($e) {
    header('Content-Type: application/json');
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'heatmapData' => [],
        'scrollData' => []
    ]);
    exit;
});

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
$user = getAuthUser();
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
        // Get click heatmap data - simplified query without complex grouping
        $stmt = $pdo->prepare("
            SELECT 
                click_x as x,
                click_y as y,
                viewport_width,
                viewport_height,
                element_tag,
                element_id,
                element_text
            FROM click_events
            WHERE page_path = ? 
            AND created_at >= ?
            AND viewport_width > 0
            AND viewport_height > 0
            ORDER BY created_at DESC
            LIMIT 1000
        ");
        $stmt->execute([$page, $startDate]);
        $clicks = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Normalize and aggregate in PHP
        $heatmapData = [];
        $buckets = [];
        foreach ($clicks as $click) {
            if ($click['x'] !== null && $click['y'] !== null && $click['viewport_width'] > 0 && $click['viewport_height'] > 0) {
                // Normalize to 1920x1080
                $normX = (int)round($click['x'] * (1920 / $click['viewport_width']));
                $normY = (int)round($click['y'] * (1080 / $click['viewport_height']));
                // Bucket to 20px grid
                $bucketKey = floor($normX / 20) . '_' . floor($normY / 20);
                if (!isset($buckets[$bucketKey])) {
                    $buckets[$bucketKey] = [
                        'x' => $normX,
                        'y' => $normY,
                        'value' => 0,
                        'element' => $click['element_tag'],
                        'elementId' => $click['element_id'],
                        'text' => substr($click['element_text'] ?? '', 0, 50)
                    ];
                }
                $buckets[$bucketKey]['value']++;
            }
        }
        $heatmapData = array_values($buckets);
        
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
        
        // Check if lat/lng columns exist, if not try to add them
        $columns = $pdo->query("SHOW COLUMNS FROM page_views")->fetchAll(PDO::FETCH_COLUMN);
        if (!in_array('lat', $columns)) {
            try {
                $pdo->exec("ALTER TABLE page_views ADD COLUMN lat DECIMAL(10,7) AFTER city");
                $pdo->exec("ALTER TABLE page_views ADD COLUMN lng DECIMAL(10,7) AFTER lat");
            } catch (Exception $e) {
                // Column might exist already
            }
        }
        
        // Philippine city coordinates (expanded list)
        $phCityCoords = [
            'Manila' => [14.5995, 120.9842],
            'Quezon City' => [14.6760, 121.0437],
            'Makati' => [14.5547, 121.0244],
            'Taguig' => [14.5176, 121.0509],
            'Pasig' => [14.5764, 121.0851],
            'Pasay' => [14.5378, 121.0014],
            'Parañaque' => [14.4793, 121.0198],
            'Las Piñas' => [14.4445, 120.9831],
            'Mandaluyong' => [14.5794, 121.0359],
            'San Juan' => [14.6016, 121.0355],
            'Marikina' => [14.6507, 121.1029],
            'Muntinlupa' => [14.4081, 121.0415],
            'Caloocan' => [14.7566, 120.9672],
            'Malabon' => [14.6697, 120.9619],
            'Navotas' => [14.6662, 120.9416],
            'Valenzuela' => [14.6943, 120.9810],
            'Tagaytay' => [14.1153, 120.9621],
            'Batangas City' => [13.7565, 121.0583],
            'Antipolo' => [14.5861, 121.1761],
            'Cavite City' => [14.4833, 120.8958],
            'Cebu City' => [10.3157, 123.8854],
            'Mandaue' => [10.3236, 123.9223],
            'Lapu-Lapu' => [10.3103, 123.9494],
            'Davao City' => [7.1907, 125.4553],
            'Baguio City' => [16.4023, 120.5960],
            'Iloilo City' => [10.7202, 122.5621],
            'Cagayan de Oro' => [8.4542, 124.6319],
            'Zamboanga City' => [6.9214, 122.0790],
            'General Santos' => [6.1164, 125.1716],
            'Bacolod' => [10.6407, 122.9689],
            'Angeles City' => [15.1450, 120.5887],
            'San Fernando' => [15.0286, 120.6881],
            'Olongapo' => [14.8333, 120.2833],
            'Dagupan' => [16.0433, 120.3336],
            'Laoag' => [18.1989, 120.5936],
            'Tuguegarao' => [17.6131, 121.7269],
            'Naga' => [13.6192, 123.1814],
            'Legazpi' => [13.1391, 123.7437],
            'Puerto Princesa' => [9.7392, 118.7353],
            'Tacloban' => [11.2543, 124.9617],
            'Butuan' => [8.9475, 125.5406]
        ];
        
        // Get page views by city with lat/lng
        $stmt = $pdo->prepare("
            SELECT 
                COALESCE(city, 'Unknown') as city,
                COUNT(*) as views,
                COUNT(DISTINCT session_id) as sessions,
                AVG(lat) as avg_lat,
                AVG(lng) as avg_lng
            FROM page_views
            WHERE created_at >= ?
            AND city IS NOT NULL AND city != ''
            GROUP BY city
            ORDER BY views DESC
            LIMIT 50
        ");
        $stmt->execute([$startDate]);
        $viewsByCity = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Add coordinates (from database or lookup table)
        $geoData = [];
        foreach ($viewsByCity as $location) {
            $cityName = $location['city'];
            $lat = null;
            $lng = null;
            
            // First try database lat/lng
            if (!empty($location['avg_lat']) && !empty($location['avg_lng'])) {
                $lat = (float)$location['avg_lat'];
                $lng = (float)$location['avg_lng'];
            }
            // Then try lookup table
            elseif (isset($phCityCoords[$cityName])) {
                $lat = $phCityCoords[$cityName][0];
                $lng = $phCityCoords[$cityName][1];
            }
            // Try partial match
            else {
                foreach ($phCityCoords as $city => $coords) {
                    if (stripos($cityName, $city) !== false || stripos($city, $cityName) !== false) {
                        $lat = $coords[0];
                        $lng = $coords[1];
                        break;
                    }
                }
            }
            
            if ($lat !== null && $lng !== null) {
                $geoData[] = [
                    'city' => $cityName,
                    'lat' => $lat,
                    'lng' => $lng,
                    'views' => (int)$location['views'],
                    'sessions' => (int)$location['sessions']
                ];
            }
        }
        
        // Also get country-level stats
        $stmt = $pdo->prepare("
            SELECT 
                COALESCE(country, 'Unknown') as country,
                COUNT(*) as views,
                COUNT(DISTINCT session_id) as sessions
            FROM page_views
            WHERE created_at >= ?
            AND country IS NOT NULL AND country != ''
            GROUP BY country
            ORDER BY views DESC
            LIMIT 20
        ");
        $stmt->execute([$startDate]);
        $viewsByCountry = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'period' => $period,
            'geoData' => $geoData,
            'viewsByCity' => $viewsByCity,
            'viewsByCountry' => $viewsByCountry
        ]);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
