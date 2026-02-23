<?php
/**
 * Migration: Add Admin Features Tables
 * Creates tables for: activity_logs, login_attempts, account_lockouts,
 * complaints, support_tickets, help_articles, location_logs
 */

require_once __DIR__ . '/../config/database.php';

try {
    $pdo = getDBConnection();
    
    // Activity Logs Table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS activity_logs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            action VARCHAR(50) NOT NULL,
            entity_type VARCHAR(50),
            entity_id INT,
            description TEXT NOT NULL,
            ip_address VARCHAR(45),
            location VARCHAR(255),
            user_agent TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            INDEX idx_user (user_id),
            INDEX idx_action (action),
            INDEX idx_created (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    echo "✓ Created activity_logs table\n";

    // Login Attempts Table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS login_attempts (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT,
            email VARCHAR(255) NOT NULL,
            ip_address VARCHAR(45) NOT NULL,
            location VARCHAR(255),
            success BOOLEAN DEFAULT FALSE,
            failure_reason VARCHAR(100),
            user_agent TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
            INDEX idx_email (email),
            INDEX idx_ip (ip_address),
            INDEX idx_created (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    echo "✓ Created login_attempts table\n";

    // Account Lockouts Table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS account_lockouts (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            reason VARCHAR(100) NOT NULL,
            ip_address VARCHAR(45),
            locked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            unlocked_at TIMESTAMP NULL,
            unlocked_by INT,
            unlock_reason VARCHAR(255),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (unlocked_by) REFERENCES users(id) ON DELETE SET NULL,
            INDEX idx_user (user_id),
            INDEX idx_locked (locked_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    echo "✓ Created account_lockouts table\n";

    // Complaints Table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS complaints (
            id INT AUTO_INCREMENT PRIMARY KEY,
            complainant_id INT NOT NULL,
            reported_id INT NOT NULL,
            reported_type ENUM('vendor', 'coordinator', 'user') NOT NULL,
            category VARCHAR(50) NOT NULL,
            subject VARCHAR(255) NOT NULL,
            description TEXT NOT NULL,
            evidence JSON,
            status ENUM('pending', 'investigating', 'resolved', 'dismissed') DEFAULT 'pending',
            priority ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
            assigned_to INT,
            resolution TEXT,
            resolved_at TIMESTAMP NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (complainant_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (reported_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
            INDEX idx_status (status),
            INDEX idx_priority (priority),
            INDEX idx_created (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    echo "✓ Created complaints table\n";

    // Support Tickets Table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS support_tickets (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            category VARCHAR(50) NOT NULL,
            subject VARCHAR(255) NOT NULL,
            description TEXT NOT NULL,
            status ENUM('open', 'in_progress', 'waiting', 'resolved', 'closed') DEFAULT 'open',
            priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
            assigned_to INT,
            resolved_at TIMESTAMP NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
            INDEX idx_status (status),
            INDEX idx_priority (priority),
            INDEX idx_user (user_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    echo "✓ Created support_tickets table\n";

    // Support Ticket Replies Table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS ticket_replies (
            id INT AUTO_INCREMENT PRIMARY KEY,
            ticket_id INT NOT NULL,
            user_id INT NOT NULL,
            message TEXT NOT NULL,
            is_internal BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (ticket_id) REFERENCES support_tickets(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            INDEX idx_ticket (ticket_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    echo "✓ Created ticket_replies table\n";

    // Help Articles Table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS help_articles (
            id INT AUTO_INCREMENT PRIMARY KEY,
            category VARCHAR(50) NOT NULL,
            title VARCHAR(255) NOT NULL,
            slug VARCHAR(255) NOT NULL UNIQUE,
            content TEXT NOT NULL,
            excerpt TEXT,
            tags JSON,
            is_published BOOLEAN DEFAULT TRUE,
            view_count INT DEFAULT 0,
            helpful_count INT DEFAULT 0,
            not_helpful_count INT DEFAULT 0,
            author_id INT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL,
            INDEX idx_category (category),
            INDEX idx_slug (slug),
            INDEX idx_published (is_published)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    echo "✓ Created help_articles table\n";

    // Location Logs Table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS location_logs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            latitude DECIMAL(10, 8) NOT NULL,
            longitude DECIMAL(11, 8) NOT NULL,
            accuracy DECIMAL(10, 2),
            city VARCHAR(100),
            province VARCHAR(100),
            country VARCHAR(100) DEFAULT 'Philippines',
            purpose VARCHAR(50),
            ip_address VARCHAR(45),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            INDEX idx_user (user_id),
            INDEX idx_created (created_at),
            INDEX idx_location (latitude, longitude)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    echo "✓ Created location_logs table\n";

    // Add status column to users table if not exists
    $pdo->exec("
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS status ENUM('active', 'suspended', 'banned') DEFAULT 'active',
        ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMP NULL,
        ADD COLUMN IF NOT EXISTS suspended_reason TEXT,
        ADD INDEX IF NOT EXISTS idx_status (status)
    ");
    echo "✓ Updated users table with status column\n";

    // Seed some initial data
    echo "\nSeeding initial data...\n";

    // Get admin user ID
    $stmt = $pdo->query("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
    $admin = $stmt->fetch(PDO::FETCH_ASSOC);
    $adminId = $admin['id'] ?? 1;

    // Seed Help Articles
    $helpArticles = [
        ['getting-started', 'For Couples', 'Getting Started with Wedding Bazaar', 'Learn how to find and book the perfect vendors for your wedding day.', 'Welcome to Wedding Bazaar! This guide will help you navigate our platform and find the perfect vendors for your special day...'],
        ['vendor-booking', 'For Couples', 'How to Book a Vendor', 'Step-by-step guide to booking vendors through our platform.', 'Booking a vendor on Wedding Bazaar is simple and secure. Follow these steps to confirm your wedding vendor...'],
        ['vendor-registration', 'For Vendors', 'Vendor Registration Guide', 'Complete guide to setting up your vendor profile.', 'Welcome to the Wedding Bazaar vendor community! Follow this guide to set up your business profile and start receiving bookings...'],
        ['verification-process', 'For Vendors', 'Verification Process Explained', 'Understand how to get your business verified.', 'Getting verified helps build trust with potential clients. Here is what you need to complete the verification process...'],
        ['payment-methods', 'Payments', 'Accepted Payment Methods', 'Learn about the payment options available on our platform.', 'Wedding Bazaar supports multiple payment methods to make transactions convenient for both couples and vendors...'],
        ['refund-policy', 'Payments', 'Refund and Cancellation Policy', 'Understanding our refund and cancellation guidelines.', 'We understand that plans can change. Here is our policy on refunds and cancellations...'],
    ];

    $stmt = $pdo->prepare("INSERT IGNORE INTO help_articles (slug, category, title, excerpt, content, author_id) VALUES (?, ?, ?, ?, ?, ?)");
    foreach ($helpArticles as $article) {
        $stmt->execute([$article[0], $article[1], $article[2], $article[3], $article[4], $adminId]);
    }
    echo "✓ Seeded help articles\n";

    // Seed some activity logs
    $activities = [
        [$adminId, 'login', null, null, 'Logged in successfully', '192.168.1.1', 'Manila, PH'],
        [$adminId, 'user_view', 'user', 2, 'Viewed user profile #2', '192.168.1.1', 'Manila, PH'],
    ];

    $stmt = $pdo->prepare("INSERT INTO activity_logs (user_id, action, entity_type, entity_id, description, ip_address, location) VALUES (?, ?, ?, ?, ?, ?, ?)");
    foreach ($activities as $activity) {
        $stmt->execute($activity);
    }
    echo "✓ Seeded activity logs\n";

    echo "\n✅ Admin features migration completed successfully!\n";

} catch (PDOException $e) {
    echo "❌ Migration failed: " . $e->getMessage() . "\n";
    exit(1);
}
