<?php
/**
 * Community Features Migration
 * 
 * Creates tables for:
 * - Job postings (coordinators post jobs, vendors apply)
 * - Vendor availability board (vendors list availability)
 * - Partnership matching (coordinators discover vendors)
 * - Discussion forum (community discussions)
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../config/database.php';

try {
    $database = new Database();
    $conn = $database->getConnection();
    
    $results = [];
    
    // =====================================================
    // JOB POSTINGS TABLES
    // =====================================================
    
    // Job postings table - coordinators post job opportunities
    $sql = "CREATE TABLE IF NOT EXISTS job_postings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        coordinator_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        category VARCHAR(100) NOT NULL COMMENT 'photographer, videographer, caterer, etc.',
        location VARCHAR(255) NOT NULL,
        event_date DATE NULL,
        budget_min DECIMAL(10,2) NULL,
        budget_max DECIMAL(10,2) NULL,
        requirements TEXT NULL COMMENT 'JSON array of requirements',
        status ENUM('open', 'filled', 'cancelled', 'expired') DEFAULT 'open',
        urgency ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
        applications_count INT DEFAULT 0,
        views_count INT DEFAULT 0,
        expires_at DATETIME NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (coordinator_id) REFERENCES coordinators(id) ON DELETE CASCADE,
        INDEX idx_status (status),
        INDEX idx_category (category),
        INDEX idx_location (location),
        INDEX idx_event_date (event_date),
        INDEX idx_expires_at (expires_at)
    )";
    $conn->exec($sql);
    $results[] = ['table' => 'job_postings', 'status' => 'created'];
    
    // Job applications table - vendors apply to jobs
    $sql = "CREATE TABLE IF NOT EXISTS job_applications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        job_id INT NOT NULL,
        vendor_id INT NOT NULL,
        cover_letter TEXT NULL,
        proposed_price DECIMAL(10,2) NULL,
        availability_confirmed BOOLEAN DEFAULT FALSE,
        portfolio_links TEXT NULL COMMENT 'JSON array of portfolio links',
        status ENUM('pending', 'shortlisted', 'accepted', 'rejected', 'withdrawn') DEFAULT 'pending',
        coordinator_notes TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (job_id) REFERENCES job_postings(id) ON DELETE CASCADE,
        FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE,
        UNIQUE KEY unique_application (job_id, vendor_id),
        INDEX idx_status (status)
    )";
    $conn->exec($sql);
    $results[] = ['table' => 'job_applications', 'status' => 'created'];
    
    // =====================================================
    // VENDOR AVAILABILITY TABLES
    // =====================================================
    
    // Vendor availability posts - vendors post when they're available
    $sql = "CREATE TABLE IF NOT EXISTS vendor_availability (
        id INT AUTO_INCREMENT PRIMARY KEY,
        vendor_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT NULL,
        available_from DATE NOT NULL,
        available_to DATE NOT NULL,
        locations TEXT NULL COMMENT 'JSON array of service areas',
        services_offered TEXT NULL COMMENT 'JSON array of service IDs or descriptions',
        special_rate DECIMAL(10,2) NULL COMMENT 'Discounted rate if any',
        regular_rate DECIMAL(10,2) NULL,
        discount_percent INT NULL,
        max_bookings INT DEFAULT 1,
        current_bookings INT DEFAULT 0,
        status ENUM('active', 'fully_booked', 'expired', 'cancelled') DEFAULT 'active',
        views_count INT DEFAULT 0,
        inquiries_count INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE,
        INDEX idx_status (status),
        INDEX idx_dates (available_from, available_to),
        INDEX idx_vendor (vendor_id)
    )";
    $conn->exec($sql);
    $results[] = ['table' => 'vendor_availability', 'status' => 'created'];
    
    // Availability inquiries - coordinators/couples inquire about availability
    $sql = "CREATE TABLE IF NOT EXISTS availability_inquiries (
        id INT AUTO_INCREMENT PRIMARY KEY,
        availability_id INT NOT NULL,
        user_id INT NOT NULL,
        user_type ENUM('couple', 'coordinator') NOT NULL,
        message TEXT NULL,
        event_date DATE NULL,
        status ENUM('pending', 'responded', 'booked', 'declined') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (availability_id) REFERENCES vendor_availability(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_status (status)
    )";
    $conn->exec($sql);
    $results[] = ['table' => 'availability_inquiries', 'status' => 'created'];
    
    // =====================================================
    // PARTNERSHIP MATCHING TABLES
    // =====================================================
    
    // Partnership requests - coordinators can request to partner with vendors
    $sql = "CREATE TABLE IF NOT EXISTS partnership_requests (
        id INT AUTO_INCREMENT PRIMARY KEY,
        coordinator_id INT NOT NULL,
        vendor_id INT NOT NULL,
        message TEXT NULL,
        partnership_type ENUM('preferred', 'exclusive', 'referral') DEFAULT 'preferred',
        commission_rate DECIMAL(5,2) NULL COMMENT 'Referral commission percentage',
        status ENUM('pending', 'accepted', 'rejected', 'cancelled') DEFAULT 'pending',
        responded_at DATETIME NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (coordinator_id) REFERENCES coordinators(id) ON DELETE CASCADE,
        FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE,
        UNIQUE KEY unique_partnership (coordinator_id, vendor_id),
        INDEX idx_status (status)
    )";
    $conn->exec($sql);
    $results[] = ['table' => 'partnership_requests', 'status' => 'created'];
    
    // =====================================================
    // DISCUSSION FORUM TABLES
    // =====================================================
    
    // Forum categories
    $sql = "CREATE TABLE IF NOT EXISTS forum_categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        slug VARCHAR(100) NOT NULL UNIQUE,
        description TEXT NULL,
        icon VARCHAR(50) NULL,
        color VARCHAR(20) NULL,
        allowed_roles TEXT NULL COMMENT 'JSON array: [\"vendor\", \"coordinator\", \"couple\"]',
        sort_order INT DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        threads_count INT DEFAULT 0,
        posts_count INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_slug (slug),
        INDEX idx_active (is_active)
    )";
    $conn->exec($sql);
    $results[] = ['table' => 'forum_categories', 'status' => 'created'];
    
    // Forum threads
    $sql = "CREATE TABLE IF NOT EXISTS forum_threads (
        id INT AUTO_INCREMENT PRIMARY KEY,
        category_id INT NOT NULL,
        user_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        is_pinned BOOLEAN DEFAULT FALSE,
        is_locked BOOLEAN DEFAULT FALSE,
        is_announcement BOOLEAN DEFAULT FALSE,
        views_count INT DEFAULT 0,
        replies_count INT DEFAULT 0,
        likes_count INT DEFAULT 0,
        last_reply_at DATETIME NULL,
        last_reply_by INT NULL,
        status ENUM('active', 'hidden', 'deleted') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES forum_categories(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (last_reply_by) REFERENCES users(id) ON DELETE SET NULL,
        INDEX idx_category (category_id),
        INDEX idx_status (status),
        INDEX idx_pinned (is_pinned),
        INDEX idx_last_reply (last_reply_at)
    )";
    $conn->exec($sql);
    $results[] = ['table' => 'forum_threads', 'status' => 'created'];
    
    // Forum posts (replies)
    $sql = "CREATE TABLE IF NOT EXISTS forum_posts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        thread_id INT NOT NULL,
        user_id INT NOT NULL,
        parent_id INT NULL COMMENT 'For nested replies',
        content TEXT NOT NULL,
        likes_count INT DEFAULT 0,
        is_solution BOOLEAN DEFAULT FALSE COMMENT 'Marked as best answer',
        status ENUM('active', 'hidden', 'deleted') DEFAULT 'active',
        edited_at DATETIME NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (thread_id) REFERENCES forum_threads(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (parent_id) REFERENCES forum_posts(id) ON DELETE SET NULL,
        INDEX idx_thread (thread_id),
        INDEX idx_status (status)
    )";
    $conn->exec($sql);
    $results[] = ['table' => 'forum_posts', 'status' => 'created'];
    
    // Forum likes
    $sql = "CREATE TABLE IF NOT EXISTS forum_likes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        thread_id INT NULL,
        post_id INT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (thread_id) REFERENCES forum_threads(id) ON DELETE CASCADE,
        FOREIGN KEY (post_id) REFERENCES forum_posts(id) ON DELETE CASCADE,
        UNIQUE KEY unique_thread_like (user_id, thread_id),
        UNIQUE KEY unique_post_like (user_id, post_id)
    )";
    $conn->exec($sql);
    $results[] = ['table' => 'forum_likes', 'status' => 'created'];
    
    // Forum subscriptions (follow threads)
    $sql = "CREATE TABLE IF NOT EXISTS forum_subscriptions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        thread_id INT NOT NULL,
        notify_replies BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (thread_id) REFERENCES forum_threads(id) ON DELETE CASCADE,
        UNIQUE KEY unique_subscription (user_id, thread_id)
    )";
    $conn->exec($sql);
    $results[] = ['table' => 'forum_subscriptions', 'status' => 'created'];
    
    // =====================================================
    // SEED DEFAULT FORUM CATEGORIES
    // =====================================================
    
    $sql = "INSERT IGNORE INTO forum_categories (name, slug, description, icon, color, allowed_roles, sort_order) VALUES
        ('General Discussion', 'general', 'Chat about anything wedding-related', 'MessageSquare', 'pink', '[\"vendor\", \"coordinator\", \"couple\"]', 1),
        ('Vendor Networking', 'vendor-networking', 'Connect with other vendors, share tips and collaborate', 'Users', 'blue', '[\"vendor\", \"coordinator\"]', 2),
        ('Job Opportunities', 'job-opportunities', 'Discuss job postings and opportunities', 'Briefcase', 'green', '[\"vendor\", \"coordinator\"]', 3),
        ('Industry Tips', 'industry-tips', 'Share best practices and learn from others', 'Lightbulb', 'yellow', '[\"vendor\", \"coordinator\"]', 4),
        ('Announcements', 'announcements', 'Official platform announcements and updates', 'Bell', 'purple', '[\"vendor\", \"coordinator\", \"couple\"]', 0)
    ";
    $conn->exec($sql);
    $results[] = ['table' => 'forum_categories_seed', 'status' => 'seeded'];
    
    echo json_encode([
        'success' => true,
        'message' => 'Community features migration completed successfully',
        'results' => $results
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
