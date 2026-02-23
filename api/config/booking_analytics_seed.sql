-- Booking Source Migration & Demo Data
-- Adds location/source tracking to bookings and seeds demo data

-- Add source tracking columns to bookings table
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS source_page VARCHAR(255) DEFAULT NULL COMMENT 'Page where booking was initiated',
ADD COLUMN IF NOT EXISTS referrer VARCHAR(500) DEFAULT NULL COMMENT 'External referrer URL',
ADD COLUMN IF NOT EXISTS utm_source VARCHAR(100) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS utm_medium VARCHAR(100) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS utm_campaign VARCHAR(100) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS user_city VARCHAR(100) DEFAULT NULL COMMENT 'User location at booking time',
ADD COLUMN IF NOT EXISTS user_province VARCHAR(100) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS user_latitude DECIMAL(10,8) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS user_longitude DECIMAL(11,8) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS device_type ENUM('desktop','tablet','mobile') DEFAULT NULL,
ADD COLUMN IF NOT EXISTS browser VARCHAR(50) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS session_id VARCHAR(64) DEFAULT NULL;

-- Add indexes for analytics queries
ALTER TABLE bookings
ADD INDEX IF NOT EXISTS idx_source_page (source_page),
ADD INDEX IF NOT EXISTS idx_user_city (user_city),
ADD INDEX IF NOT EXISTS idx_user_province (user_province),
ADD INDEX IF NOT EXISTS idx_device (device_type);

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
-- DEMO BOOKING DATA
-- Various locations across the Philippines
-- =====================================================

-- Clear existing demo bookings (keeping original IDs 1-8)
DELETE FROM bookings WHERE id > 8;

-- Reset auto increment to continue from existing data
ALTER TABLE bookings AUTO_INCREMENT = 9;

-- Metro Manila Bookings
INSERT INTO bookings (user_id, vendor_id, service_id, event_date, status, total_price, payment_method, payment_status, source_page, referrer, user_city, user_province, user_latitude, user_longitude, device_type, browser, created_at, paid_at) VALUES
-- Manila bookings
(22, 1, 1, '2026-03-15', 'confirmed', 52500.00, 'gcash', 'paid', '/vendors/1', 'https://www.google.com/search?q=wedding+photographer+manila', 'Manila', 'Metro Manila', 14.5995, 120.9842, 'desktop', 'Chrome', '2026-02-01 10:30:00', '2026-02-01 10:45:00'),
(23, 1, 2, '2026-04-20', 'confirmed', 100000.00, 'card', 'paid', '/discover', 'https://www.facebook.com', 'Manila', 'Metro Manila', 14.5995, 120.9842, 'mobile', 'Safari', '2026-02-02 14:15:00', '2026-02-02 14:30:00'),
(22, 4, 4, '2026-05-10', 'pending', 230000.00, NULL, 'unpaid', '/vendors/4', NULL, 'Manila', 'Metro Manila', 14.5995, 120.9842, 'desktop', 'Firefox', '2026-02-03 09:00:00', NULL),

-- Quezon City bookings
(23, 2, 3, '2026-03-22', 'confirmed', 57000.00, 'gcash', 'paid', '/discover', 'https://www.instagram.com', 'Quezon City', 'Metro Manila', 14.6760, 121.0437, 'mobile', 'Chrome', '2026-02-04 16:45:00', '2026-02-04 17:00:00'),
(22, 9, 8, '2026-06-01', 'confirmed', 72100.00, 'card', 'paid', '/vendors/9', 'https://www.google.com/search?q=wedding+florist+qc', 'Quezon City', 'Metro Manila', 14.6760, 121.0437, 'desktop', 'Chrome', '2026-02-05 11:20:00', '2026-02-05 11:35:00'),

