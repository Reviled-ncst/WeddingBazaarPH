-- Booking Analytics & Demo Data
-- Creates analytics summary table and seeds demo data for heatmaps

-- Create booking analytics summary table
CREATE TABLE IF NOT EXISTS booking_analytics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    date DATE NOT NULL,
    source_page VARCHAR(255),
    city VARCHAR(100),
    province VARCHAR(100),
    device_type ENUM('desktop','tablet','mobile'),
    booking_count INT DEFAULT 0,
    total_revenue DECIMAL(12,2) DEFAULT 0,
    confirmed_count INT DEFAULT 0,
    cancelled_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE INDEX idx_daily_source (date, source_page, city, device_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- SEED PAGE VIEWS DATA (for heatmaps)
-- =====================================================

INSERT INTO page_views (session_id, user_id, page_path, page_title, referrer, device_type, browser, os, city, country, screen_width, screen_height, viewport_width, viewport_height, time_on_page, scroll_depth, created_at) VALUES
('sess_manila_001', NULL, '/', 'Wedding Bazaar', 'https://www.google.com', 'desktop', 'Chrome', 'Windows', 'Manila', 'Philippines', 1920, 1080, 1920, 900, 45, 75, '2026-02-01 10:25:00'),
('sess_manila_001', NULL, '/vendors', 'Vendors', NULL, 'desktop', 'Chrome', 'Windows', 'Manila', 'Philippines', 1920, 1080, 1920, 900, 180, 90, '2026-02-01 10:28:00'),
('sess_manila_002', NULL, '/', 'Wedding Bazaar', 'https://www.facebook.com', 'mobile', 'Safari', 'iOS', 'Manila', 'Philippines', 390, 844, 390, 700, 30, 60, '2026-02-02 14:10:00'),
('sess_qc_001', NULL, '/', 'Wedding Bazaar', 'https://www.instagram.com', 'mobile', 'Chrome', 'Android', 'Quezon City', 'Philippines', 412, 915, 412, 780, 25, 50, '2026-02-04 16:40:00'),
('sess_qc_001', NULL, '/discover', 'Discover Vendors', NULL, 'mobile', 'Chrome', 'Android', 'Quezon City', 'Philippines', 412, 915, 412, 780, 150, 95, '2026-02-04 16:42:00'),
('sess_makati_001', NULL, '/', 'Wedding Bazaar', 'https://www.tiktok.com', 'mobile', 'Chrome', 'iOS', 'Makati', 'Philippines', 390, 844, 390, 700, 20, 40, '2026-02-06 13:25:00'),
('sess_tagaytay_001', NULL, '/', 'Wedding Bazaar', 'https://www.google.com', 'desktop', 'Chrome', 'MacOS', 'Tagaytay', 'Philippines', 2560, 1440, 2560, 1300, 60, 85, '2026-02-10 09:40:00'),
('sess_cebu_001', NULL, '/', 'Wedding Bazaar', 'https://www.google.com', 'desktop', 'Chrome', 'Windows', 'Cebu City', 'Philippines', 1920, 1080, 1920, 900, 40, 70, '2026-02-17 08:55:00'),
('sess_cebu_001', NULL, '/discover', 'Discover Vendors', NULL, 'desktop', 'Chrome', 'Windows', 'Cebu City', 'Philippines', 1920, 1080, 1920, 900, 150, 90, '2026-02-17 08:57:00'),
('sess_davao_001', NULL, '/', 'Wedding Bazaar', 'https://www.google.com', 'desktop', 'Chrome', 'Windows', 'Davao City', 'Philippines', 1920, 1080, 1920, 900, 35, 65, '2026-02-20 09:55:00'),
('sess_pampanga_001', NULL, '/', 'Wedding Bazaar', 'https://www.google.com', 'desktop', 'Chrome', 'Windows', 'Angeles City', 'Philippines', 1920, 1080, 1920, 900, 50, 80, '2026-02-22 11:25:00'),
('sess_baguio_001', NULL, '/', 'Wedding Bazaar', 'https://www.baguioweddings.com', 'desktop', 'Chrome', 'Windows', 'Baguio City', 'Philippines', 1920, 1080, 1920, 900, 55, 75, '2026-02-23 14:55:00');

-- =====================================================
-- SEED CLICK EVENTS DATA (for heatmaps)
-- =====================================================

INSERT INTO click_events (session_id, page_path, element_tag, element_id, element_class, element_text, click_x, click_y, page_x, page_y, viewport_width, viewport_height, created_at) VALUES
('sess_manila_001', '/', 'BUTTON', 'search-btn', 'btn-primary', 'Search Vendors', 960, 450, 960, 450, 1920, 900, '2026-02-01 10:25:30'),
('sess_manila_001', '/', 'A', NULL, 'category-card', 'Photography', 400, 600, 400, 1200, 1920, 900, '2026-02-01 10:26:00'),
('sess_manila_002', '/', 'A', NULL, 'featured-vendor', 'View Profile', 195, 500, 195, 800, 390, 700, '2026-02-02 14:11:00'),
('sess_qc_001', '/', 'BUTTON', NULL, 'nav-discover', 'Discover', 300, 50, 300, 50, 412, 780, '2026-02-04 16:41:00'),
('sess_makati_001', '/', 'A', NULL, 'hero-cta', 'Get Started', 195, 300, 195, 300, 390, 700, '2026-02-06 13:26:00'),
('sess_tagaytay_001', '/', 'INPUT', 'location-search', 'search-input', NULL, 800, 200, 800, 200, 2560, 1300, '2026-02-10 09:41:00'),
('sess_cebu_001', '/', 'A', NULL, 'category-card', 'Venues', 600, 600, 600, 1200, 1920, 900, '2026-02-17 08:56:00'),
('sess_davao_001', '/', 'BUTTON', NULL, 'register-btn', 'Register', 1800, 30, 1800, 30, 1920, 900, '2026-02-20 09:56:00'),
('sess_pampanga_001', '/discover', 'BUTTON', NULL, 'sort-rating', 'Highest Rated', 1700, 150, 1700, 150, 1920, 900, '2026-02-22 11:28:00'),
('sess_baguio_001', '/', 'A', NULL, 'service-tab', 'Services', 400, 400, 400, 400, 1920, 900, '2026-02-23 15:00:00');

-- =====================================================
-- SEED CUSTOM EVENTS (analytics events)
-- =====================================================

INSERT INTO custom_events (session_id, user_id, event_name, event_category, event_label, event_value, page_path, properties, created_at) VALUES
('sess_manila_001', NULL, 'booking_started', 'conversion', 'photography', 52500.00, '/vendors', '{"vendor_id": 1, "city": "Manila"}', '2026-02-01 10:30:00'),
('sess_manila_001', NULL, 'booking_completed', 'conversion', 'photography', 52500.00, '/vendors', '{"vendor_id": 1, "payment_method": "gcash"}', '2026-02-01 10:45:00'),
('sess_qc_001', NULL, 'booking_completed', 'conversion', 'photography', 57000.00, '/discover', '{"vendor_id": 2, "payment_method": "gcash"}', '2026-02-04 17:00:00'),
('sess_makati_001', NULL, 'booking_completed', 'conversion', 'makeup', 45000.00, '/discover', '{"vendor_id": 13, "payment_method": "gcash"}', '2026-02-06 13:45:00'),
('sess_tagaytay_001', NULL, 'booking_completed', 'conversion', 'venue', 153000.00, '/discover', '{"vendor_id": 5, "payment_method": "card"}', '2026-02-10 10:00:00'),
('sess_cebu_001', NULL, 'booking_completed', 'conversion', 'music', 80000.00, '/discover', '{"vendor_id": 11, "payment_method": "card"}', '2026-02-17 09:15:00'),
('sess_davao_001', NULL, 'booking_completed', 'conversion', 'photography', 52500.00, '/vendors', '{"vendor_id": 1, "payment_method": "gcash"}', '2026-02-20 10:15:00'),
('sess_pampanga_001', NULL, 'booking_completed', 'conversion', 'photography', 57000.00, '/discover', '{"vendor_id": 2, "payment_method": "card"}', '2026-02-22 11:45:00');

-- =====================================================
-- SEED BOOKING ANALYTICS SUMMARY
-- =====================================================

INSERT INTO booking_analytics (date, source_page, city, province, device_type, booking_count, total_revenue, confirmed_count, cancelled_count) VALUES
('2026-02-01', '/vendors', 'Manila', 'Metro Manila', 'desktop', 2, 102500.00, 2, 0),
('2026-02-02', '/discover', 'Manila', 'Metro Manila', 'mobile', 1, 100000.00, 1, 0),
('2026-02-04', '/discover', 'Quezon City', 'Metro Manila', 'mobile', 1, 57000.00, 1, 0),
('2026-02-06', '/discover', 'Makati', 'Metro Manila', 'mobile', 1, 45000.00, 1, 0),
('2026-02-10', '/discover', 'Tagaytay', 'Cavite', 'desktop', 1, 153000.00, 1, 0),
('2026-02-17', '/discover', 'Cebu City', 'Cebu', 'desktop', 1, 80000.00, 1, 0),
('2026-02-18', '/vendors', 'Cebu City', 'Cebu', 'mobile', 1, 61200.00, 1, 0),
('2026-02-20', '/vendors', 'Davao City', 'Davao del Sur', 'desktop', 1, 52500.00, 1, 0),
('2026-02-22', '/discover', 'Angeles City', 'Pampanga', 'desktop', 1, 57000.00, 1, 0);
