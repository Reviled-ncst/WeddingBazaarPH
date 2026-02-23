-- Wedding Bazaar Database Schema
-- Run this in phpMyAdmin or MySQL command line

CREATE DATABASE IF NOT EXISTS wedding_bazaar;
USE wedding_bazaar;

-- Users table
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    role ENUM('individual', 'vendor', 'coordinator', 'admin') NOT NULL DEFAULT 'individual',
    phone VARCHAR(20),
    avatar VARCHAR(255),
    email_verified BOOLEAN DEFAULT FALSE,
    phone_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Vendors table (with verification and geolocation)
CREATE TABLE vendors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    business_name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL,
    description TEXT,
    location VARCHAR(255),
    -- Geolocation for distance-based pricing
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    province VARCHAR(100),
    postal_code VARCHAR(20),
    -- Travel/Vehicle info for auto-computed pricing (Cavite standard rates)
    vehicle_type ENUM('motorcycle', 'car', 'suv', 'van', 'truck') DEFAULT 'car',
    -- Pricing info (base_travel_fee and per_km_rate are auto-computed from vehicle_type)
    price_range VARCHAR(50),
    base_travel_fee DECIMAL(10,2) DEFAULT 0,
    per_km_rate DECIMAL(10,2) DEFAULT 0,
    free_km_radius INT DEFAULT 10,
    -- Ratings
    rating DECIMAL(2,1) DEFAULT 0.0,
    review_count INT DEFAULT 0,
    images JSON,
    -- Verification status
    verification_status ENUM('unverified', 'pending', 'verified', 'rejected') DEFAULT 'unverified',
    verification_documents JSON,
    verification_notes TEXT,
    verified_at TIMESTAMP NULL,
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_category (category),
    INDEX idx_location (location),
    INDEX idx_city (city),
    INDEX idx_rating (rating),
    INDEX idx_verification (verification_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Services table (enhanced for pricing breakdown)
CREATE TABLE services (
    id INT AUTO_INCREMENT PRIMARY KEY,
    vendor_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL,
    -- Pricing breakdown structure (JSON array of line items)
    pricing_items JSON NOT NULL,
    -- Computed base total from pricing_items
    base_total DECIMAL(12,2) NOT NULL DEFAULT 0,
    -- Optional add-ons (JSON array with name and price)
    add_ons JSON,
    -- Category-specific details stored as JSON
    details JSON,
    -- What's included in the service
    inclusions JSON,
    -- Portfolio images (JSON array of image objects with url, filename, etc.)
    images JSON,
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE,
    INDEX idx_vendor (vendor_id),
    INDEX idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bookings table
CREATE TABLE bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    vendor_id INT NOT NULL,
    service_id INT,
    event_date DATE NOT NULL,
    status ENUM('pending', 'confirmed', 'completed', 'cancelled') DEFAULT 'pending',
    total_price DECIMAL(10,2),
    notes TEXT,
    has_review BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE SET NULL,
    INDEX idx_user (user_id),
    INDEX idx_vendor (vendor_id),
    INDEX idx_status (status),
    INDEX idx_event_date (event_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Reviews table
CREATE TABLE reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    vendor_id INT NOT NULL,
    booking_id INT,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL,
    INDEX idx_vendor (vendor_id),
    INDEX idx_rating (rating)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Messages table
CREATE TABLE messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sender_id INT NOT NULL,
    receiver_id INT NOT NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_sender (sender_id),
    INDEX idx_receiver (receiver_id),
    INDEX idx_conversation (sender_id, receiver_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Saved Vendors (Favorites)
CREATE TABLE saved_vendors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    vendor_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE,
    UNIQUE KEY unique_saved (user_id, vendor_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Coordinators table (with verification and geolocation)
CREATE TABLE coordinators (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    business_name VARCHAR(255) NOT NULL,
    description TEXT,
    location VARCHAR(255),
    -- Geolocation
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    province VARCHAR(100),
    postal_code VARCHAR(20),
    -- Travel/Vehicle info for auto-computed pricing (Cavite standard rates)
    vehicle_type ENUM('motorcycle', 'car', 'suv', 'van', 'truck') DEFAULT 'car',
    -- Pricing info (base_travel_fee and per_km_rate are auto-computed from vehicle_type)
    price_range VARCHAR(50),
    base_travel_fee DECIMAL(10,2) DEFAULT 0,
    per_km_rate DECIMAL(10,2) DEFAULT 0,
    free_km_radius INT DEFAULT 10,
    -- Ratings
    rating DECIMAL(2,1) DEFAULT 0.0,
    review_count INT DEFAULT 0,
    images JSON,
    specialties JSON,
    weddings_completed INT DEFAULT 0,
    -- Verification status
    verification_status ENUM('unverified', 'pending', 'verified', 'rejected') DEFAULT 'unverified',
    verification_documents JSON,
    verification_notes TEXT,
    verified_at TIMESTAMP NULL,
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_location (location),
    INDEX idx_city (city),
    INDEX idx_rating (rating),
    INDEX idx_verification (verification_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- SEED DATA: Users, Vendors, Coordinators, Services
-- Password for all accounts: 'password'
-- =====================================================

-- Insert users (password is 'password' hashed with bcrypt)
INSERT INTO users (email, password, name, role, phone) VALUES 
-- Admin
('admin@weddingbazaar.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Admin User', 'admin', NULL),
-- Couples
('mj.santos2026@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Juan Miguel & Maria Clara Santos', 'individual', '+639171234567'),
('carlosana.wedding@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Carlos Andres & Ana Patricia Reyes', 'individual', '+639172345678'),
-- Vendors (one for each category)
('hello@royalphotographystudio.ph', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Royal Photography', 'vendor', '+639181234567'),
('bookings@cinematicdreamsph.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Cinematic Dreams', 'vendor', '+639182345678'),
('events@thegrandpavilion.ph', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'The Grand Pavilion', 'vendor', '+639183456789'),
('inquiries@feastandfiesta.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Feast & Fiesta Catering', 'vendor', '+639184567890'),
('info@eleganteventsmnl.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Elegant Events Decor', 'vendor', '+639185678901'),
('orders@bloomandblossomph.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Bloom & Blossom', 'vendor', '+639186789012'),
('book@glamourstudiomnl.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Glamour Studio', 'vendor', '+639187890123'),
('events@soundwaveentertainment.ph', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Soundwave Entertainment', 'vendor', '+639188901234'),
('orders@sweetdelightsbakery.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Sweet Delights Bakery', 'vendor', '+639189012345'),
('hello@perfectdayevents.ph', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Perfect Day Events', 'vendor', '+639180123456'),
-- Coordinators
('info@dreamweddingcoordinators.ph', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Dream Wedding Coordinators', 'coordinator', '+639191234567'),
('concierge@eliteweddingph.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Elite Wedding PH', 'coordinator', '+639192345678');

-- Insert vendor profiles with verification, geolocation, and vehicle type
INSERT INTO vendors (user_id, business_name, category, description, location, latitude, longitude, city, province, vehicle_type, price_range, base_travel_fee, per_km_rate, free_km_radius, rating, review_count, verification_status, verified_at, images) VALUES
-- Photographer (user_id 4) - uses car
(4, 'Royal Photography Studio', 'photographer', 'Premium wedding photography with 10+ years of experience. We capture your special moments with artistic excellence and cinematic style.', 'BGC, Taguig', 14.5505, 121.0501, 'Taguig', 'Metro Manila', 'car', '₱25,000 - ₱150,000', 400, 12, 10, 4.9, 234, 'verified', NOW(), '["https://images.unsplash.com/photo-1519741497674-611481863552?w=800", "https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=800"]'),
-- Videographer (user_id 5) - uses suv
(5, 'Cinematic Dreams Productions', 'videographer', 'Award-winning wedding films that tell your love story. Specializing in cinematic storytelling with drone and gimbal shots.', 'Makati City', 14.5547, 121.0244, 'Makati', 'Metro Manila', 'suv', '₱35,000 - ₱200,000', 550, 16, 10, 4.8, 189, 'verified', NOW(), '["https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=800"]'),
-- Venue (user_id 6) - no vehicle needed
(6, 'The Grand Pavilion', 'venue', 'Elegant indoor and outdoor venue with stunning views. Perfect for intimate gatherings to grand celebrations up to 500 guests.', 'Tagaytay City', 14.1153, 120.9621, 'Tagaytay', 'Cavite', NULL, '₱80,000 - ₱500,000', 0, 0, 0, 4.9, 312, 'verified', NOW(), '["https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800", "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800"]'),
-- Caterer (user_id 7) - uses truck for equipment and food
(7, 'Feast & Fiesta Catering', 'caterer', 'Exquisite Filipino and international cuisine. We bring restaurant-quality food and service to your wedding celebration.', 'Quezon City', 14.6760, 121.0437, 'Quezon City', 'Metro Manila', 'truck', '₱500 - ₱1,500 per pax', 1000, 35, 15, 4.7, 445, 'verified', NOW(), '["https://images.unsplash.com/photo-1555244162-803834f70033?w=800"]'),
-- Decorator (user_id 8) - uses van for materials
(8, 'Elegant Events Decor', 'decorator', 'Transform your venue into a magical wonderland. Specializing in romantic, rustic, and modern wedding themes.', 'Pasig City', 14.5764, 121.0851, 'Pasig', 'Metro Manila', 'van', '₱50,000 - ₱300,000', 700, 22, 15, 4.8, 178, 'verified', NOW(), '["https://images.unsplash.com/photo-1478146896981-b80fe463b330?w=800"]'),
-- Florist (user_id 9) - uses suv for flowers
(9, 'Bloom & Blossom Florals', 'florist', 'Fresh and preserved flower arrangements for your perfect day. From bridal bouquets to grand ceremony setups.', 'Mandaluyong', 14.5794, 121.0359, 'Mandaluyong', 'Metro Manila', 'suv', '₱15,000 - ₱100,000', 550, 16, 10, 4.9, 267, 'verified', NOW(), '["https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=800"]'),
-- Makeup (user_id 10) - uses car
(10, 'Glamour Studio MNL', 'makeup', 'Celebrity makeup artist team. We enhance your natural beauty for your most photographed day.', 'Ortigas, Pasig', 14.5873, 121.0615, 'Pasig', 'Metro Manila', 'car', '₱8,000 - ₱50,000', 400, 12, 10, 4.9, 523, 'verified', NOW(), '["https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800"]'),
-- DJ/Sounds & Lights (user_id 11) - uses van for heavy equipment
(11, 'Soundwave Entertainment', 'dj', 'Premium sound and lighting for unforgettable wedding receptions. Professional DJs and live band options available.', 'San Juan City', 14.6019, 121.0355, 'San Juan', 'Metro Manila', 'van', '₱20,000 - ₱80,000', 700, 22, 15, 4.7, 156, 'verified', NOW(), '["https://images.unsplash.com/photo-1571266028243-e4733b0f0bb0?w=800"]'),
-- Cake (user_id 12) - uses car
(12, 'Sweet Delights Bakery', 'cake', 'Custom wedding cakes and dessert tables. From classic elegance to modern minimalist designs.', 'Alabang, Muntinlupa', 14.4179, 121.0450, 'Muntinlupa', 'Metro Manila', 'car', '₱8,000 - ₱50,000', 400, 12, 10, 4.8, 289, 'verified', NOW(), '["https://images.unsplash.com/photo-1535254973040-607b474cb50d?w=800"]'),
-- Planner (user_id 13) - uses car
(13, 'Perfect Day Events', 'planner', 'Full-service wedding planning from concept to execution. We handle every detail so you can enjoy your special day.', 'Makati CBD', 14.5547, 121.0244, 'Makati', 'Metro Manila', 'car', '₱50,000 - ₱250,000', 400, 12, 10, 4.9, 145, 'verified', NOW(), '["https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800"]');

-- Insert coordinator profiles with vehicle type
INSERT INTO coordinators (user_id, business_name, description, location, latitude, longitude, city, province, vehicle_type, price_range, base_travel_fee, per_km_rate, free_km_radius, rating, review_count, verification_status, verified_at, weddings_completed, specialties, images) VALUES
(14, 'Dream Wedding Coordinators', 'Full-service wedding planning and coordination. We bring your dream wedding to life with meticulous attention to detail.', 'Makati, Metro Manila', 14.5547, 121.0244, 'Makati', 'Metro Manila', 'car', '₱50,000 - ₱300,000', 400, 12, 10, 4.8, 156, 'verified', NOW(), 89, '["Traditional Filipino", "Beach Weddings", "Garden Ceremonies", "Destination Weddings"]', '["https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800"]'),
(15, 'Elite Wedding PH', 'Luxury wedding planning for discerning couples. Specializing in high-end destination weddings across the Philippines.', 'BGC, Taguig', 14.5505, 121.0501, 'Taguig', 'Metro Manila', 'suv', '₱100,000 - ₱500,000', 550, 16, 15, 4.9, 98, 'verified', NOW(), 56, '["Luxury Weddings", "Destination Weddings", "International Clients", "Celebrity Weddings"]', '["https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800"]');

-- =====================================================
-- SEED DATA: Services with Pricing Breakdowns
-- =====================================================

-- Photography Services (vendor_id 1)
INSERT INTO services (vendor_id, name, description, category, pricing_items, base_total, add_ons, details, inclusions) VALUES
(1, 'Essential Photography Package', 'Perfect for intimate weddings. Capture all the key moments with our professional team.', 'photographer',
'[
  {"id": "p1", "description": "Photography Coverage", "quantity": 6, "unit": "hours", "rate": 5000, "total": 30000},
  {"id": "p2", "description": "Lead Photographer", "quantity": 1, "unit": "day", "rate": 10000, "total": 10000},
  {"id": "p3", "description": "Edited Digital Photos", "quantity": 200, "unit": "photos", "rate": 50, "total": 10000},
  {"id": "p4", "description": "Online Gallery (1 year)", "quantity": 1, "unit": "package", "rate": 5000, "total": 5000}
]',
55000,
'[
  {"id": "a1", "name": "Engagement Shoot (2 hours)", "price": 15000},
  {"id": "a2", "name": "Same-Day Edit Photos (20 pcs)", "price": 8000},
  {"id": "a3", "name": "Extra Hour Coverage", "price": 5000},
  {"id": "a4", "name": "Printed Album (20 pages)", "price": 12000}
]',
'{"coverage_hours": 6, "photographers_count": 1, "edited_photos": 200, "raw_files": false, "album_included": false}',
'["200 edited high-resolution photos", "Online gallery with download", "Pre-wedding consultation", "Printed 4R photos (20 pcs)", "USB drive delivery"]'
),
(1, 'Premium Photography Package', 'Comprehensive coverage for your complete wedding day. Two photographers ensure no moment is missed.', 'photographer',
'[
  {"id": "p1", "description": "Photography Coverage", "quantity": 10, "unit": "hours", "rate": 5000, "total": 50000},
  {"id": "p2", "description": "Lead Photographer", "quantity": 1, "unit": "day", "rate": 15000, "total": 15000},
  {"id": "p3", "description": "Second Photographer", "quantity": 1, "unit": "day", "rate": 10000, "total": 10000},
  {"id": "p4", "description": "Edited Digital Photos", "quantity": 400, "unit": "photos", "rate": 50, "total": 20000},
  {"id": "p5", "description": "Premium Album (30 pages)", "quantity": 1, "unit": "album", "rate": 15000, "total": 15000},
  {"id": "p6", "description": "Pre-wedding Shoot", "quantity": 1, "unit": "session", "rate": 15000, "total": 15000}
]',
125000,
'[
  {"id": "a1", "name": "Drone Aerial Shots", "price": 10000},
  {"id": "a2", "name": "Same-Day Edit Photos (30 pcs)", "price": 10000},
  {"id": "a3", "name": "Extra Hour Coverage", "price": 5000},
  {"id": "a4", "name": "Parent Albums (2 pcs)", "price": 16000},
  {"id": "a5", "name": "RAW Files USB", "price": 8000}
]',
'{"coverage_hours": 10, "photographers_count": 2, "edited_photos": 400, "raw_files": false, "album_included": true}',
'["400 edited high-resolution photos", "30-page premium photo album", "Pre-wedding engagement shoot", "Online gallery with lifetime access", "USB with all edited photos", "Same-day teaser (5 photos)"]'
);

-- Videography Services (vendor_id 2)
INSERT INTO services (vendor_id, name, description, category, pricing_items, base_total, add_ons, details, inclusions) VALUES
(2, 'Cinematic Wedding Film', 'A beautiful cinematic edit capturing the emotions and highlights of your wedding day.', 'videographer',
'[
  {"id": "v1", "description": "Video Coverage", "quantity": 10, "unit": "hours", "rate": 6000, "total": 60000},
  {"id": "v2", "description": "Lead Videographer", "quantity": 1, "unit": "day", "rate": 15000, "total": 15000},
  {"id": "v3", "description": "Highlight Film (5-7 min)", "quantity": 1, "unit": "video", "rate": 25000, "total": 25000},
  {"id": "v4", "description": "Full Ceremony Edit", "quantity": 1, "unit": "video", "rate": 15000, "total": 15000}
]',
115000,
'[
  {"id": "a1", "name": "Same-Day Edit Video (3 min)", "price": 25000},
  {"id": "a2", "name": "Drone Footage", "price": 15000},
  {"id": "a3", "name": "Second Videographer", "price": 10000},
  {"id": "a4", "name": "Full Reception Edit", "price": 20000}
]',
'{"coverage_hours": 10, "videographers_count": 1, "highlight_video": 6, "full_video": true, "drone_footage": false}',
'["5-7 minute cinematic highlight film", "Full ceremony video", "Background music licensing", "Online delivery via cloud", "1 revision round included"]'
);

-- Venue Services (vendor_id 3)
INSERT INTO services (vendor_id, name, description, category, pricing_items, base_total, add_ons, details, inclusions) VALUES
(3, 'Garden Pavilion Package', 'Beautiful outdoor garden ceremony with elegant indoor reception. Accommodates up to 150 guests.', 'venue',
'[
  {"id": "v1", "description": "Venue Rental (Garden + Hall)", "quantity": 8, "unit": "hours", "rate": 15000, "total": 120000},
  {"id": "v2", "description": "Tables & Chairs", "quantity": 150, "unit": "guests", "rate": 200, "total": 30000},
  {"id": "v3", "description": "Basic Lighting Package", "quantity": 1, "unit": "package", "rate": 15000, "total": 15000},
  {"id": "v4", "description": "Sound System", "quantity": 1, "unit": "package", "rate": 10000, "total": 10000},
  {"id": "v5", "description": "Bridal Room Access", "quantity": 1, "unit": "room", "rate": 5000, "total": 5000}
]',
180000,
'[
  {"id": "a1", "name": "Extra Hour", "price": 15000},
  {"id": "a2", "name": "Premium Lighting Upgrade", "price": 25000},
  {"id": "a3", "name": "Generator Backup", "price": 10000},
  {"id": "a4", "name": "Overnight Accommodation", "price": 8000}
]',
'{"capacity": 150, "hours_included": 8, "setup_included": true, "parking_capacity": 50, "catering_allowed": true}',
'["8 hours venue access", "Setup and teardown", "150 guest capacity", "Bridal room", "50-car parking", "Basic sound system", "Security personnel"]'
);

-- Catering Services (vendor_id 4)
INSERT INTO services (vendor_id, name, description, category, pricing_items, base_total, add_ons, details, inclusions) VALUES
(4, 'Premium Buffet Package', 'Deluxe 7-course Filipino-International buffet with premium selections and impeccable service.', 'caterer',
'[
  {"id": "c1", "description": "Food (7 courses)", "quantity": 100, "unit": "pax", "rate": 850, "total": 85000},
  {"id": "c2", "description": "Waitstaff", "quantity": 8, "unit": "staff", "rate": 1500, "total": 12000},
  {"id": "c3", "description": "Buffet Setup & Equipment", "quantity": 1, "unit": "package", "rate": 15000, "total": 15000},
  {"id": "c4", "description": "Drinks Package (Unlimited Iced Tea & Water)", "quantity": 100, "unit": "pax", "rate": 100, "total": 10000}
]',
122000,
'[
  {"id": "a1", "name": "Cocktail Hour (1 hour)", "price": 15000},
  {"id": "a2", "name": "Dessert Station", "price": 18000},
  {"id": "a3", "name": "Late Night Snacks", "price": 8000},
  {"id": "a4", "name": "Premium Drinks Package", "price": 20000}
]',
'{"minimum_pax": 100, "courses": 7, "buffet_style": true, "plated_service": false, "waitstaff_included": true}',
'["7-course premium buffet", "Food tasting for 4 persons", "Professional waitstaff", "Complete table setup", "Condiments and utensils", "Cleanup service"]'
);

-- Decorator Services (vendor_id 5)
INSERT INTO services (vendor_id, name, description, category, pricing_items, base_total, add_ons, details, inclusions) VALUES
(5, 'Romantic Garden Theme', 'Lush greenery with soft florals creating a romantic garden atmosphere for your celebration.', 'decorator',
'[
  {"id": "d1", "description": "Ceremony Backdrop", "quantity": 1, "unit": "setup", "rate": 25000, "total": 25000},
  {"id": "d2", "description": "Aisle Decorations", "quantity": 1, "unit": "setup", "rate": 15000, "total": 15000},
  {"id": "d3", "description": "Reception Centerpieces", "quantity": 15, "unit": "tables", "rate": 3000, "total": 45000},
  {"id": "d4", "description": "Uplighting Package", "quantity": 1, "unit": "package", "rate": 20000, "total": 20000},
  {"id": "d5", "description": "Setup & Teardown Team", "quantity": 1, "unit": "service", "rate": 10000, "total": 10000}
]',
115000,
'[
  {"id": "a1", "name": "Ceiling Draping", "price": 25000},
  {"id": "a2", "name": "Photo Booth Backdrop", "price": 12000},
  {"id": "a3", "name": "LED Dance Floor", "price": 30000}
]',
'{"setup_time": 4, "areas_covered": "Ceremony, Reception", "centerpieces_included": 15, "lighting_included": true}',
'["Full ceremony backdrop", "15 reception centerpieces", "Aisle decorations", "Uplighting", "Setup and teardown", "Free consultation"]'
);

