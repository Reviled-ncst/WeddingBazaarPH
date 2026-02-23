-- Analytics Migration
-- Tracks page views, clicks, and user interactions for heatmaps
-- No foreign keys for standalone deployment

-- Page Views tracking
CREATE TABLE IF NOT EXISTS page_views (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id VARCHAR(64) NOT NULL,
    user_id INT NULL,
    page_path VARCHAR(500) NOT NULL,
    page_title VARCHAR(255),
    referrer VARCHAR(500),
    user_agent TEXT,
    ip_address VARCHAR(45),
    country VARCHAR(100),
    city VARCHAR(100),
    device_type ENUM('desktop', 'tablet', 'mobile') DEFAULT 'desktop',
    browser VARCHAR(50),
    os VARCHAR(50),
    screen_width INT,
    screen_height INT,
    viewport_width INT,
    viewport_height INT,
    time_on_page INT DEFAULT 0 COMMENT 'Time in seconds',
    scroll_depth INT DEFAULT 0 COMMENT 'Percentage scrolled',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_session (session_id),
    INDEX idx_user (user_id),
    INDEX idx_page (page_path(191)),
    INDEX idx_created (created_at),
    INDEX idx_device (device_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Click/Interaction tracking for heatmaps
CREATE TABLE IF NOT EXISTS click_events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id VARCHAR(64) NOT NULL,
    page_view_id INT,
    page_path VARCHAR(500) NOT NULL,
    element_tag VARCHAR(50),
    element_id VARCHAR(255),
    element_class VARCHAR(500),
    element_text VARCHAR(255),
    click_x INT NOT NULL COMMENT 'X position relative to viewport',
    click_y INT NOT NULL COMMENT 'Y position relative to viewport',
    page_x INT COMMENT 'X position relative to full page',
    page_y INT COMMENT 'Y position relative to full page',
    viewport_width INT,
    viewport_height INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_session (session_id),
    INDEX idx_page_view (page_view_id),
    INDEX idx_page (page_path(191)),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Scroll depth tracking
CREATE TABLE IF NOT EXISTS scroll_events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id VARCHAR(64) NOT NULL,
    page_view_id INT,
    page_path VARCHAR(500) NOT NULL,
    scroll_depth INT NOT NULL COMMENT 'Percentage 0-100',
    scroll_y INT COMMENT 'Absolute scroll position',
    page_height INT,
    viewport_height INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_session (session_id),
    INDEX idx_page_view (page_view_id),
    INDEX idx_page (page_path(191))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Custom event tracking
CREATE TABLE IF NOT EXISTS custom_events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id VARCHAR(64) NOT NULL,
    user_id INT NULL,
    event_name VARCHAR(100) NOT NULL,
    event_category VARCHAR(100),
    event_label VARCHAR(255),
    event_value DECIMAL(10,2),
    page_path VARCHAR(500),
    properties JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_session (session_id),
    INDEX idx_user (user_id),
    INDEX idx_event_name (event_name),
    INDEX idx_category (event_category),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User sessions
CREATE TABLE IF NOT EXISTS user_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id VARCHAR(64) NOT NULL UNIQUE,
    user_id INT NULL,
    first_page VARCHAR(500),
    landing_page VARCHAR(500),
    exit_page VARCHAR(500),
    referrer VARCHAR(500),
    utm_source VARCHAR(100),
    utm_medium VARCHAR(100),
    utm_campaign VARCHAR(100),
    device_type ENUM('desktop', 'tablet', 'mobile'),
    browser VARCHAR(50),
    os VARCHAR(50),
    country VARCHAR(100),
    city VARCHAR(100),
    page_views INT DEFAULT 0,
    total_time INT DEFAULT 0 COMMENT 'Total time in seconds',
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP NULL,
    is_bounce BOOLEAN DEFAULT TRUE,
    INDEX idx_session (session_id),
    INDEX idx_user (user_id),
    INDEX idx_started (started_at),
    INDEX idx_bounce (is_bounce)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Daily aggregated stats (for faster dashboard queries)
CREATE TABLE IF NOT EXISTS analytics_daily (
    id INT AUTO_INCREMENT PRIMARY KEY,
    date DATE NOT NULL,
    page_path VARCHAR(500),
    page_views INT DEFAULT 0,
    unique_visitors INT DEFAULT 0,
    avg_time_on_page DECIMAL(10,2) DEFAULT 0,
    avg_scroll_depth DECIMAL(5,2) DEFAULT 0,
    bounce_rate DECIMAL(5,2) DEFAULT 0,
    clicks INT DEFAULT 0,
    desktop_views INT DEFAULT 0,
    mobile_views INT DEFAULT 0,
    tablet_views INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_date_page (date, page_path(191)),
    INDEX idx_date (date),
    INDEX idx_page (page_path(191))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
