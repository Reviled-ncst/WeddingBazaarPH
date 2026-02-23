<?php
/**
 * Analytics Tracking API
 * POST: Track page views, clicks, scroll events
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

require_once __DIR__ . '/../config/database.php';

$input = json_decode(file_get_contents('php://input'), true);

if (!$input || !isset($input['type'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid request']);
    exit;
}

$pdo = getDBConnection();
$type = $input['type'];
$sessionId = $input['sessionId'] ?? bin2hex(random_bytes(32));

// Get IP and user agent
$ipAddress = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? null;
$userAgent = $_SERVER['HTTP_USER_AGENT'] ?? null;

// Parse user agent for device info
function parseUserAgent($ua) {
    $device = 'desktop';
    $browser = 'Unknown';
    $os = 'Unknown';
    
    if ($ua) {
        // Device type
        if (preg_match('/Mobile|Android.*Mobile|iPhone|iPod/', $ua)) {
            $device = 'mobile';
        } elseif (preg_match('/iPad|Android(?!.*Mobile)|Tablet/', $ua)) {
            $device = 'tablet';
        }
        
        // Browser
        if (preg_match('/Chrome\/[\d.]+/', $ua)) $browser = 'Chrome';
        elseif (preg_match('/Firefox\/[\d.]+/', $ua)) $browser = 'Firefox';
        elseif (preg_match('/Safari\/[\d.]+/', $ua) && !preg_match('/Chrome/', $ua)) $browser = 'Safari';
        elseif (preg_match('/Edge\/[\d.]+|Edg\/[\d.]+/', $ua)) $browser = 'Edge';
        elseif (preg_match('/MSIE|Trident/', $ua)) $browser = 'IE';
        
        // OS
        if (preg_match('/Windows NT/', $ua)) $os = 'Windows';
        elseif (preg_match('/Mac OS X/', $ua)) $os = 'macOS';
        elseif (preg_match('/Linux/', $ua)) $os = 'Linux';
        elseif (preg_match('/Android/', $ua)) $os = 'Android';
        elseif (preg_match('/iPhone|iPad|iPod/', $ua)) $os = 'iOS';
    }
    
    return ['device' => $device, 'browser' => $browser, 'os' => $os];
}

$uaInfo = parseUserAgent($userAgent);

try {
    switch ($type) {
        case 'pageview':
            // Ensure session exists
            $stmt = $pdo->prepare("
                INSERT INTO user_sessions (session_id, first_page, landing_page, device_type, browser, os)
                VALUES (?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE 
                    page_views = page_views + 1,
                    exit_page = VALUES(landing_page),
                    is_bounce = IF(page_views > 0, FALSE, TRUE)
            ");
            $stmt->execute([
                $sessionId,
                $input['path'] ?? '/',
                $input['path'] ?? '/',
                $uaInfo['device'],
                $uaInfo['browser'],
                $uaInfo['os']
            ]);
            
            // Insert page view
            $stmt = $pdo->prepare("
                INSERT INTO page_views (
                    session_id, page_path, page_title, referrer, user_agent, ip_address,
                    device_type, browser, os, screen_width, screen_height, 
                    viewport_width, viewport_height
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $sessionId,
                $input['path'] ?? '/',
                $input['title'] ?? null,
                $input['referrer'] ?? null,
                $userAgent,
                $ipAddress,
                $uaInfo['device'],
                $uaInfo['browser'],
                $uaInfo['os'],
                $input['screenWidth'] ?? null,
                $input['screenHeight'] ?? null,
                $input['viewportWidth'] ?? null,
                $input['viewportHeight'] ?? null
            ]);
            
            $pageViewId = $pdo->lastInsertId();
            
            echo json_encode([
                'success' => true,
                'sessionId' => $sessionId,
                'pageViewId' => $pageViewId
            ]);
            break;
            
        case 'click':
            $stmt = $pdo->prepare("
                INSERT INTO click_events (
                    session_id, page_view_id, page_path, element_tag, element_id,
                    element_class, element_text, click_x, click_y, page_x, page_y,
                    viewport_width, viewport_height
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $sessionId,
                $input['pageViewId'] ?? null,
                $input['path'] ?? '/',
                $input['elementTag'] ?? null,
                $input['elementId'] ?? null,
                $input['elementClass'] ?? null,
                substr($input['elementText'] ?? '', 0, 255),
                $input['clickX'] ?? 0,
                $input['clickY'] ?? 0,
                $input['pageX'] ?? null,
                $input['pageY'] ?? null,
                $input['viewportWidth'] ?? null,
                $input['viewportHeight'] ?? null
            ]);
            
            echo json_encode(['success' => true]);
            break;
            
        case 'scroll':
            $stmt = $pdo->prepare("
                INSERT INTO scroll_events (
                    session_id, page_view_id, page_path, scroll_depth, scroll_y,
                    page_height, viewport_height
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $sessionId,
                $input['pageViewId'] ?? null,
                $input['path'] ?? '/',
                $input['scrollDepth'] ?? 0,
                $input['scrollY'] ?? 0,
                $input['pageHeight'] ?? null,
                $input['viewportHeight'] ?? null
            ]);
            
            // Update max scroll depth in page view
            if (isset($input['pageViewId'])) {
                $stmt = $pdo->prepare("
                    UPDATE page_views 
                    SET scroll_depth = GREATEST(scroll_depth, ?)
                    WHERE id = ?
                ");
                $stmt->execute([$input['scrollDepth'] ?? 0, $input['pageViewId']]);
            }
            
            echo json_encode(['success' => true]);
            break;
            
        case 'time':
            // Update time on page
            if (isset($input['pageViewId'])) {
                $stmt = $pdo->prepare("
                    UPDATE page_views 
                    SET time_on_page = ?
                    WHERE id = ?
                ");
                $stmt->execute([$input['timeOnPage'] ?? 0, $input['pageViewId']]);
            }
            
            echo json_encode(['success' => true]);
            break;
            
        case 'event':
            $stmt = $pdo->prepare("
                INSERT INTO custom_events (
                    session_id, event_name, event_category, event_label,
                    event_value, page_path, properties
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $sessionId,
                $input['eventName'] ?? 'unknown',
                $input['eventCategory'] ?? null,
                $input['eventLabel'] ?? null,
                $input['eventValue'] ?? null,
                $input['path'] ?? '/',
                json_encode($input['properties'] ?? [])
            ]);
            
            echo json_encode(['success' => true]);
            break;
            
        default:
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Unknown event type']);
    }
} catch (Exception $e) {
    // Don't fail silently - analytics should not break the site
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