-- Florist Services (vendor_id 6)
INSERT INTO services (vendor_id, name, description, category, pricing_items, base_total, add_ons, details, inclusions) VALUES
(6, 'Classic Elegance Package', 'Timeless white and blush arrangements featuring premium roses, peonies, and lush greenery.', 'florist',
'[
  {"id": "f1", "description": "Bridal Bouquet (Premium)", "quantity": 1, "unit": "pc", "rate": 8000, "total": 8000},
  {"id": "f2", "description": "Bridesmaid Bouquets", "quantity": 4, "unit": "pcs", "rate": 3500, "total": 14000},
  {"id": "f3", "description": "Groom Boutonniere", "quantity": 1, "unit": "pc", "rate": 800, "total": 800},
  {"id": "f4", "description": "Groomsmen Boutonnieres", "quantity": 4, "unit": "pcs", "rate": 600, "total": 2400},
  {"id": "f5", "description": "Ceremony Flowers", "quantity": 1, "unit": "package", "rate": 15000, "total": 15000},
  {"id": "f6", "description": "Centerpiece Arrangements", "quantity": 10, "unit": "pcs", "rate": 2500, "total": 25000}
]',
65200,
'[
  {"id": "a1", "name": "Flower Crown", "price": 3500},
  {"id": "a2", "name": "Petal Aisle", "price": 8000},
  {"id": "a3", "name": "Corsages (per pc)", "price": 500},
  {"id": "a4", "name": "Car Decoration", "price": 5000}
]',
'{"bouquets": 5, "boutonnieres": 5, "centerpieces": 10, "fresh_flowers": true}',
'["Premium bridal bouquet", "4 bridesmaid bouquets", "5 boutonnieres", "Ceremony flowers", "10 centerpieces", "Delivery and setup"]'
);

