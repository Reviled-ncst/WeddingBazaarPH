<?php
/**
 * Migration: Add availability features
 * - vendor_unavailable_dates table for blocked dates
 * - max_bookings_per_day field to services table
 */

require_once __DIR__ . '/../config/database.php';

try {
    $pdo = getDBConnection();
    
    // 1. Create vendor_unavailable_dates table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS vendor_unavailable_dates (
            id INT AUTO_INCREMENT PRIMARY KEY,
            vendor_id INT NOT NULL,
            unavailable_date DATE NOT NULL,
            reason VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE,
            UNIQUE KEY unique_vendor_date (vendor_id, unavailable_date),
            INDEX idx_vendor (vendor_id),
            INDEX idx_date (unavailable_date)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    echo "Created vendor_unavailable_dates table\n";
    
    // 2. Add max_bookings_per_day to services table
    $result = $pdo->query("SHOW COLUMNS FROM services LIKE 'max_bookings_per_day'");
    if ($result->rowCount() === 0) {
        $pdo->exec("ALTER TABLE services ADD COLUMN max_bookings_per_day INT DEFAULT 1 AFTER is_active");
        echo "Added max_bookings_per_day column to services\n";
    } else {
        echo "max_bookings_per_day column already exists\n";
    }
    
    // 3. Update existing services to have default max_bookings_per_day = 1
    $pdo->exec("UPDATE services SET max_bookings_per_day = 1 WHERE max_bookings_per_day IS NULL");
    echo "Updated existing services with default max_bookings_per_day\n";
    
    // 4. Add 'couple' to the role enum if not exists
    $pdo->exec("ALTER TABLE users MODIFY COLUMN role ENUM('individual', 'vendor', 'coordinator', 'admin', 'couple') DEFAULT 'couple'");
    echo "Updated users role enum to include 'couple'\n";
    
    echo "\nMigration completed successfully!\n";
    
} catch (PDOException $e) {
    echo "Migration failed: " . $e->getMessage() . "\n";
    exit(1);
}