-- Makati bookings  
(23, 13, 11, '2026-04-05', 'confirmed', 45000.00, 'gcash', 'paid', '/discover', 'https://www.tiktok.com', 'Makati', 'Metro Manila', 14.5547, 121.0244, 'mobile', 'TikTok Browser', '2026-02-06 13:30:00', '2026-02-06 13:45:00'),
(22, 4, 4, '2026-07-15', 'pending', 230000.00, NULL, 'unpaid', '/vendors/4', 'https://www.wedding.com.ph', 'Makati', 'Metro Manila', 14.5547, 121.0244, 'tablet', 'Safari', '2026-02-07 10:00:00', NULL),

-- Taguig bookings
(23, 8, 7, '2026-05-25', 'confirmed', 140000.00, 'card', 'paid', '/discover', 'https://www.google.com', 'Taguig', 'Metro Manila', 14.5176, 121.0509, 'desktop', 'Edge', '2026-02-08 15:00:00', '2026-02-08 15:15:00'),

-- Pasig bookings
(22, 7, 6, '2026-04-12', 'confirmed', 113000.00, 'gcash', 'paid', '/vendors/7', 'https://www.facebook.com/weddingbazaarph', 'Pasig', 'Metro Manila', 14.5764, 121.0851, 'mobile', 'Facebook Browser', '2026-02-09 12:30:00', '2026-02-09 12:45:00'),

-- Cavite bookings
(23, 5, 5, '2026-06-20', 'confirmed', 153000.00, 'card', 'paid', '/discover', 'https://www.google.com/search?q=tagaytay+wedding+venue', 'Tagaytay', 'Cavite', 14.1153, 120.9621, 'desktop', 'Chrome', '2026-02-10 09:45:00', '2026-02-10 10:00:00'),
(22, 5, 5, '2026-08-08', 'pending', 153000.00, NULL, 'unpaid', '/vendors/5', 'https://www.instagram.com/tagaytayweddings', 'Dasmariñas', 'Cavite', 14.3294, 120.9367, 'mobile', 'Instagram Browser', '2026-02-11 14:00:00', NULL),
(23, 22, 19, '2026-09-12', 'confirmed', 65000.00, 'gcash', 'paid', '/vendors/22', NULL, 'Bacoor', 'Cavite', 14.4624, 120.9645, 'desktop', 'Chrome', '2026-02-12 10:30:00', '2026-02-12 10:45:00'),

-- Laguna bookings
(22, 15, 12, '2026-05-30', 'confirmed', 123000.00, 'card', 'paid', '/discover', 'https://www.google.com/search?q=wedding+videographer+laguna', 'San Pablo', 'Laguna', 14.0685, 121.3251, 'desktop', 'Chrome', '2026-02-13 11:00:00', '2026-02-13 11:15:00'),
(23, 16, 13, '2026-07-18', 'pending', 125500.00, NULL, 'unpaid', '/vendors/16', 'https://www.facebook.com', 'Calamba', 'Laguna', 14.2118, 121.1653, 'mobile', 'Safari', '2026-02-14 16:00:00', NULL),

-- Batangas bookings
(22, 6, NULL, '2026-06-28', 'confirmed', 180000.00, 'gcash', 'paid', '/discover', 'https://www.google.com/search?q=beach+wedding+batangas', 'Batangas City', 'Batangas', 13.7565, 121.0583, 'desktop', 'Chrome', '2026-02-15 10:00:00', '2026-02-15 10:15:00'),
(23, 6, NULL, '2026-09-05', 'pending', 180000.00, NULL, 'unpaid', '/vendors/6', 'https://www.beachweddings.ph', 'Lipa', 'Batangas', 13.9411, 121.1644, 'tablet', 'Chrome', '2026-02-16 14:30:00', NULL),

-- Cebu bookings
(22, 11, 9, '2026-07-25', 'confirmed', 80000.00, 'card', 'paid', '/discover', 'https://www.google.com/search?q=wedding+band+cebu', 'Cebu City', 'Cebu', 10.3157, 123.8854, 'desktop', 'Chrome', '2026-02-17 09:00:00', '2026-02-17 09:15:00'),
(23, 12, 10, '2026-08-15', 'confirmed', 61200.00, 'gcash', 'paid', '/vendors/12', 'https://www.cebuweddings.com', 'Cebu City', 'Cebu', 10.3157, 123.8854, 'mobile', 'Chrome', '2026-02-18 13:00:00', '2026-02-18 13:15:00'),
(22, 10, NULL, '2026-10-10', 'pending', 25000.00, NULL, 'unpaid', '/discover', 'https://www.instagram.com', 'Mandaue', 'Cebu', 10.3236, 123.9223, 'mobile', 'Instagram Browser', '2026-02-19 15:30:00', NULL),