-- Makeup Services (vendor_id 7)
INSERT INTO services (vendor_id, name, description, category, pricing_items, base_total, add_ons, details, inclusions) VALUES
(7, 'Bridal Glam Package', 'Complete bridal beauty package with trial session and day-of services for the bride and entourage.', 'makeup',
'[
  {"id": "m1", "description": "Bridal Makeup & Hair", "quantity": 1, "unit": "session", "rate": 15000, "total": 15000},
  {"id": "m2", "description": "Bridal Trial Session", "quantity": 1, "unit": "session", "rate": 5000, "total": 5000},
  {"id": "m3", "description": "Entourage Makeup", "quantity": 4, "unit": "persons", "rate": 3500, "total": 14000},
  {"id": "m4", "description": "Touch-up Service (2 hours)", "quantity": 1, "unit": "service", "rate": 3000, "total": 3000}
]',
37000,
'[
  {"id": "a1", "name": "Extra Person", "price": 3500},
  {"id": "a2", "name": "Airbrush Upgrade", "price": 3000},
  {"id": "a3", "name": "Second Look", "price": 5000},
  {"id": "a4", "name": "Lash Extensions", "price": 2500}
]',
'{"persons_included": 5, "trial_included": true, "touch_up": true, "airbrush": false, "hair_styling": true}',
'["Bridal makeup and hair", "Trial session", "4 entourage makeup", "False lashes", "Touch-up kit", "2-hour standby"]'
);

