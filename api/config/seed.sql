-- Wedding Bazaar Seed Data
-- Run this after schema.sql to populate with sample data

USE wedding_bazaar;

-- Clear existing data
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE services;
TRUNCATE TABLE vendors;
TRUNCATE TABLE users;
SET FOREIGN_KEY_CHECKS = 1;

-- Insert sample users (password is 'password123' for all)
-- Password hash for 'password123': $2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi
INSERT INTO users (email, password, name, role, phone) VALUES
-- Coordinators
('coordinator1@weddingbazaar.ph', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Ana Reyes Events', 'coordinator', '+639171234567'),
('coordinator2@weddingbazaar.ph', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Belle Santos Weddings', 'coordinator', '+639182345678'),
('coordinator3@weddingbazaar.ph', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Carlo Mendoza Planning', 'coordinator', '+639193456789'),
('coordinator4@weddingbazaar.ph', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Divine Celebrations', 'coordinator', '+639204567890'),
('coordinator5@weddingbazaar.ph', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Elegant Affairs PH', 'coordinator', '+639215678901'),

-- Vendors (Photographers)
('photo1@weddingbazaar.ph', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Maria Santos Photography', 'vendor', '+639226789012'),
('photo2@weddingbazaar.ph', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Juan Dela Cruz Studios', 'vendor', '+639237890123'),
('photo3@weddingbazaar.ph', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Capture Moments PH', 'vendor', '+639248901234'),

-- Vendors (Venues)
('venue1@weddingbazaar.ph', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Grand Ballroom Manila', 'vendor', '+639259012345'),
('venue2@weddingbazaar.ph', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Garden Paradise Tagaytay', 'vendor', '+639260123456'),
('venue3@weddingbazaar.ph', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Seaside Resort Batangas', 'vendor', '+639271234567'),

-- Vendors (Catering)
('catering1@weddingbazaar.ph', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Fiesta Catering Services', 'vendor', '+639282345678'),
('catering2@weddingbazaar.ph', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Gourmet Kitchen PH', 'vendor', '+639293456789'),

-- Vendors (Florists)
('florist1@weddingbazaar.ph', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Bloom & Petals Studio', 'vendor', '+639304567890'),
('florist2@weddingbazaar.ph', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Rose Garden Floristry', 'vendor', '+639315678901'),

-- Vendors (Music/Entertainment)
('music1@weddingbazaar.ph', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Harmony Band Manila', 'vendor', '+639326789012'),
('music2@weddingbazaar.ph', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'DJ Beats Entertainment', 'vendor', '+639337890123'),

-- Vendors (Makeup/Hair)
('makeup1@weddingbazaar.ph', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Glam Squad Manila', 'vendor', '+639348901234'),
('makeup2@weddingbazaar.ph', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Bridal Beauty Studio', 'vendor', '+639359012345'),

-- Vendors (Videography)
('video1@weddingbazaar.ph', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Cinematic Dreams PH', 'vendor', '+639360123456'),

-- Vendors (Decorations)
('decor1@weddingbazaar.ph', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Enchanted Designs', 'vendor', '+639371234567'),

-- Sample couple user
('mj.santos2026@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Juan Miguel & Maria Clara Santos', 'individual', '+639381234567');

-- Insert vendors profile data
INSERT INTO vendors (user_id, business_name, category, description, location, price_range, rating, review_count, is_verified, is_active) VALUES
-- Photographers
((SELECT id FROM users WHERE email = 'photo1@weddingbazaar.ph'), 'Maria Santos Photography', 'photography', 'Award-winning wedding photographer with 10 years of experience capturing love stories. Specializing in candid moments, traditional portraits, and destination weddings.', 'Manila, Metro Manila', '₱50,000 - ₱150,000', 4.9, 128, TRUE, TRUE),
((SELECT id FROM users WHERE email = 'photo2@weddingbazaar.ph'), 'Juan Dela Cruz Studios', 'photography', 'Professional photography studio offering wedding, prenup, and event coverage. Known for artistic and timeless photos.', 'Quezon City, Metro Manila', '₱35,000 - ₱100,000', 4.7, 85, TRUE, TRUE),
((SELECT id FROM users WHERE email = 'photo3@weddingbazaar.ph'), 'Capture Moments PH', 'photography', 'Modern wedding photography with a focus on storytelling and emotion. Drone coverage available.', 'Makati, Metro Manila', '₱40,000 - ₱120,000', 4.8, 92, TRUE, TRUE),

-- Venues
((SELECT id FROM users WHERE email = 'venue1@weddingbazaar.ph'), 'Grand Ballroom Manila', 'venue', 'Elegant 500-capacity ballroom perfect for grand celebrations. Features crystal chandeliers, marble floors, and state-of-the-art sound system.', 'Makati, Metro Manila', '₱200,000 - ₱500,000', 4.8, 156, TRUE, TRUE),
((SELECT id FROM users WHERE email = 'venue2@weddingbazaar.ph'), 'Garden Paradise Tagaytay', 'venue', 'Breathtaking outdoor garden venue with panoramic views of Taal Lake. Perfect for intimate ceremonies up to 200 guests.', 'Tagaytay, Cavite', '₱150,000 - ₱350,000', 4.9, 203, TRUE, TRUE),
((SELECT id FROM users WHERE email = 'venue3@weddingbazaar.ph'), 'Seaside Resort Batangas', 'venue', 'Beachfront wedding venue with private beach access. Ideal for beach weddings and destination celebrations.', 'Batangas City, Batangas', '₱180,000 - ₱400,000', 4.7, 98, TRUE, TRUE),

-- Catering
((SELECT id FROM users WHERE email = 'catering1@weddingbazaar.ph'), 'Fiesta Catering Services', 'catering', 'Full-service catering company specializing in Filipino and international cuisine. From intimate gatherings to grand receptions.', 'Pasig, Metro Manila', '₱800 - ₱2,500 per head', 4.6, 245, TRUE, TRUE),
((SELECT id FROM users WHERE email = 'catering2@weddingbazaar.ph'), 'Gourmet Kitchen PH', 'catering', 'Premium catering service featuring chef-curated menus. Known for exceptional presentation and taste.', 'Taguig, Metro Manila', '₱1,500 - ₱4,000 per head', 4.8, 167, TRUE, TRUE),

-- Florists
((SELECT id FROM users WHERE email = 'florist1@weddingbazaar.ph'), 'Bloom & Petals Studio', 'florist', 'Creative floral design studio specializing in wedding bouquets, centerpieces, and venue decoration. Fresh and preserved flowers available.', 'Quezon City, Metro Manila', '₱30,000 - ₱200,000', 4.9, 187, TRUE, TRUE),
((SELECT id FROM users WHERE email = 'florist2@weddingbazaar.ph'), 'Rose Garden Floristry', 'florist', 'Traditional and modern floral arrangements for weddings. Specializing in roses, peonies, and imported blooms.', 'Mandaluyong, Metro Manila', '₱25,000 - ₱150,000', 4.7, 134, TRUE, TRUE),

-- Music/Entertainment
((SELECT id FROM users WHERE email = 'music1@weddingbazaar.ph'), 'Harmony Band Manila', 'music', 'Professional wedding band performing live music from classic to contemporary. 6-piece band with male and female vocalists.', 'Manila, Metro Manila', '₱50,000 - ₱120,000', 4.8, 89, TRUE, TRUE),
((SELECT id FROM users WHERE email = 'music2@weddingbazaar.ph'), 'DJ Beats Entertainment', 'music', 'Wedding DJ and sound system provider. State-of-the-art equipment with lighting packages available.', 'Paranaque, Metro Manila', '₱25,000 - ₱80,000', 4.6, 156, TRUE, TRUE),

-- Makeup/Hair
((SELECT id FROM users WHERE email = 'makeup1@weddingbazaar.ph'), 'Glam Squad Manila', 'makeup', 'Celebrity makeup artist team specializing in bridal looks. Airbrush makeup and hair styling services.', 'Makati, Metro Manila', '₱15,000 - ₱50,000', 4.9, 278, TRUE, TRUE),
((SELECT id FROM users WHERE email = 'makeup2@weddingbazaar.ph'), 'Bridal Beauty Studio', 'makeup', 'Professional bridal makeup and styling services. Traditional and modern looks with package deals for entourage.', 'Quezon City, Metro Manila', '₱12,000 - ₱35,000', 4.7, 198, TRUE, TRUE),

-- Videography
((SELECT id FROM users WHERE email = 'video1@weddingbazaar.ph'), 'Cinematic Dreams PH', 'videography', 'Cinematic wedding film production creating emotional and artistic wedding videos. Same-day edit and highlight reels.', 'Manila, Metro Manila', '₱60,000 - ₱200,000', 4.8, 112, TRUE, TRUE),

-- Decorations
((SELECT id FROM users WHERE email = 'decor1@weddingbazaar.ph'), 'Enchanted Designs', 'decoration', 'Full event styling and decoration services. From minimalist to grand themes, we bring your vision to life.', 'Pasay, Metro Manila', '₱80,000 - ₱500,000', 4.7, 145, TRUE, TRUE);

-- Insert services for vendors
INSERT INTO services (vendor_id, name, description, price, duration, is_active) VALUES
-- Photography services
((SELECT id FROM vendors WHERE business_name = 'Maria Santos Photography'), 'Premium Wedding Package', 'Full day coverage, 2 photographers, 500+ edited photos, album, prenup shoot', 120000.00, 'Full Day', TRUE),
((SELECT id FROM vendors WHERE business_name = 'Maria Santos Photography'), 'Standard Wedding Package', '8-hour coverage, 1 photographer, 300+ edited photos, online gallery', 75000.00, '8 Hours', TRUE),
((SELECT id FROM vendors WHERE business_name = 'Maria Santos Photography'), 'Prenuptial Shoot', '3-hour outdoor/studio shoot, 50+ edited photos, outfit changes', 25000.00, '3 Hours', TRUE),

((SELECT id FROM vendors WHERE business_name = 'Juan Dela Cruz Studios'), 'Complete Package', 'Full day, 2 photographers, unlimited shots, album, same-day edit photos', 85000.00, 'Full Day', TRUE),
((SELECT id FROM vendors WHERE business_name = 'Juan Dela Cruz Studios'), 'Basic Package', '6-hour coverage, 200+ photos, online gallery', 45000.00, '6 Hours', TRUE),

-- Venue services
((SELECT id FROM vendors WHERE business_name = 'Grand Ballroom Manila'), 'Grand Wedding Package', 'Ballroom rental, tables/chairs for 300, basic styling, 8-hour use', 350000.00, '8 Hours', TRUE),
((SELECT id FROM vendors WHERE business_name = 'Grand Ballroom Manila'), 'Intimate Package', 'Private function room for 100, basic setup, 6-hour use', 150000.00, '6 Hours', TRUE),

((SELECT id FROM vendors WHERE business_name = 'Garden Paradise Tagaytay'), 'Garden Ceremony Package', 'Outdoor ceremony area, chairs for 150, basic floral arch', 200000.00, '6 Hours', TRUE),
((SELECT id FROM vendors WHERE business_name = 'Garden Paradise Tagaytay'), 'Full Day Garden Wedding', 'Ceremony + reception area, 200 pax, basic coordination', 300000.00, 'Full Day', TRUE),

-- Catering services
((SELECT id FROM vendors WHERE business_name = 'Fiesta Catering Services'), 'Filipino Feast', 'Traditional Filipino menu, 7 courses, lechon included', 1200.00, 'Per Person', TRUE),
((SELECT id FROM vendors WHERE business_name = 'Fiesta Catering Services'), 'International Buffet', 'Mixed cuisine, 10 courses, carving station', 1800.00, 'Per Person', TRUE),

((SELECT id FROM vendors WHERE business_name = 'Gourmet Kitchen PH'), 'Premium Plated Dinner', '5-course plated meal, premium ingredients', 2500.00, 'Per Person', TRUE),
((SELECT id FROM vendors WHERE business_name = 'Gourmet Kitchen PH'), 'Cocktail Reception', 'Passed hors d''oeuvres, 3 stations, 4 hours', 1500.00, 'Per Person', TRUE),

-- Florist services
((SELECT id FROM vendors WHERE business_name = 'Bloom & Petals Studio'), 'Complete Floral Package', 'Bridal bouquet, groom boutonniere, centerpieces for 20 tables, altar arrangement', 150000.00, 'Package', TRUE),
((SELECT id FROM vendors WHERE business_name = 'Bloom & Petals Studio'), 'Bridal Only Package', 'Bridal bouquet, bridesmaid bouquets (5), groom & groomsmen boutonnieres', 45000.00, 'Package', TRUE),

-- Music services
((SELECT id FROM vendors WHERE business_name = 'Harmony Band Manila'), 'Full Reception Package', '4-hour performance, 3 sets, ceremony music included', 85000.00, '4 Hours', TRUE),
((SELECT id FROM vendors WHERE business_name = 'Harmony Band Manila'), 'Ceremony Only', 'Live music for ceremony, 1 hour', 25000.00, '1 Hour', TRUE),

((SELECT id FROM vendors WHERE business_name = 'DJ Beats Entertainment'), 'Complete DJ Package', 'DJ services, sound system, basic lighting, 6 hours', 45000.00, '6 Hours', TRUE),
((SELECT id FROM vendors WHERE business_name = 'DJ Beats Entertainment'), 'Premium Package', 'DJ, premium sound, intelligent lighting, LED wall, 8 hours', 75000.00, '8 Hours', TRUE),

-- Makeup services
((SELECT id FROM vendors WHERE business_name = 'Glam Squad Manila'), 'Bridal Glam Package', 'Bride makeup & hair, trial session, touch-up kit', 35000.00, 'Package', TRUE),
((SELECT id FROM vendors WHERE business_name = 'Glam Squad Manila'), 'Complete Entourage', 'Bride + 6 bridesmaids + 2 mothers makeup & hair', 65000.00, 'Package', TRUE),

-- Videography services
((SELECT id FROM vendors WHERE business_name = 'Cinematic Dreams PH'), 'Cinematic Package', 'Full day, 2 videographers, highlight film, full ceremony & reception', 150000.00, 'Full Day', TRUE),
((SELECT id FROM vendors WHERE business_name = 'Cinematic Dreams PH'), 'Same Day Edit', 'Additional same-day edit video for reception showing', 35000.00, 'Add-on', TRUE),

-- Decoration services
((SELECT id FROM vendors WHERE business_name = 'Enchanted Designs'), 'Full Venue Styling', 'Complete venue decoration, ceremony & reception, theme design', 250000.00, 'Package', TRUE),
((SELECT id FROM vendors WHERE business_name = 'Enchanted Designs'), 'Reception Only', 'Reception area styling, centerpieces, backdrop, entrance', 150000.00, 'Package', TRUE);

-- Insert coordinators as vendors too (for dedicated coordinator table would be better, but using vendors for now)
INSERT INTO vendors (user_id, business_name, category, description, location, price_range, rating, review_count, is_verified, is_active) VALUES
((SELECT id FROM users WHERE email = 'coordinator1@weddingbazaar.ph'), 'Ana Reyes Events', 'coordinator', 'Full-service wedding coordination with 15 years of experience. From intimate ceremonies to grand celebrations, we handle every detail.', 'Manila, Metro Manila', '₱80,000 - ₱250,000', 4.9, 156, TRUE, TRUE),
((SELECT id FROM users WHERE email = 'coordinator2@weddingbazaar.ph'), 'Belle Santos Weddings', 'coordinator', 'Boutique wedding planning studio specializing in destination weddings and luxury celebrations. International experience.', 'Makati, Metro Manila', '₱150,000 - ₱500,000', 4.8, 89, TRUE, TRUE),
((SELECT id FROM users WHERE email = 'coordinator3@weddingbazaar.ph'), 'Carlo Mendoza Planning', 'coordinator', 'Modern wedding planner with a focus on unique, personalized celebrations. Known for creative concepts and flawless execution.', 'Quezon City, Metro Manila', '₱60,000 - ₱200,000', 4.7, 112, TRUE, TRUE),
((SELECT id FROM users WHERE email = 'coordinator4@weddingbazaar.ph'), 'Divine Celebrations', 'coordinator', 'Faith-based wedding coordination specializing in church weddings and traditional Filipino ceremonies.', 'Pasig, Metro Manila', '₱50,000 - ₱150,000', 4.8, 178, TRUE, TRUE),
((SELECT id FROM users WHERE email = 'coordinator5@weddingbazaar.ph'), 'Elegant Affairs PH', 'coordinator', 'High-end wedding planning with attention to every detail. Celebrity weddings and featured in top bridal magazines.', 'Taguig, Metro Manila', '₱200,000 - ₱800,000', 4.9, 67, TRUE, TRUE);

-- Insert coordinator services
INSERT INTO services (vendor_id, name, description, price, duration, is_active) VALUES
((SELECT id FROM vendors WHERE business_name = 'Ana Reyes Events'), 'Full Planning Package', 'Complete wedding planning from engagement to honeymoon. Vendor sourcing, budget management, timeline creation, day-of coordination.', 200000.00, '12 Months', TRUE),
((SELECT id FROM vendors WHERE business_name = 'Ana Reyes Events'), 'Day-of Coordination', 'Wedding day management, vendor coordination, timeline execution, emergency handling.', 80000.00, '1 Day', TRUE),
((SELECT id FROM vendors WHERE business_name = 'Ana Reyes Events'), 'Partial Planning', 'Vendor recommendations, contract review, 3 planning meetings, day-of coordination.', 120000.00, '6 Months', TRUE),

((SELECT id FROM vendors WHERE business_name = 'Belle Santos Weddings'), 'Luxury Planning', 'White-glove service, unlimited consultations, premium vendor network, destination management.', 400000.00, '18 Months', TRUE),
((SELECT id FROM vendors WHERE business_name = 'Belle Santos Weddings'), 'Destination Wedding', 'Complete destination wedding planning, travel coordination, local vendor sourcing.', 350000.00, '12 Months', TRUE),

((SELECT id FROM vendors WHERE business_name = 'Carlo Mendoza Planning'), 'Creative Concept Package', 'Unique theme development, full planning, styled shoot, day-of coordination.', 180000.00, '12 Months', TRUE),
((SELECT id FROM vendors WHERE business_name = 'Carlo Mendoza Planning'), 'Essential Planning', 'Budget-conscious planning, curated vendor list, timeline, day-of coordination.', 80000.00, '6 Months', TRUE),

((SELECT id FROM vendors WHERE business_name = 'Divine Celebrations'), 'Church Wedding Package', 'Church coordination, full planning, religious ceremony assistance.', 130000.00, '10 Months', TRUE),
((SELECT id FROM vendors WHERE business_name = 'Divine Celebrations'), 'Traditional Filipino Wedding', 'Complete traditional ceremony planning including sponsors coordination.', 100000.00, '8 Months', TRUE),

((SELECT id FROM vendors WHERE business_name = 'Elegant Affairs PH'), 'Elite Wedding Experience', 'Ultimate luxury planning, exclusive venues, celebrity vendors, media management.', 700000.00, '24 Months', TRUE),
((SELECT id FROM vendors WHERE business_name = 'Elegant Affairs PH'), 'Signature Planning', 'High-end planning with premium vendor access and personalized service.', 350000.00, '12 Months', TRUE);

SELECT 'Seed data inserted successfully!' as status;