-- Davao bookings
(23, 1, 1, '2026-08-22', 'confirmed', 52500.00, 'gcash', 'paid', '/vendors/1', 'https://www.google.com/search?q=wedding+photographer+davao', 'Davao City', 'Davao del Sur', 7.1907, 125.4553, 'desktop', 'Chrome', '2026-02-20 10:00:00', '2026-02-20 10:15:00'),
(22, 14, NULL, '2026-09-28', 'pending', 12000.00, NULL, 'unpaid', '/discover', 'https://www.facebook.com/davaoweddings', 'Davao City', 'Davao del Sur', 7.1907, 125.4553, 'mobile', 'Facebook Browser', '2026-02-21 14:00:00', NULL),

-- Pampanga bookings
(23, 2, 3, '2026-06-08', 'confirmed', 57000.00, 'card', 'paid', '/discover', 'https://www.google.com', 'Angeles City', 'Pampanga', 15.1450, 120.5887, 'desktop', 'Chrome', '2026-02-22 11:30:00', '2026-02-22 11:45:00'),
(22, 7, 6, '2026-07-30', 'confirmed', 113000.00, 'gcash', 'paid', '/vendors/7', NULL, 'San Fernando', 'Pampanga', 15.0286, 120.6872, 'tablet', 'Safari', '2026-02-22 16:00:00', '2026-02-22 16:15:00'),

-- Bulacan bookings
(23, 3, NULL, '2026-05-18', 'confirmed', 40000.00, 'gcash', 'paid', '/discover', 'https://www.google.com/search?q=drone+photography+bulacan', 'Malolos', 'Bulacan', 14.8433, 120.8108, 'mobile', 'Chrome', '2026-02-23 09:00:00', '2026-02-23 09:15:00'),
(22, 9, 8, '2026-08-02', 'pending', 72100.00, NULL, 'unpaid', '/vendors/9', 'https://www.instagram.com', 'Meycauayan', 'Bulacan', 14.7367, 120.9608, 'mobile', 'Instagram Browser', '2026-02-23 14:00:00', NULL),

-- Iloilo bookings
(23, 13, 11, '2026-09-15', 'confirmed', 45000.00, 'card', 'paid', '/discover', 'https://www.google.com/search?q=bridal+makeup+iloilo', 'Iloilo City', 'Iloilo', 10.7202, 122.5621, 'desktop', 'Firefox', '2026-02-23 10:30:00', '2026-02-23 10:45:00'),

-- Baguio bookings
(22, 16, 13, '2026-10-20', 'pending', 125500.00, NULL, 'unpaid', '/vendors/16', 'https://www.baguioweddings.com', 'Baguio City', 'Benguet', 16.4023, 120.5960, 'desktop', 'Chrome', '2026-02-23 15:00:00', NULL),

-- Cagayan de Oro bookings
(23, 15, 12, '2026-11-05', 'confirmed', 123000.00, 'gcash', 'paid', '/discover', 'https://www.google.com', 'Cagayan de Oro', 'Misamis Oriental', 8.4542, 124.6319, 'mobile', 'Chrome', '2026-02-23 16:30:00', '2026-02-23 16:45:00');

-- =====================================================
-- SEED PAGE VIEWS DATA (for heatmaps)
-- Based on booking source pages
-- =====================================================