-- DJ Services (vendor_id 8)
INSERT INTO services (vendor_id, name, description, category, pricing_items, base_total, add_ons, details, inclusions) VALUES
(8, 'Premium Sound Package', 'Complete audio and entertainment solution with professional DJ and quality sound system.', 'dj',
'[
  {"id": "d1", "description": "DJ Services", "quantity": 6, "unit": "hours", "rate": 5000, "total": 30000},
  {"id": "d2", "description": "Sound System (300 pax capacity)", "quantity": 1, "unit": "package", "rate": 15000, "total": 15000},
  {"id": "d3", "description": "Wireless Microphones", "quantity": 4, "unit": "units", "rate": 1000, "total": 4000},
  {"id": "d4", "description": "Basic Lighting", "quantity": 1, "unit": "package", "rate": 8000, "total": 8000}
]',
57000,
'[
  {"id": "a1", "name": "Extra Hour", "price": 5000},
  {"id": "a2", "name": "LED Wall (8x12 ft)", "price": 25000},
  {"id": "a3", "name": "Dancing Lights Upgrade", "price": 10000},
  {"id": "a4", "name": "Fog Machine", "price": 3000}
]',
'{"hours": 6, "equipment_included": true, "lighting": true, "mc_services": true}',
'["6-hour DJ service", "Professional sound system", "4 wireless microphones", "Basic party lights", "Song request coordination", "MC services included"]'
);

