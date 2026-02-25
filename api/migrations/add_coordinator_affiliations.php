<?php
// Migration: Add coordinator vendor affiliations tables

require_once __DIR__ . '/../config/database.php';

$pdo = getDBConnection();

try {
    // Coordinator-Vendor affiliations table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS coordinator_vendors (
            id INT AUTO_INCREMENT PRIMARY KEY,
            coordinator_id INT NOT NULL,
            vendor_id INT NOT NULL,
            status ENUM('pending', 'active', 'inactive') DEFAULT 'pending',
            commission_rate DECIMAL(5,2) DEFAULT 0,
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (coordinator_id) REFERENCES coordinators(id) ON DELETE CASCADE,
            FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE,
            UNIQUE KEY unique_affiliation (coordinator_id, vendor_id),
            INDEX idx_coordinator (coordinator_id),
            INDEX idx_vendor (vendor_id),
            INDEX idx_status (status)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    echo "Created coordinator_vendors table\n";

    // Coordinator packages table (pre-built vendor combinations)
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS coordinator_packages (
            id INT AUTO_INCREMENT PRIMARY KEY,
            coordinator_id INT NOT NULL,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            package_type ENUM('budget', 'standard', 'premium', 'luxury', 'custom') DEFAULT 'standard',
            base_price DECIMAL(12,2) DEFAULT 0,
            discount_percentage DECIMAL(5,2) DEFAULT 0,
            is_featured BOOLEAN DEFAULT FALSE,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (coordinator_id) REFERENCES coordinators(id) ON DELETE CASCADE,
            INDEX idx_coordinator (coordinator_id),
            INDEX idx_type (package_type)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    echo "Created coordinator_packages table\n";

    // Package items (vendors/services in a package)
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS coordinator_package_items (
            id INT AUTO_INCREMENT PRIMARY KEY,
            package_id INT NOT NULL,
            vendor_id INT NOT NULL,
            service_id INT,
            custom_price DECIMAL(12,2),
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (package_id) REFERENCES coordinator_packages(id) ON DELETE CASCADE,
            FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE,
            FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE SET NULL,
            INDEX idx_package (package_id),
            INDEX idx_vendor (vendor_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    echo "Created coordinator_package_items table\n";

    // Seed sample affiliations for existing coordinators
    $pdo->exec("
        INSERT IGNORE INTO coordinator_vendors (coordinator_id, vendor_id, status, commission_rate, notes) VALUES
        -- Dream Wedding Coordinators (id=1) affiliations
        (1, 1, 'active', 5.00, 'Preferred photography partner'),
        (1, 2, 'active', 5.00, 'Preferred videography partner'),
        (1, 3, 'active', 3.00, 'Primary venue partner'),
        (1, 4, 'active', 4.00, 'Exclusive catering partner'),
        (1, 6, 'active', 5.00, 'Trusted florist'),
        (1, 7, 'active', 5.00, 'Go-to makeup artist'),
        -- Elite Wedding PH (id=2) affiliations
        (2, 1, 'active', 7.00, 'Premium photography partner'),
        (2, 2, 'active', 7.00, 'Premium videography partner'),
        (2, 3, 'active', 5.00, 'Luxury venue partner'),
        (2, 5, 'active', 6.00, 'Elite decorator'),
        (2, 6, 'active', 6.00, 'Premium florist'),
        (2, 7, 'active', 6.00, 'Celebrity makeup artist'),
        (2, 8, 'active', 5.00, 'Premium entertainment')
    ");
    echo "Seeded coordinator_vendors affiliations\n";

    // Seed sample packages
    $pdo->exec("
        INSERT IGNORE INTO coordinator_packages (coordinator_id, name, description, package_type, base_price, discount_percentage, is_featured) VALUES
        -- Dream Wedding Coordinators packages
        (1, 'Essential Wedding Package', 'Perfect for intimate weddings up to 100 guests. Includes coordination, photography, videography, and catering.', 'budget', 250000.00, 10.00, FALSE),
        (1, 'Classic Filipino Wedding', 'Traditional Filipino wedding celebration with all essential vendors and premium coordination.', 'standard', 450000.00, 12.00, TRUE),
        (1, 'Garden Dream Package', 'Beautiful garden ceremony with full vendor team and day-of coordination.', 'premium', 650000.00, 15.00, FALSE),
        -- Elite Wedding PH packages
        (2, 'Luxury Destination Package', 'All-inclusive luxury wedding experience for up to 150 guests at premium venues.', 'luxury', 1200000.00, 10.00, TRUE),
        (2, 'Celebrity Style Wedding', 'Red carpet treatment with top-tier vendors and exclusive coordination.', 'luxury', 1800000.00, 8.00, FALSE),
        (2, 'Premium Intimate Wedding', 'Intimate luxury celebration for up to 50 guests with premium vendors.', 'premium', 800000.00, 12.00, FALSE)
    ");
    echo "Seeded coordinator_packages\n";

    // Seed package items
    $pdo->exec("
        INSERT IGNORE INTO coordinator_package_items (package_id, vendor_id, service_id, notes) VALUES
        -- Essential Wedding Package (id=1)
        (1, 1, 1, 'Essential Photography Package'),
        (1, 4, NULL, 'Standard catering'),
        -- Classic Filipino Wedding (id=2)
        (2, 1, 2, 'Premium Photography Package'),
        (2, 2, 3, 'Cinematic Wedding Film'),
        (2, 4, 4, 'Premium Buffet Package'),
        (2, 6, 6, 'Classic Elegance Florals'),
        (2, 7, 7, 'Bridal Glam Package'),
        -- Garden Dream Package (id=3)
        (3, 1, 2, 'Premium Photography'),
        (3, 2, 3, 'Cinematic Film'),
        (3, 3, 5, 'Garden Pavilion Venue'),
        (3, 4, 4, 'Premium Catering'),
        (3, 6, 6, 'Florals'),
        (3, 7, 7, 'Makeup'),
        -- Luxury Destination Package (id=4)
        (4, 1, 2, 'Premium Photography'),
        (4, 2, 3, 'Premium Videography'),
        (4, 3, 5, 'Premium Venue'),
        (4, 5, NULL, 'Full decoration'),
        (4, 6, 6, 'Premium florals'),
        (4, 7, 7, 'Celebrity makeup'),
        (4, 8, 8, 'Premium entertainment')
    ");
    echo "Seeded coordinator_package_items\n";

    echo "\nMigration completed successfully!\n";
} catch (PDOException $e) {
    echo "Migration error: " . $e->getMessage() . "\n";
    exit(1);
}
?>