-- Insert page views corresponding to booking sources
INSERT INTO page_views (session_id, user_id, page_path, page_title, referrer, device_type, browser, os, city, country, screen_width, screen_height, viewport_width, viewport_height, time_on_page, scroll_depth, created_at) VALUES
-- Manila visitors
('sess_manila_001', 22, '/', 'Wedding Bazaar - Find Your Perfect Wedding Vendors', 'https://www.google.com', 'desktop', 'Chrome', 'Windows', 'Manila', 'Philippines', 1920, 1080, 1920, 900, 45, 75, '2026-02-01 10:25:00'),
('sess_manila_001', 22, '/vendors/1', 'Maria Santos Photography', 'https://www.google.com', 'desktop', 'Chrome', 'Windows', 'Manila', 'Philippines', 1920, 1080, 1920, 900, 180, 90, '2026-02-01 10:28:00'),
('sess_manila_002', 23, '/', 'Wedding Bazaar', 'https://www.facebook.com', 'mobile', 'Safari', 'iOS', 'Manila', 'Philippines', 390, 844, 390, 700, 30, 60, '2026-02-02 14:10:00'),
('sess_manila_002', 23, '/discover', 'Discover Vendors', 'https://www.facebook.com', 'mobile', 'Safari', 'iOS', 'Manila', 'Philippines', 390, 844, 390, 700, 120, 85, '2026-02-02 14:12:00'),

-- Quezon City visitors  
('sess_qc_001', 23, '/', 'Wedding Bazaar', 'https://www.instagram.com', 'mobile', 'Chrome', 'Android', 'Quezon City', 'Philippines', 412, 915, 412, 780, 25, 50, '2026-02-04 16:40:00'),
('sess_qc_001', 23, '/discover', 'Discover Vendors', NULL, 'mobile', 'Chrome', 'Android', 'Quezon City', 'Philippines', 412, 915, 412, 780, 150, 95, '2026-02-04 16:42:00'),
('sess_qc_002', 22, '/vendors/9', 'Bloom & Petals Studio', 'https://www.google.com', 'desktop', 'Chrome', 'Windows', 'Quezon City', 'Philippines', 1920, 1080, 1920, 900, 200, 100, '2026-02-05 11:15:00'),

-- Makati visitors
('sess_makati_001', 23, '/', 'Wedding Bazaar', 'https://www.tiktok.com', 'mobile', 'TikTok Browser', 'iOS', 'Makati', 'Philippines', 390, 844, 390, 700, 20, 40, '2026-02-06 13:25:00'),
('sess_makati_001', 23, '/discover', 'Discover Vendors', NULL, 'mobile', 'TikTok Browser', 'iOS', 'Makati', 'Philippines', 390, 844, 390, 700, 90, 80, '2026-02-06 13:27:00'),

-- Tagaytay visitors
('sess_tagaytay_001', 23, '/', 'Wedding Bazaar', 'https://www.google.com', 'desktop', 'Chrome', 'MacOS', 'Tagaytay', 'Philippines', 2560, 1440, 2560, 1300, 60, 85, '2026-02-10 09:40:00'),
('sess_tagaytay_001', 23, '/discover', 'Discover Vendors', NULL, 'desktop', 'Chrome', 'MacOS', 'Tagaytay', 'Philippines', 2560, 1440, 2560, 1300, 180, 100, '2026-02-10 09:42:00'),
('sess_tagaytay_001', 23, '/vendors/5', 'Garden Paradise Tagaytay', NULL, 'desktop', 'Chrome', 'MacOS', 'Tagaytay', 'Philippines', 2560, 1440, 2560, 1300, 240, 100, '2026-02-10 09:45:00'),

-- Cebu visitors
('sess_cebu_001', 22, '/', 'Wedding Bazaar', 'https://www.google.com', 'desktop', 'Chrome', 'Windows', 'Cebu City', 'Philippines', 1920, 1080, 1920, 900, 40, 70, '2026-02-17 08:55:00'),
('sess_cebu_001', 22, '/discover', 'Discover Vendors', NULL, 'desktop', 'Chrome', 'Windows', 'Cebu City', 'Philippines', 1920, 1080, 1920, 900, 150, 90, '2026-02-17 08:57:00'),
('sess_cebu_002', 23, '/vendors/12', 'DJ Beats Entertainment', 'https://www.cebuweddings.com', 'mobile', 'Chrome', 'Android', 'Cebu City', 'Philippines', 412, 915, 412, 780, 180, 95, '2026-02-18 12:55:00'),