-- Cake Services (vendor_id 9)
INSERT INTO services (vendor_id, name, description, category, pricing_items, base_total, add_ons, details, inclusions) VALUES
(9, 'Elegant 3-Tier Wedding Cake', 'Custom-designed 3-tier fondant cake with intricate sugar flowers and personalized cake topper.', 'cake',
'[
  {"id": "c1", "description": "3-Tier Fondant Cake", "quantity": 100, "unit": "servings", "rate": 250, "total": 25000},
  {"id": "c2", "description": "Custom Design & Sugar Flowers", "quantity": 1, "unit": "design", "rate": 8000, "total": 8000},
  {"id": "c3", "description": "Delivery & Setup", "quantity": 1, "unit": "trip", "rate": 2000, "total": 2000}
]',
35000,
'[
  {"id": "a1", "name": "Additional Tier", "price": 8000},
  {"id": "a2", "name": "Dessert Table", "price": 15000},
  {"id": "a3", "name": "Cupcake Tower (50 pcs)", "price": 8000},
  {"id": "a4", "name": "Custom Cake Topper", "price": 2500}
]',
'{"servings": 100, "tiers": 3, "fondant": true, "custom_design": true}',
'["100-serving 3-tier cake", "Fondant finish", "Sugar flower decorations", "Cake stand rental", "Delivery and setup", "1 tasting session"]'
);

