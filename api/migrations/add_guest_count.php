<?php
/**
 * Migration: Add guest_count and event_location fields to bookings table
 * Adds guest counts for booking requests and stores event address
 */

require_once __DIR__ . '/../config/database.php';

setJsonHeader();
setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

try {
    $pdo = getDBConnection();
    $results = [];
    
    // Check and add guest_count column
    $checkCol = $pdo->query("SHOW COLUMNS FROM bookings LIKE 'guest_count'");
    if ($checkCol->rowCount() === 0) {
        $pdo->exec("ALTER TABLE bookings ADD COLUMN guest_count INT DEFAULT NULL AFTER notes");
        $results[] = "Added guest_count column to bookings";
    } else {
        $results[] = "guest_count column already exists";
    }
    
    // Check and add event_address column
    $checkAddr = $pdo->query("SHOW COLUMNS FROM bookings LIKE 'event_address'");
    if ($checkAddr->rowCount() === 0) {
        $pdo->exec("ALTER TABLE bookings ADD COLUMN event_address VARCHAR(500) DEFAULT NULL AFTER guest_count");
        $results[] = "Added event_address column to bookings";
    } else {
        $results[] = "event_address column already exists";
    }
    
    // Check and add travel_fee column
    $checkFee = $pdo->query("SHOW COLUMNS FROM bookings LIKE 'travel_fee'");
    if ($checkFee->rowCount() === 0) {
        $pdo->exec("ALTER TABLE bookings ADD COLUMN travel_fee DECIMAL(10,2) DEFAULT 0 AFTER event_address");
        $results[] = "Added travel_fee column to bookings";
    } else {
        $results[] = "travel_fee column already exists";
    }
    
    // Check and add event_latitude column
    $checkLat = $pdo->query("SHOW COLUMNS FROM bookings LIKE 'event_latitude'");
    if ($checkLat->rowCount() === 0) {
        $pdo->exec("ALTER TABLE bookings ADD COLUMN event_latitude DECIMAL(10,7) DEFAULT NULL AFTER travel_fee");
        $results[] = "Added event_latitude column to bookings";
    } else {
        $results[] = "event_latitude column already exists";
    }
    
    // Check and add event_longitude column
    $checkLng = $pdo->query("SHOW COLUMNS FROM bookings LIKE 'event_longitude'");
    if ($checkLng->rowCount() === 0) {
        $pdo->exec("ALTER TABLE bookings ADD COLUMN event_longitude DECIMAL(10,7) DEFAULT NULL AFTER event_latitude");
        $results[] = "Added event_longitude column to bookings";
    } else {
        $results[] = "event_longitude column already exists";
    }
    
    echo json_encode([
        'success' => true,
        'message' => 'Migration completed',
        'results' => $results
    ]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Migration failed: ' . $e->getMessage()
    ]);
}