-- Davao visitors
('sess_davao_001', 23, '/', 'Wedding Bazaar', 'https://www.google.com', 'desktop', 'Chrome', 'Windows', 'Davao City', 'Philippines', 1920, 1080, 1920, 900, 35, 65, '2026-02-20 09:55:00'),
('sess_davao_001', 23, '/vendors/1', 'Maria Santos Photography', NULL, 'desktop', 'Chrome', 'Windows', 'Davao City', 'Philippines', 1920, 1080, 1920, 900, 200, 100, '2026-02-20 09:57:00'),

-- Pampanga visitors
('sess_pampanga_001', 23, '/', 'Wedding Bazaar', 'https://www.google.com', 'desktop', 'Chrome', 'Windows', 'Angeles City', 'Philippines', 1920, 1080, 1920, 900, 50, 80, '2026-02-22 11:25:00'),
('sess_pampanga_001', 23, '/discover', 'Discover Vendors', NULL, 'desktop', 'Chrome', 'Windows', 'Angeles City', 'Philippines', 1920, 1080, 1920, 900, 160, 95, '2026-02-22 11:27:00'),

-- Baguio visitors
('sess_baguio_001', 22, '/', 'Wedding Bazaar', 'https://www.baguioweddings.com', 'desktop', 'Chrome', 'Windows', 'Baguio City', 'Philippines', 1920, 1080, 1920, 900, 55, 75, '2026-02-23 14:55:00'),
('sess_baguio_001', 22, '/vendors/16', 'Enchanted Designs', NULL, 'desktop', 'Chrome', 'Windows', 'Baguio City', 'Philippines', 1920, 1080, 1920, 900, 180, 90, '2026-02-23 14:58:00');

-- =====================================================
-- SEED CLICK EVENTS DATA (for heatmaps)
-- Common interaction points
-- =====================================================

INSERT INTO click_events (session_id, page_path, element_tag, element_id, element_class, element_text, click_x, click_y, page_x, page_y, viewport_width, viewport_height, created_at) VALUES
-- Homepage clicks
('sess_manila_001', '/', 'BUTTON', 'search-btn', 'btn-primary', 'Search Vendors', 960, 450, 960, 450, 1920, 900, '2026-02-01 10:25:30'),
('sess_manila_001', '/', 'A', NULL, 'category-card', 'Photography', 400, 600, 400, 1200, 1920, 900, '2026-02-01 10:26:00'),
('sess_manila_002', '/', 'A', NULL, 'featured-vendor', 'View Profile', 195, 500, 195, 800, 390, 700, '2026-02-02 14:11:00'),
('sess_qc_001', '/', 'BUTTON', NULL, 'nav-discover', 'Discover', 300, 50, 300, 50, 412, 780, '2026-02-04 16:41:00'),
('sess_makati_001', '/', 'A', NULL, 'hero-cta', 'Get Started', 195, 300, 195, 300, 390, 700, '2026-02-06 13:26:00'),
('sess_tagaytay_001', '/', 'INPUT', 'location-search', 'search-input', NULL, 800, 200, 800, 200, 2560, 1300, '2026-02-10 09:41:00'),
('sess_cebu_001', '/', 'A', NULL, 'category-card', 'Venues', 600, 600, 600, 1200, 1920, 900, '2026-02-17 08:56:00'),
('sess_davao_001', '/', 'BUTTON', NULL, 'register-btn', 'Register', 1800, 30, 1800, 30, 1920, 900, '2026-02-20 09:56:00'),