-- Wedding Planner Services (vendor_id 10)
INSERT INTO services (vendor_id, name, description, category, pricing_items, base_total, add_ons, details, inclusions) VALUES
(10, 'Full Planning Package', 'Comprehensive wedding planning from engagement to honeymoon. We handle every detail.', 'planner',
'[
  {"id": "p1", "description": "Full Planning Services", "quantity": 1, "unit": "package", "rate": 80000, "total": 80000},
  {"id": "p2", "description": "Day-of Coordination", "quantity": 1, "unit": "event", "rate": 25000, "total": 25000},
  {"id": "p3", "description": "Planning Meetings (10 sessions)", "quantity": 10, "unit": "sessions", "rate": 2000, "total": 20000},
  {"id": "p4", "description": "Day-of Assistants", "quantity": 2, "unit": "persons", "rate": 5000, "total": 10000}
]',
135000,
'[
  {"id": "a1", "name": "Rehearsal Coordination", "price": 10000},
  {"id": "a2", "name": "Extra Day Assistant", "price": 5000},
  {"id": "a3", "name": "Bridal Shower Planning", "price": 15000},
  {"id": "a4", "name": "Post-Wedding Brunch", "price": 8000}
]',
'{"planning_type": "Full Planning", "meetings_included": 10, "vendor_coordination": true, "timeline_creation": true, "assistants": 2}',
'["Complete vendor sourcing", "Budget management", "Timeline creation", "Day-of coordination", "2 day-of assistants", "Emergency kit", "10 planning meetings"]'
);

