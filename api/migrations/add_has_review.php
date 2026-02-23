<?php
/**
 * Migration: Add has_review column to bookings table
 * Run this once to add the column
 */

require_once '../config/database.php';

try {
    $pdo = getDBConnection();
    
    // Check if column exists
    $checkStmt = $pdo->query("SHOW COLUMNS FROM bookings LIKE 'has_review'");
    if ($checkStmt->rowCount() === 0) {
        $pdo->exec("ALTER TABLE bookings ADD COLUMN has_review BOOLEAN DEFAULT FALSE");
        echo "Added has_review column to bookings table\n";
    } else {
        echo "has_review column already exists\n";
    }
    
    echo "Migration completed successfully\n";
    
} catch (PDOException $e) {
    echo "Migration failed: " . $e->getMessage() . "\n";
}