-- Discover page clicks
('sess_manila_002', '/discover', 'BUTTON', NULL, 'filter-category', 'Photography', 150, 200, 150, 200, 390, 700, '2026-02-02 14:13:00'),
('sess_qc_001', '/discover', 'A', NULL, 'vendor-card', 'Book Now', 200, 400, 200, 600, 412, 780, '2026-02-04 16:44:00'),
('sess_tagaytay_001', '/discover', 'SELECT', 'location-filter', 'filter-select', 'Cavite', 300, 150, 300, 150, 2560, 1300, '2026-02-10 09:43:00'),
('sess_cebu_001', '/discover', 'A', NULL, 'vendor-card', 'View Details', 600, 450, 600, 800, 1920, 900, '2026-02-17 08:58:00'),
('sess_pampanga_001', '/discover', 'BUTTON', NULL, 'sort-rating', 'Highest Rated', 1700, 150, 1700, 150, 1920, 900, '2026-02-22 11:28:00'),

-- Vendor profile page clicks
('sess_manila_001', '/vendors/1', 'BUTTON', 'book-now', 'btn-book', 'Book Now', 1500, 300, 1500, 300, 1920, 900, '2026-02-01 10:30:00'),
('sess_qc_002', '/vendors/9', 'BUTTON', 'book-now', 'btn-book', 'Book Now', 1500, 350, 1500, 350, 1920, 900, '2026-02-05 11:18:00'),
('sess_tagaytay_001', '/vendors/5', 'IMG', NULL, 'gallery-image', NULL, 800, 500, 800, 800, 2560, 1300, '2026-02-10 09:47:00'),
('sess_tagaytay_001', '/vendors/5', 'BUTTON', 'book-now', 'btn-book', 'Book Now', 2000, 300, 2000, 300, 2560, 1300, '2026-02-10 09:48:00'),
('sess_cebu_002', '/vendors/12', 'BUTTON', 'message-btn', 'btn-message', 'Send Message', 1500, 320, 1500, 320, 412, 780, '2026-02-18 12:58:00'),
('sess_davao_001', '/vendors/1', 'BUTTON', 'book-now', 'btn-book', 'Book Now', 1500, 300, 1500, 300, 1920, 900, '2026-02-20 10:00:00'),
('sess_baguio_001', '/vendors/16', 'A', NULL, 'service-tab', 'Services', 400, 400, 400, 400, 1920, 900, '2026-02-23 15:00:00');

-- =====================================================
-- SEED CUSTOM EVENTS (booking conversions)
-- =====================================================

INSERT INTO custom_events (session_id, user_id, event_name, event_category, event_label, event_value, page_path, properties, created_at) VALUES
('sess_manila_001', 22, 'booking_started', 'conversion', 'photography', 52500.00, '/vendors/1', '{"vendor_id": 1, "service_id": 1, "city": "Manila"}', '2026-02-01 10:30:00'),
('sess_manila_001', 22, 'booking_completed', 'conversion', 'photography', 52500.00, '/vendors/1', '{"vendor_id": 1, "service_id": 1, "payment_method": "gcash"}', '2026-02-01 10:45:00'),
('sess_manila_002', 23, 'booking_completed', 'conversion', 'photography', 100000.00, '/discover', '{"vendor_id": 1, "service_id": 2, "payment_method": "card"}', '2026-02-02 14:30:00'),
('sess_qc_001', 23, 'booking_completed', 'conversion', 'photography', 57000.00, '/discover', '{"vendor_id": 2, "service_id": 3, "payment_method": "gcash"}', '2026-02-04 17:00:00'),
('sess_qc_002', 22, 'booking_completed', 'conversion', 'florist', 72100.00, '/vendors/9', '{"vendor_id": 9, "service_id": 8, "payment_method": "card"}', '2026-02-05 11:35:00'),
('sess_makati_001', 23, 'booking_completed', 'conversion', 'makeup', 45000.00, '/discover', '{"vendor_id": 13, "service_id": 11, "payment_method": "gcash"}', '2026-02-06 13:45:00'),
('sess_tagaytay_001', 23, 'booking_completed', 'conversion', 'venue', 153000.00, '/discover', '{"vendor_id": 5, "service_id": 5, "payment_method": "card"}', '2026-02-10 10:00:00'),
('sess_cebu_001', 22, 'booking_completed', 'conversion', 'music', 80000.00, '/discover', '{"vendor_id": 11, "service_id": 9, "payment_method": "card"}', '2026-02-17 09:15:00'),
('sess_cebu_002', 23, 'booking_completed', 'conversion', 'music', 61200.00, '/vendors/12', '{"vendor_id": 12, "service_id": 10, "payment_method": "gcash"}', '2026-02-18 13:15:00'),
('sess_davao_001', 23, 'booking_completed', 'conversion', 'photography', 52500.00, '/vendors/1', '{"vendor_id": 1, "service_id": 1, "payment_method": "gcash"}', '2026-02-20 10:15:00'),
('sess_pampanga_001', 23, 'booking_completed', 'conversion', 'photography', 57000.00, '/discover', '{"vendor_id": 2, "service_id": 3, "payment_method": "card"}', '2026-02-22 11:45:00');

