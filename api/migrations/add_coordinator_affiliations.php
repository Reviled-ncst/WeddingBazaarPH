<?php
// Migration: Add coordinator vendor affiliations tables + saved/reviews

require_once __DIR__ . '/../config/database.php';

$pdo = getDBConnection();

try {
    // Saved Coordinators (Favorites) - mirrors saved_vendors
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS saved_coordinators (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            coordinator_id INT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (coordinator_id) REFERENCES coordinators(id) ON DELETE CASCADE,
            UNIQUE KEY unique_saved (user_id, coordinator_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    echo "Created saved_coordinators table\n";

    // Reviews for coordinators
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS coordinator_reviews (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            coordinator_id INT NOT NULL,
            booking_id INT,
            rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
            comment TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (coordinator_id) REFERENCES coordinators(id) ON DELETE CASCADE,
            INDEX idx_coordinator (coordinator_id),
            INDEX idx_rating (rating)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    echo "Created coordinator_reviews table\n";

    // Coordinator services/packages table (similar to vendor services)
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS coordinator_services (
            id INT AUTO_INCREMENT PRIMARY KEY,
            coordinator_id INT NOT NULL,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            pricing_items JSON NOT NULL,
            base_total DECIMAL(12,2) NOT NULL DEFAULT 0,
            add_ons JSON,
            details JSON,
            inclusions JSON,
            images JSON,
            max_bookings_per_day INT DEFAULT 1,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (coordinator_id) REFERENCES coordinators(id) ON DELETE CASCADE,
            INDEX idx_coordinator (coordinator_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    echo "Created coordinator_services table\n";

    // Bookings for coordinators (separate from vendor bookings)
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS coordinator_bookings (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            coordinator_id INT NOT NULL,
            service_id INT,
            event_date DATE NOT NULL,
            status ENUM('pending', 'confirmed', 'completed', 'cancelled') DEFAULT 'pending',
            total_price DECIMAL(10,2),
            notes TEXT,
            guest_count INT,
            event_location VARCHAR(255),
            event_latitude DECIMAL(10, 8),
            event_longitude DECIMAL(11, 8),
            travel_fee DECIMAL(10,2) DEFAULT 0,
            has_review BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (coordinator_id) REFERENCES coordinators(id) ON DELETE CASCADE,
            FOREIGN KEY (service_id) REFERENCES coordinator_services(id) ON DELETE SET NULL,
            INDEX idx_user (user_id),
            INDEX idx_coordinator (coordinator_id),
            INDEX idx_status (status),
            INDEX idx_event_date (event_date)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    echo "Created coordinator_bookings table\n";

    // Seed sample coordinator services
    $pdo->exec("
        INSERT IGNORE INTO coordinator_services (coordinator_id, name, description, pricing_items, base_total, inclusions, details) VALUES
        (1, 'Day-of Coordination', 'Stress-free wedding day with our professional coordination team managing all logistics.', 
         '[{\"description\": \"Day-of Coordination\", \"quantity\": 1, \"unit\": \"event\", \"rate\": 35000, \"total\": 35000}, {\"description\": \"Assistant Coordinator\", \"quantity\": 1, \"unit\": \"person\", \"rate\": 5000, \"total\": 5000}]',
         40000,
         '[\"Timeline management\", \"Vendor coordination\", \"Emergency kit\", \"2 coordinators on-site\", \"Rehearsal attendance\"]',
         '{\"hours\": 12, \"coordinators\": 2}'),
        (1, 'Partial Planning', 'Perfect for couples who have started planning but need expert guidance to bring it all together.',
         '[{\"description\": \"Partial Planning\", \"quantity\": 1, \"unit\": \"package\", \"rate\": 60000, \"total\": 60000}, {\"description\": \"Day-of Coordination\", \"quantity\": 1, \"unit\": \"event\", \"rate\": 35000, \"total\": 35000}]',
         95000,
         '[\"Vendor recommendations\", \"Budget review\", \"Timeline creation\", \"5 planning meetings\", \"Day-of coordination\", \"Emergency kit\"]',
         '{\"meetings\": 5, \"coordinators\": 2}'),
        (1, 'Full Wedding Planning', 'Comprehensive planning from concept to execution. We handle everything so you can enjoy the journey.',
         '[{\"description\": \"Full Planning Services\", \"quantity\": 1, \"unit\": \"package\", \"rate\": 120000, \"total\": 120000}, {\"description\": \"Vendor Sourcing\", \"quantity\": 1, \"unit\": \"service\", \"rate\": 30000, \"total\": 30000}, {\"description\": \"Day-of Team (3 pax)\", \"quantity\": 1, \"unit\": \"team\", \"rate\": 45000, \"total\": 45000}]',
         195000,
         '[\"Complete vendor sourcing\", \"Contract negotiation\", \"Budget management\", \"Design concept\", \"Unlimited meetings\", \"Day-of team (3 coordinators)\", \"Rehearsal coordination\", \"Post-wedding wrap-up\"]',
         '{\"meetings\": \"unlimited\", \"coordinators\": 3}'),
        (2, 'Luxury Day-of Coordination', 'Premium day-of service with dedicated team for high-end weddings.',
         '[{\"description\": \"Luxury Coordination\", \"quantity\": 1, \"unit\": \"event\", \"rate\": 75000, \"total\": 75000}, {\"description\": \"Assistant Team (2 pax)\", \"quantity\": 2, \"unit\": \"person\", \"rate\": 10000, \"total\": 20000}]',
         95000,
         '[\"Dedicated lead coordinator\", \"2 assistant coordinators\", \"Full vendor management\", \"Premium emergency kit\", \"Post-event cleanup supervision\"]',
         '{\"hours\": 14, \"coordinators\": 3}'),
        (2, 'Destination Wedding Planning', 'Complete planning for destination weddings anywhere in the Philippines.',
         '[{\"description\": \"Destination Planning\", \"quantity\": 1, \"unit\": \"package\", \"rate\": 250000, \"total\": 250000}, {\"description\": \"Site Visits (3 trips)\", \"quantity\": 3, \"unit\": \"trips\", \"rate\": 15000, \"total\": 45000}, {\"description\": \"On-site Team\", \"quantity\": 1, \"unit\": \"team\", \"rate\": 80000, \"total\": 80000}]',
         375000,
         '[\"Location scouting\", \"Local vendor coordination\", \"Guest logistics management\", \"Accommodation coordination\", \"3 site visits\", \"On-site team of 4\", \"Welcome dinner coordination\", \"Post-wedding brunch\"]',
         '{\"trips\": 3, \"coordinators\": 4, \"duration\": \"6+ months\"}')
    ");
    echo "Seeded coordinator_services\n";

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
