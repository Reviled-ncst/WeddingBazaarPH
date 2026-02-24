<?php
/**
 * Debug Page Views Location Data
 */
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once __DIR__ . '/config/database.php';

try {
    $pdo = getDBConnection();
    
    // Get column info for page_views
    $stmt = $pdo->query("SHOW COLUMNS FROM page_views");
    $columns = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    // Check for city data
    $cityData = [];
    if (in_array('city', $columns)) {
        $stmt = $pdo->query("SELECT city, COUNT(*) as count FROM page_views WHERE city IS NOT NULL GROUP BY city ORDER BY count DESC LIMIT 20");
        $cityData = $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    // Check for country data
    $countryData = [];
    if (in_array('country', $columns)) {
        $stmt = $pdo->query("SELECT country, COUNT(*) as count FROM page_views WHERE country IS NOT NULL GROUP BY country ORDER BY count DESC LIMIT 20");
        $countryData = $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    // Sample rows
    $stmt = $pdo->query("SELECT * FROM page_views ORDER BY created_at DESC LIMIT 5");
    $sample = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Check booking_analytics for location
    $bookingLocations = [];
    try {
        $stmt = $pdo->query("SELECT location, COUNT(*) as count FROM booking_analytics WHERE location IS NOT NULL GROUP BY location ORDER BY count DESC LIMIT 20");
        $bookingLocations = $stmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (Exception $e) {
        $bookingLocations = ['error' => $e->getMessage()];
    }
    
    echo json_encode([
        'success' => true,
        'page_views_columns' => $columns,
        'cities' => $cityData,
        'countries' => $countryData,
        'sample_rows' => $sample,
        'booking_locations' => $bookingLocations
    ], JSON_PRETTY_PRINT);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