-- =====================================================
-- UPDATE ANALYTICS DAILY SUMMARY
-- =====================================================

INSERT INTO analytics_daily (date, page_views, unique_visitors, total_clicks, avg_time_on_page, avg_scroll_depth, bounce_rate, top_page, top_referrer) VALUES
('2026-02-01', 156, 89, 423, 85, 72, 35.5, '/', 'google.com'),
('2026-02-02', 203, 112, 567, 78, 68, 38.2, '/discover', 'facebook.com'),
('2026-02-03', 178, 95, 398, 92, 75, 32.1, '/', 'google.com'),
('2026-02-04', 245, 134, 612, 88, 71, 36.8, '/discover', 'instagram.com'),
('2026-02-05', 189, 102, 445, 95, 78, 31.5, '/vendors/9', 'google.com'),
('2026-02-06', 312, 178, 789, 72, 65, 42.3, '/', 'tiktok.com'),
('2026-02-07', 167, 89, 378, 88, 73, 34.7, '/discover', 'wedding.com.ph'),
('2026-02-08', 234, 128, 534, 91, 76, 33.2, '/', 'google.com'),
('2026-02-09', 198, 107, 456, 86, 72, 35.8, '/vendors/7', 'facebook.com'),
('2026-02-10', 276, 152, 678, 98, 82, 28.9, '/discover', 'google.com'),
('2026-02-11', 145, 78, 312, 82, 68, 39.4, '/vendors/5', 'instagram.com'),
('2026-02-12', 189, 103, 423, 89, 74, 34.1, '/', 'google.com'),
('2026-02-13', 223, 121, 512, 94, 79, 31.8, '/discover', 'google.com'),
('2026-02-14', 267, 145, 623, 87, 73, 35.2, '/', 'facebook.com'),
('2026-02-15', 198, 108, 445, 91, 76, 33.5, '/discover', 'google.com'),
('2026-02-16', 156, 84, 334, 78, 65, 40.1, '/vendors/6', 'beachweddings.ph'),
('2026-02-17', 234, 127, 556, 96, 81, 29.8, '/discover', 'google.com'),
('2026-02-18', 289, 158, 689, 88, 74, 34.6, '/', 'cebuweddings.com'),
('2026-02-19', 178, 96, 398, 84, 70, 36.7, '/discover', 'instagram.com'),
('2026-02-20', 245, 134, 567, 92, 77, 32.4, '/vendors/1', 'google.com'),
('2026-02-21', 167, 91, 356, 79, 66, 38.9, '/', 'facebook.com'),
('2026-02-22', 298, 163, 712, 95, 80, 30.5, '/discover', 'google.com'),
('2026-02-23', 312, 171, 756, 97, 82, 28.7, '/', 'google.com'),
('2026-02-24', 278, 152, 634, 91, 76, 32.1, '/discover', 'google.com')
ON DUPLICATE KEY UPDATE 
    page_views = VALUES(page_views),
    unique_visitors = VALUES(unique_visitors),
    total_clicks = VALUES(total_clicks);
