<?php
/**
 * Migration: Add payment fields to bookings table
 */

require_once __DIR__ . '/../config/database.php';

try {
    $pdo = getDBConnection();
    
    // Check and add payment_method column
    $stmt = $pdo->query("SHOW COLUMNS FROM bookings LIKE 'payment_method'");
    if ($stmt->rowCount() === 0) {
        $pdo->exec("ALTER TABLE bookings ADD COLUMN payment_method VARCHAR(50) DEFAULT NULL AFTER total_price");
        echo "Added payment_method column\n";
    } else {
        echo "payment_method column already exists\n";
    }
    
    // Check and add payment_status column
    $stmt = $pdo->query("SHOW COLUMNS FROM bookings LIKE 'payment_status'");
    if ($stmt->rowCount() === 0) {
        $pdo->exec("ALTER TABLE bookings ADD COLUMN payment_status ENUM('pending', 'partial', 'paid', 'refunded') DEFAULT 'pending' AFTER payment_method");
        echo "Added payment_status column\n";
    } else {
        echo "payment_status column already exists\n";
    }
    
    // Check and add payment_id column (for PayMongo reference)
    $stmt = $pdo->query("SHOW COLUMNS FROM bookings LIKE 'payment_id'");
    if ($stmt->rowCount() === 0) {
        $pdo->exec("ALTER TABLE bookings ADD COLUMN payment_id VARCHAR(255) DEFAULT NULL AFTER payment_status");
        echo "Added payment_id column\n";
    } else {
        echo "payment_id column already exists\n";
    }
    
    // Check and add transaction_id column
    $stmt = $pdo->query("SHOW COLUMNS FROM bookings LIKE 'transaction_id'");
    if ($stmt->rowCount() === 0) {
        $pdo->exec("ALTER TABLE bookings ADD COLUMN transaction_id VARCHAR(255) DEFAULT NULL AFTER payment_id");
        echo "Added transaction_id column\n";
    } else {
        echo "transaction_id column already exists\n";
    }
    
    // Check and add amount_paid column
    $stmt = $pdo->query("SHOW COLUMNS FROM bookings LIKE 'amount_paid'");
    if ($stmt->rowCount() === 0) {
        $pdo->exec("ALTER TABLE bookings ADD COLUMN amount_paid DECIMAL(10,2) DEFAULT 0 AFTER transaction_id");
        echo "Added amount_paid column\n";
    } else {
        echo "amount_paid column already exists\n";
    }
    
    // Check and add travel_fee column
    $stmt = $pdo->query("SHOW COLUMNS FROM bookings LIKE 'travel_fee'");
    if ($stmt->rowCount() === 0) {
        $pdo->exec("ALTER TABLE bookings ADD COLUMN travel_fee DECIMAL(10,2) DEFAULT 0 AFTER total_price");
        echo "Added travel_fee column\n";
    } else {
        echo "travel_fee column already exists\n";
    }
    
    // Check and add event location columns
    $stmt = $pdo->query("SHOW COLUMNS FROM bookings LIKE 'event_address'");
    if ($stmt->rowCount() === 0) {
        $pdo->exec("ALTER TABLE bookings ADD COLUMN event_address VARCHAR(500) DEFAULT NULL AFTER notes");
        $pdo->exec("ALTER TABLE bookings ADD COLUMN event_latitude DECIMAL(10,8) DEFAULT NULL AFTER event_address");
        $pdo->exec("ALTER TABLE bookings ADD COLUMN event_longitude DECIMAL(11,8) DEFAULT NULL AFTER event_latitude");
        echo "Added event location columns\n";
    } else {
        echo "event location columns already exist\n";
    }
    
    echo "\nMigration completed successfully!\n";
    
} catch (PDOException $e) {
    echo "Migration failed: " . $e->getMessage() . "\n";
    exit(1);
}