-- Sample vendor categories (for reference in app)
-- photographer, videographer, caterer, venue, decorator, florist, makeup, dj, planner, cake

-- =====================================================
-- CAVITE STANDARD TRAVEL PRICING MATRIX (for reference)
-- =====================================================
-- Travel fees are auto-computed based on vehicle type:
--
-- | Vehicle Type | Base Fee (₱) | Per KM Rate (₱) | Typical Use Case                    |
-- |--------------|--------------|-----------------|-------------------------------------|
-- | motorcycle   | 150          | 7               | Light equipment, solo photographer  |
-- | car          | 400          | 12              | Standard equipment, 1-2 crew        |
-- | suv          | 550          | 16              | Medium equipment, 2-4 crew          |
-- | van (L300)   | 700          | 22              | Full setup, sounds & lights, 4+ crew|
-- | truck (Elf)  | 1000         | 35              | Heavy equipment, staging, catering  |
--
-- Formula: Travel Fee = Base Fee + (max(0, Distance - Free Radius) × Per KM Rate)
--
-- Category to Vehicle Mapping (defaults):
-- - photographer: motorcycle, car, suv
-- - videographer: car, suv, van
-- - caterer: van, truck
-- - decorator: suv, van, truck
-- - florist: car, suv
-- - makeup/hair: motorcycle, car
-- - dj/sounds: van, truck
-- - cake: car
-- - planner: motorcycle, car
-- - venue: N/A (no travel)

-- =====================================================
-- MIGRATION: For existing databases, run these ALTER statements
-- =====================================================
-- ALTER TABLE vendors ADD COLUMN vehicle_type ENUM('motorcycle', 'car', 'suv', 'van', 'truck') DEFAULT 'car' AFTER postal_code;
-- ALTER TABLE vendors MODIFY COLUMN free_km_radius INT DEFAULT 10;
-- ALTER TABLE coordinators ADD COLUMN vehicle_type ENUM('motorcycle', 'car', 'suv', 'van', 'truck') DEFAULT 'car' AFTER postal_code;
-- ALTER TABLE coordinators MODIFY COLUMN free_km_radius INT DEFAULT 10;

-- =====================================================
-- ADMIN SYSTEM TABLES
-- =====================================================

