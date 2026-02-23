<?php
/**
 * Admin Analytics API
 * GET: Retrieve analytics data for dashboard
 */

// Must be first - suppress ALL PHP errors as HTML
ini_set('display_errors', '0');
ini_set('log_errors', '1');
error_reporting(E_ALL);

set_error_handler(function($severity, $message, $file, $line) {
    throw new ErrorException($message, 0, $severity, $file, $line);
});

set_exception_handler(function($e) {
    header('Content-Type: application/json');
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'overview' => ['pageViews' => 0, 'uniqueVisitors' => 0, 'avgTimeOnPage' => 0, 'bounceRate' => 0]
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
$period = $_GET['period'] ?? '7d'; // 7d, 30d, 90d, 365d
$page = $_GET['page'] ?? null; // Specific page path filter

// Calculate date range
switch($period) {
    case '24h': $days = 1; break;
    case '7d': $days = 7; break;
    case '30d': $days = 30; break;
    case '90d': $days = 90; break;
    case '365d': $days = 365; break;
    default: $days = 7;
}

$startDate = date('Y-m-d H:i:s', strtotime("-{$days} days"));

try {
    // Check if tables exist
    $tableCheck = $pdo->query("SHOW TABLES LIKE 'page_views'");
    if ($tableCheck->rowCount() === 0) {
        echo json_encode([
            'success' => true,
            'overview' => [
                'totalPageViews' => 0,
                'uniqueVisitors' => 0,
                'avgTimeOnPage' => 0,
                'bounceRate' => 0,
                'totalClicks' => 0
            ],
            'pageViews' => [],
            'topPages' => [],
            'deviceBreakdown' => [],
            'browserBreakdown' => [],
            'dailyTrend' => [],
            'message' => 'Analytics tables not yet created. Run the migration.'
        ]);
        exit;
    }
    
    // Overview stats
    $whereClause = "WHERE created_at >= ?";
    $params = [$startDate];
    
    if ($page) {
        $whereClause .= " AND page_path = ?";
        $params[] = $page;
    }
    
    // Total page views
    $stmt = $pdo->prepare("SELECT COUNT(*) as total FROM page_views $whereClause");
    $stmt->execute($params);
    $totalPageViews = (int)$stmt->fetch(PDO::FETCH_ASSOC)['total'];
    
    // Unique visitors (by session)
    $stmt = $pdo->prepare("SELECT COUNT(DISTINCT session_id) as total FROM page_views $whereClause");
    $stmt->execute($params);
    $uniqueVisitors = (int)$stmt->fetch(PDO::FETCH_ASSOC)['total'];
    
    // Avg time on page
    $stmt = $pdo->prepare("SELECT AVG(time_on_page) as avg_time FROM page_views $whereClause AND time_on_page > 0");
    $stmt->execute($params);
    $avgTimeOnPage = round((float)$stmt->fetch(PDO::FETCH_ASSOC)['avg_time'], 1);
    
    // Avg scroll depth
    $stmt = $pdo->prepare("SELECT AVG(scroll_depth) as avg_scroll FROM page_views $whereClause AND scroll_depth > 0");
    $stmt->execute($params);
    $avgScrollDepth = round((float)$stmt->fetch(PDO::FETCH_ASSOC)['avg_scroll'], 1);
    
    // Bounce rate (sessions with only 1 page view - calculated from page_views)
    $stmt = $pdo->prepare("
        SELECT COUNT(*) as single_page_sessions
        FROM (
            SELECT session_id, COUNT(*) as page_count 
            FROM page_views 
            $whereClause 
            GROUP BY session_id 
            HAVING page_count = 1
        ) as bounces
    ");
    $stmt->execute($params);
    $bounces = (int)$stmt->fetch(PDO::FETCH_ASSOC)['single_page_sessions'];
    $bounceRate = $uniqueVisitors > 0 
        ? round(($bounces / $uniqueVisitors) * 100, 1)
        : 0;
    
    // Total clicks
    $stmt = $pdo->prepare("SELECT COUNT(*) as total FROM click_events $whereClause");
    $stmt->execute($params);
    $totalClicks = (int)$stmt->fetch(PDO::FETCH_ASSOC)['total'];
    
    // Top pages
    $pageWhereClause = "WHERE created_at >= ?";
    $pageParams = [$startDate];
    
    $stmt = $pdo->prepare("
        SELECT 
            page_path,
            COUNT(*) as views,
            COUNT(DISTINCT session_id) as unique_visitors,
            AVG(time_on_page) as avg_time,
            AVG(scroll_depth) as avg_scroll
        FROM page_views 
        $pageWhereClause
        GROUP BY page_path
        ORDER BY views DESC
        LIMIT 20
    ");
    $stmt->execute($pageParams);
    $topPages = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Format top pages
    foreach ($topPages as &$p) {
        $p['views'] = (int)$p['views'];
        $p['unique_visitors'] = (int)$p['unique_visitors'];
        $p['avg_time'] = round((float)$p['avg_time'], 1);
        $p['avg_scroll'] = round((float)$p['avg_scroll'], 1);
    }
    
    // Device breakdown
    $stmt = $pdo->prepare("
        SELECT device_type, COUNT(*) as count
        FROM page_views
        $pageWhereClause
        GROUP BY device_type
    ");
    $stmt->execute($pageParams);
    $deviceBreakdown = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Browser breakdown
    $stmt = $pdo->prepare("
        SELECT browser, COUNT(*) as count
        FROM page_views
        $pageWhereClause
        GROUP BY browser
        ORDER BY count DESC
        LIMIT 10
    ");
    $stmt->execute($pageParams);
    $browserBreakdown = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Daily trend
    $stmt = $pdo->prepare("
        SELECT 
            DATE(created_at) as date,
            COUNT(*) as page_views,
            COUNT(DISTINCT session_id) as unique_visitors
        FROM page_views
        $pageWhereClause
        GROUP BY DATE(created_at)
        ORDER BY date ASC
    ");
    $stmt->execute($pageParams);
    $dailyTrend = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Format daily trend
    foreach ($dailyTrend as &$day) {
        $day['page_views'] = (int)$day['page_views'];
        $day['unique_visitors'] = (int)$day['unique_visitors'];
    }
    
    // Hourly distribution (for today)
    $stmt = $pdo->prepare("
        SELECT 
            HOUR(created_at) as hour,
            COUNT(*) as count
        FROM page_views
        WHERE DATE(created_at) = CURDATE()
        GROUP BY HOUR(created_at)
        ORDER BY hour
    ");
    $stmt->execute();
    $hourlyDistribution = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Referrer sources
    $stmt = $pdo->prepare("
        SELECT 
            CASE 
                WHEN referrer IS NULL OR referrer = '' THEN 'Direct'
                WHEN referrer LIKE '%google%' THEN 'Google'
                WHEN referrer LIKE '%facebook%' THEN 'Facebook'
                WHEN referrer LIKE '%instagram%' THEN 'Instagram'
                WHEN referrer LIKE '%twitter%' OR referrer LIKE '%x.com%' THEN 'Twitter/X'
                ELSE 'Other'
            END as source,
            COUNT(*) as count
        FROM page_views
        $pageWhereClause
        GROUP BY source
        ORDER BY count DESC
    ");
    $stmt->execute($pageParams);
    $referrerSources = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'period' => $period,
        'overview' => [
            'totalPageViews' => $totalPageViews,
            'uniqueVisitors' => $uniqueVisitors,
            'avgTimeOnPage' => $avgTimeOnPage,
            'avgScrollDepth' => $avgScrollDepth,
            'bounceRate' => $bounceRate,
            'totalClicks' => $totalClicks
        ],
        'topPages' => $topPages,
        'deviceBreakdown' => $deviceBreakdown,
        'browserBreakdown' => $browserBreakdown,
        'dailyTrend' => $dailyTrend,
        'hourlyDistribution' => $hourlyDistribution,
        'referrerSources' => $referrerSources
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
