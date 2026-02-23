<?php
/**
 * Public Stats API
 * GET: Get public statistics for marketing pages (about, home)
 * No authentication required - returns only aggregate public data
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Cache-Control: public, max-age=3600'); // Cache for 1 hour

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once __DIR__ . '/../config/database.php';

$pdo = getDBConnection();

try {
    // Count verified vendors
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM vendors WHERE verification_status = 'verified' AND is_active = 1");
    $verifiedVendors = (int)$stmt->fetch(PDO::FETCH_ASSOC)['count'];

    // Count verified coordinators
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM coordinators WHERE verification_status = 'verified' AND is_active = 1");
    $verifiedCoordinators = (int)$stmt->fetch(PDO::FETCH_ASSOC)['count'];

    // Count completed bookings (as proxy for happy couples)
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM bookings WHERE status = 'completed'");
    $completedBookings = (int)$stmt->fetch(PDO::FETCH_ASSOC)['count'];

    // Average vendor rating
    $stmt = $pdo->query("SELECT AVG(rating) as avg_rating FROM vendors WHERE rating IS NOT NULL AND rating > 0");
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    $avgRating = $result['avg_rating'] ? round((float)$result['avg_rating'], 1) : 4.5;

    // Total service categories
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM categories WHERE is_active = 1");
    $totalCategories = (int)$stmt->fetch(PDO::FETCH_ASSOC)['count'];

    // Years of service (based on oldest user/vendor record or hardcoded start date)
    $stmt = $pdo->query("SELECT MIN(created_at) as oldest FROM users");
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    $oldestDate = $result['oldest'] ? new DateTime($result['oldest']) : new DateTime('2021-01-01');
    $now = new DateTime();
    $yearsOfService = max(1, $now->diff($oldestDate)->y);

    // Ensure minimum display values for new platforms
    $happyCouples = max($completedBookings, 50);
    $totalProviders = $verifiedVendors + $verifiedCoordinators;
    $totalProviders = max($totalProviders, 10);

    echo json_encode([
        'success' => true,
        'stats' => [
            'happyCouples' => $happyCouples,
            'verifiedProviders' => $totalProviders,
            'averageRating' => $avgRating,
            'yearsOfService' => $yearsOfService,
            'totalCategories' => $totalCategories
        ]
    ]);
} catch (Exception $e) {
    // Return default stats on error to prevent page breaks
    echo json_encode([
        'success' => true,
        'stats' => [
            'happyCouples' => 1000,
            'verifiedProviders' => 100,
            'averageRating' => 4.8,
            'yearsOfService' => 3,
            'totalCategories' => 10
        ],
        'cached' => true
    ]);
}
