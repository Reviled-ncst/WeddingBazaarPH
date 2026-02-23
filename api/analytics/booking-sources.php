<?php
/**
 * Booking Sources API
 * GET: Retrieve booking source/location data for geographic heatmaps
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
$period = $_GET['period'] ?? '30d';
$groupBy = $_GET['groupBy'] ?? 'city'; // city, province, source, referrer

switch($period) {
    case '24h': $days = 1; break;
    case '7d': $days = 7; break;
    case '30d': $days = 30; break;
    case '90d': $days = 90; break;
    case 'all': $days = 365; break;
    default: $days = 30;
}

$startDate = date('Y-m-d H:i:s', strtotime("-{$days} days"));

try {
    // Check if columns exist
    $columnCheck = $pdo->query("SHOW COLUMNS FROM bookings LIKE 'user_city'");
    $hasLocationColumns = $columnCheck->rowCount() > 0;
    
    if (!$hasLocationColumns) {
        // Fallback: Get location data from page_views via user_id
        $stmt = $pdo->prepare("
            SELECT 
                COALESCE(pv.city, 'Unknown') as city,
                'Philippines' as country,
                COUNT(DISTINCT b.id) as booking_count,
                SUM(b.total_price) as total_revenue,
                COUNT(DISTINCT CASE WHEN b.status = 'confirmed' THEN b.id END) as confirmed_count
            FROM bookings b
            LEFT JOIN (
                SELECT user_id, city, 
                    ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) as rn
                FROM page_views 
                WHERE city IS NOT NULL
            ) pv ON b.user_id = pv.user_id AND pv.rn = 1
            WHERE b.created_at >= ?
            GROUP BY pv.city
            ORDER BY booking_count DESC
            LIMIT 50
        ");
        $stmt->execute([$startDate]);
        $byCity = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Get referrer stats from page_views
        $stmt = $pdo->prepare("
            SELECT 
                CASE 
                    WHEN pv.referrer LIKE '%google%' THEN 'Google'
                    WHEN pv.referrer LIKE '%facebook%' THEN 'Facebook'
                    WHEN pv.referrer LIKE '%instagram%' THEN 'Instagram'
                    WHEN pv.referrer LIKE '%tiktok%' THEN 'TikTok'
                    WHEN pv.referrer IS NULL OR pv.referrer = '' THEN 'Direct'
                    ELSE 'Other'
                END as source,
                COUNT(DISTINCT b.id) as booking_count,
                SUM(b.total_price) as total_revenue
            FROM bookings b
            LEFT JOIN (
                SELECT user_id, referrer,
                    ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) as rn
                FROM page_views
            ) pv ON b.user_id = pv.user_id AND pv.rn = 1
            WHERE b.created_at >= ?
            GROUP BY source
            ORDER BY booking_count DESC
        ");
        $stmt->execute([$startDate]);
        $bySource = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
    } else {
        // Use booking location columns directly
        
        if ($groupBy === 'city') {
            $stmt = $pdo->prepare("
                SELECT 
                    COALESCE(user_city, 'Unknown') as city,
                    user_province as province,
                    user_latitude as lat,
                    user_longitude as lng,
                    COUNT(*) as booking_count,
                    SUM(total_price) as total_revenue,
                    COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_count,
                    COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_count
                FROM bookings
                WHERE created_at >= ?
                GROUP BY user_city, user_province, user_latitude, user_longitude
                ORDER BY booking_count DESC
                LIMIT 50
            ");
            $stmt->execute([$startDate]);
            $byCity = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
        } elseif ($groupBy === 'province') {
            $stmt = $pdo->prepare("
                SELECT 
                    COALESCE(user_province, 'Unknown') as province,
                    COUNT(*) as booking_count,
                    SUM(total_price) as total_revenue,
                    COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_count,
                    COUNT(DISTINCT user_city) as city_count
                FROM bookings
                WHERE created_at >= ?
                GROUP BY user_province
                ORDER BY booking_count DESC
                LIMIT 30
            ");
            $stmt->execute([$startDate]);
            $byCity = $stmt->fetchAll(PDO::FETCH_ASSOC);
        }
        
        // Source breakdown
        $stmt = $pdo->prepare("
            SELECT 
                CASE 
                    WHEN referrer LIKE '%google%' THEN 'Google'
                    WHEN referrer LIKE '%facebook%' THEN 'Facebook'
                    WHEN referrer LIKE '%instagram%' THEN 'Instagram'
                    WHEN referrer LIKE '%tiktok%' THEN 'TikTok'
                    WHEN referrer IS NULL OR referrer = '' THEN 'Direct'
                    ELSE 'Other'
                END as source,
                COUNT(*) as booking_count,
                SUM(total_price) as total_revenue
            FROM bookings
            WHERE created_at >= ?
            GROUP BY source
            ORDER BY booking_count DESC
        ");
        $stmt->execute([$startDate]);
        $bySource = $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    // Page source breakdown
    $stmt = $pdo->prepare("
        SELECT 
            COALESCE(source_page, 'Unknown') as source_page,
            COUNT(*) as booking_count,
            SUM(total_price) as total_revenue
        FROM bookings
        WHERE created_at >= ?
        GROUP BY source_page
        ORDER BY booking_count DESC
        LIMIT 20
    ");
    
    try {
        $stmt->execute([$startDate]);
        $byPage = $stmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (Exception $e) {
        // Column may not exist
        $byPage = [];
    }
    
    // Device breakdown
    $stmt = $pdo->prepare("
        SELECT 
            COALESCE(device_type, 'Unknown') as device,
            COUNT(*) as booking_count,
            SUM(total_price) as total_revenue
        FROM bookings
        WHERE created_at >= ?
        GROUP BY device_type
        ORDER BY booking_count DESC
    ");
    
    try {
        $stmt->execute([$startDate]);
        $byDevice = $stmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (Exception $e) {
        $byDevice = [];
    }
    
    // Get geographic coordinates for map visualization
    $geoData = [];
    foreach ($byCity as $location) {
        if (isset($location['lat']) && isset($location['lng']) && $location['lat'] && $location['lng']) {
            $geoData[] = [
                'city' => $location['city'] ?? $location['province'] ?? 'Unknown',
                'lat' => (float)$location['lat'],
                'lng' => (float)$location['lng'],
                'value' => (int)$location['booking_count'],
                'revenue' => (float)($location['total_revenue'] ?? 0)
            ];
        }
    }
    
    // Philippine city coordinates fallback
    $phCityCoords = [
        'Manila' => [14.5995, 120.9842],
        'Quezon City' => [14.6760, 121.0437],
        'Makati' => [14.5547, 121.0244],
        'Taguig' => [14.5176, 121.0509],
        'Pasig' => [14.5764, 121.0851],
        'Tagaytay' => [14.1153, 120.9621],
        'Dasmariñas' => [14.3294, 120.9367],
        'Bacoor' => [14.4624, 120.9645],
        'San Pablo' => [14.0685, 121.3251],
        'Calamba' => [14.2118, 121.1653],
        'Batangas City' => [13.7565, 121.0583],
        'Lipa' => [13.9411, 121.1644],
        'Cebu City' => [10.3157, 123.8854],
        'Mandaue' => [10.3236, 123.9223],
        'Davao City' => [7.1907, 125.4553],
        'Angeles City' => [15.1450, 120.5887],
        'San Fernando' => [15.0286, 120.6872],
        'Malolos' => [14.8433, 120.8108],
        'Meycauayan' => [14.7367, 120.9608],
        'Iloilo City' => [10.7202, 122.5621],
        'Baguio City' => [16.4023, 120.5960],
        'Cagayan de Oro' => [8.4542, 124.6319]
    ];
    
    // Add coordinates to cities without lat/lng
    if (empty($geoData) && !empty($byCity)) {
        foreach ($byCity as $location) {
            $cityName = $location['city'] ?? $location['province'] ?? 'Unknown';
            if (isset($phCityCoords[$cityName])) {
                $geoData[] = [
                    'city' => $cityName,
                    'lat' => $phCityCoords[$cityName][0],
                    'lng' => $phCityCoords[$cityName][1],
                    'value' => (int)$location['booking_count'],
                    'revenue' => (float)($location['total_revenue'] ?? 0)
                ];
            }
        }
    }
    
    // Summary stats
    $stmt = $pdo->prepare("
        SELECT 
            COUNT(*) as total_bookings,
            SUM(total_price) as total_revenue,
            COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed,
            COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
            COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled
        FROM bookings
        WHERE created_at >= ?
    ");
    $stmt->execute([$startDate]);
    $summary = $stmt->fetch(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'period' => $period,
        'summary' => [
            'totalBookings' => (int)$summary['total_bookings'],
            'totalRevenue' => (float)$summary['total_revenue'],
            'confirmed' => (int)$summary['confirmed'],
            'pending' => (int)$summary['pending'],
            'cancelled' => (int)$summary['cancelled']
        ],
        'byCity' => $byCity,
        'bySource' => $bySource ?? [],
        'byPage' => $byPage,
        'byDevice' => $byDevice,
        'geoData' => $geoData
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
