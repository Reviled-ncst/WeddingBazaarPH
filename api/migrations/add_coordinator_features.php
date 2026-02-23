<?php
/**
 * Migration: Add coordinator features tables (clients, events, tasks)
 * Run: php migrations/add_coordinator_features.php
 */

require_once __DIR__ . '/../config/database.php';

try {
    $pdo = getDBConnection();
    
    // Create coordinator_clients table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS coordinator_clients (
            id INT AUTO_INCREMENT PRIMARY KEY,
            coordinator_id INT NOT NULL,
            couple_name VARCHAR(255) NOT NULL,
            partner1_name VARCHAR(100),
            partner2_name VARCHAR(100),
            email VARCHAR(255),
            phone VARCHAR(20),
            wedding_date DATE,
            venue_name VARCHAR(255),
            budget DECIMAL(12,2),
            notes TEXT,
            status ENUM('active', 'completed', 'cancelled') DEFAULT 'active',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (coordinator_id) REFERENCES coordinators(id) ON DELETE CASCADE,
            INDEX idx_coordinator (coordinator_id),
            INDEX idx_status (status),
            INDEX idx_wedding_date (wedding_date)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    echo "✓ Created coordinator_clients table\n";
    
    // Create coordinator_events table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS coordinator_events (
            id INT AUTO_INCREMENT PRIMARY KEY,
            coordinator_id INT NOT NULL,
            client_id INT,
            title VARCHAR(255) NOT NULL,
            event_date DATE NOT NULL,
            event_time TIME,
            location VARCHAR(255),
            description TEXT,
            event_type ENUM('wedding', 'engagement', 'rehearsal', 'meeting', 'other') DEFAULT 'wedding',
            status ENUM('upcoming', 'in_progress', 'completed', 'cancelled') DEFAULT 'upcoming',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (coordinator_id) REFERENCES coordinators(id) ON DELETE CASCADE,
            FOREIGN KEY (client_id) REFERENCES coordinator_clients(id) ON DELETE SET NULL,
            INDEX idx_coordinator (coordinator_id),
            INDEX idx_client (client_id),
            INDEX idx_event_date (event_date),
            INDEX idx_status (status)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    echo "✓ Created coordinator_events table\n";
    
    // Create coordinator_tasks table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS coordinator_tasks (
            id INT AUTO_INCREMENT PRIMARY KEY,
            coordinator_id INT NOT NULL,
            event_id INT,
            client_id INT,
            title VARCHAR(255) NOT NULL,
            description TEXT,
            due_date DATE,
            priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
            is_completed BOOLEAN DEFAULT FALSE,
            completed_at TIMESTAMP NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (coordinator_id) REFERENCES coordinators(id) ON DELETE CASCADE,
            FOREIGN KEY (event_id) REFERENCES coordinator_events(id) ON DELETE SET NULL,
            FOREIGN KEY (client_id) REFERENCES coordinator_clients(id) ON DELETE SET NULL,
            INDEX idx_coordinator (coordinator_id),
            INDEX idx_event (event_id),
            INDEX idx_client (client_id),
            INDEX idx_due_date (due_date),
            INDEX idx_completed (is_completed)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    echo "✓ Created coordinator_tasks table\n";
    
    echo "\n✅ All coordinator feature tables created successfully!\n";
    
} catch (PDOException $e) {
    echo "❌ Migration failed: " . $e->getMessage() . "\n";
    exit(1);
}