-- Categories table (dynamic category management)
CREATE TABLE categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    icon VARCHAR(100),
    image VARCHAR(255),
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_slug (slug),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Subcategories table
CREATE TABLE subcategories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    description TEXT,
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
    UNIQUE KEY unique_category_slug (category_id, slug),
    INDEX idx_category (category_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Activity Logs table (tracks all user activities)
CREATE TABLE activity_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id INT,
    description TEXT,
    metadata JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user (user_id),
    INDEX idx_action (action),
    INDEX idx_entity (entity_type, entity_id),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Login Attempts table (security tracking)
CREATE TABLE login_attempts (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Location Logs table (tracks user geolocation)
CREATE TABLE location_logs (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Complaints table
CREATE TABLE complaints (
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
    INDEX idx_complainant (complainant_id),
    INDEX idx_reported (reported_type, reported_id),
    INDEX idx_status (status),
    INDEX idx_priority (priority),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Support Tickets table (Help Center / Problem Chat)
CREATE TABLE support_tickets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ticket_number VARCHAR(20) NOT NULL UNIQUE,
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
    INDEX idx_ticket (ticket_number),
    INDEX idx_user (user_id),
    INDEX idx_status (status),
    INDEX idx_priority (priority)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Support Ticket Replies (conversation thread)
CREATE TABLE ticket_replies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ticket_id INT NOT NULL,
    user_id INT NOT NULL,
    message TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ticket_id) REFERENCES support_tickets(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_ticket (ticket_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Help Articles (FAQ / Knowledge Base)
CREATE TABLE help_articles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    content TEXT NOT NULL,
    tags JSON,
    view_count INT DEFAULT 0,
    helpful_count INT DEFAULT 0,
    not_helpful_count INT DEFAULT 0,
    is_published BOOLEAN DEFAULT TRUE,
    author_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_category (category),
    INDEX idx_slug (slug),
    INDEX idx_published (is_published)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Password Reset Requests
CREATE TABLE password_reset_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token VARCHAR(255) NOT NULL,
    status ENUM('pending', 'used', 'expired') DEFAULT 'pending',
    ip_address VARCHAR(45),
    user_agent TEXT,
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_token (token),
    INDEX idx_user (user_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- OTP Verifications (Email & Phone)
CREATE TABLE otp_verifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    type ENUM('email', 'phone') NOT NULL,
    target VARCHAR(255) NOT NULL,
    otp_code VARCHAR(10) NOT NULL,
    status ENUM('pending', 'verified', 'expired', 'failed') DEFAULT 'pending',
    attempts INT DEFAULT 0,
    max_attempts INT DEFAULT 3,
    ip_address VARCHAR(45),
    expires_at TIMESTAMP NOT NULL,
    verified_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_type (type),
    INDEX idx_target (target),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User Sessions (for managing active sessions)
CREATE TABLE user_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    session_token VARCHAR(255) NOT NULL UNIQUE,
    device_info JSON,
    ip_address VARCHAR(45),
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_token (session_token),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Account Lockouts (security)
CREATE TABLE account_lockouts (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- ADMIN SEED DATA: Categories
-- =====================================================

INSERT INTO categories (name, slug, description, icon, sort_order) VALUES
('Photography', 'photography', 'Professional wedding photography services', 'camera', 1),
('Videography', 'videography', 'Wedding films and video coverage', 'video', 2),
('Venues', 'venues', 'Wedding venues and reception halls', 'building', 3),
('Catering', 'catering', 'Food and beverage services', 'utensils', 4),
('Decorations', 'decorations', 'Venue styling and decorations', 'palette', 5),
('Florists', 'florists', 'Floral arrangements and bouquets', 'flower', 6),
('Hair & Makeup', 'hair-makeup', 'Bridal makeup and hair styling', 'sparkles', 7),
('Music & Entertainment', 'music-entertainment', 'DJs, bands, and entertainment', 'music', 8),
('Cakes & Desserts', 'cakes-desserts', 'Wedding cakes and sweet treats', 'cake', 9),
('Wedding Planners', 'wedding-planners', 'Full-service wedding planning', 'clipboard', 10),
('Bridal Wear', 'bridal-wear', 'Wedding gowns and suits', 'shirt', 11),
('Sounds & Lights', 'sounds-lights', 'Audio and lighting equipment', 'speaker', 12),
('Invitations', 'invitations', 'Wedding invitations and stationery', 'mail', 13),
('Transportation', 'transportation', 'Bridal cars and guest transport', 'car', 14);

-- Sample subcategories
INSERT INTO subcategories (category_id, name, slug, sort_order) VALUES
(1, 'Traditional Photography', 'traditional', 1),
(1, 'Photojournalistic', 'photojournalistic', 2),
(1, 'Drone Photography', 'drone', 3),
(2, 'Cinematic Films', 'cinematic', 1),
(2, 'Documentary Style', 'documentary', 2),
(2, 'Same-Day Edit', 'same-day-edit', 3),
(3, 'Indoor Venues', 'indoor', 1),
(3, 'Garden/Outdoor', 'garden-outdoor', 2),
(3, 'Beach Venues', 'beach', 3),
(3, 'Church/Chapel', 'church-chapel', 4),
(4, 'Filipino Cuisine', 'filipino', 1),
(4, 'International', 'international', 2),
(4, 'Buffet Style', 'buffet', 3),
(4, 'Plated Service', 'plated', 4);

-- Sample Help Articles
INSERT INTO help_articles (category, title, slug, content, tags, author_id) VALUES
('Getting Started', 'How to create an account', 'how-to-create-account', 
'<h2>Creating Your Wedding Bazaar Account</h2><p>Follow these simple steps to get started...</p><ol><li>Click the Sign Up button</li><li>Enter your email and create a password</li><li>Verify your email address</li><li>Complete your profile</li></ol>', 
'["account", "signup", "getting started"]', 1),
('Booking', 'How to book a vendor', 'how-to-book-vendor',
'<h2>Booking Your Wedding Vendors</h2><p>Once you find the perfect vendor, follow these steps to make a booking...</p>',
'["booking", "vendors", "reservations"]', 1),
('Payments', 'Payment methods and security', 'payment-methods-security',
'<h2>Safe and Secure Payments</h2><p>Wedding Bazaar uses PayMongo for secure payment processing...</p>',
'["payment", "security", "paymongo"]', 1),
('Verification', 'How to verify your business', 'how-to-verify-business',
'<h2>Business Verification Process</h2><p>Get verified to build trust with customers. Required documents include...</p>',
'["verification", "documents", "vendors"]', 1);
