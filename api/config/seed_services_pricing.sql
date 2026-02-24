-- Wedding Bazaar Services Seed with Full Pricing Structure
-- Run this to update services with proper pricing_items, details, inclusions, and add_ons

-- Note: This script updates existing services OR inserts new ones
-- Run AFTER the main seed.sql

-- Photography Services - Maria Santos Photography
UPDATE services 
SET 
    category = 'photography',
    pricing_items = JSON_ARRAY(
        JSON_OBJECT('id', 'p1', 'description', 'Photography Coverage', 'quantity', 10, 'unit', 'hours', 'rate', 5000, 'total', 50000),
        JSON_OBJECT('id', 'p2', 'description', 'Lead Photographer', 'quantity', 1, 'unit', 'day', 'rate', 20000, 'total', 20000),
        JSON_OBJECT('id', 'p3', 'description', 'Second Photographer', 'quantity', 1, 'unit', 'day', 'rate', 15000, 'total', 15000),
        JSON_OBJECT('id', 'p4', 'description', 'Photo Album (40 pages)', 'quantity', 1, 'unit', 'album', 'rate', 20000, 'total', 20000),
        JSON_OBJECT('id', 'p5', 'description', 'Photo Editing', 'quantity', 500, 'unit', 'photos', 'rate', 30, 'total', 15000)
    ),
    base_total = 120000,
    add_ons = JSON_ARRAY(
        JSON_OBJECT('id', 'a1', 'name', 'Engagement Shoot (3 hours)', 'price', 18000),
        JSON_OBJECT('id', 'a2', 'name', 'Drone Aerial Shots', 'price', 12000),
        JSON_OBJECT('id', 'a3', 'name', 'Same-Day Edit Photos (50 prints)', 'price', 10000),
        JSON_OBJECT('id', 'a4', 'name', 'Extra Hour Coverage', 'price', 5000),
        JSON_OBJECT('id', 'a5', 'name', 'RAW Files USB Drive', 'price', 5000)
    ),
    details = JSON_OBJECT(
        'coverage_hours', 10,
        'photographers_count', 2,
        'edited_photos', 500,
        'raw_files', true,
        'album_included', true
    ),
    inclusions = JSON_ARRAY(
        '500+ edited high-resolution photos',
        'Online gallery with download access',
        '40-page premium photo album',
        'Pre-wedding consultation',
        'USB drive with all edited photos',
        'RAW files included',
        '2 outfit changes',
        'Unlimited poses and locations'
    ),
    max_bookings_per_day = 1
WHERE name = 'Premium Wedding Package' 
AND vendor_id = (SELECT id FROM vendors WHERE business_name = 'Maria Santos Photography');

UPDATE services 
SET 
    category = 'photography',
    pricing_items = JSON_ARRAY(
        JSON_OBJECT('id', 'p1', 'description', 'Photography Coverage', 'quantity', 8, 'unit', 'hours', 'rate', 5000, 'total', 40000),
        JSON_OBJECT('id', 'p2', 'description', 'Lead Photographer', 'quantity', 1, 'unit', 'day', 'rate', 20000, 'total', 20000),
        JSON_OBJECT('id', 'p3', 'description', 'Photo Editing', 'quantity', 300, 'unit', 'photos', 'rate', 50, 'total', 15000)
    ),
    base_total = 75000,
    add_ons = JSON_ARRAY(
        JSON_OBJECT('id', 'a1', 'name', 'Prenup Shoot', 'price', 15000),
        JSON_OBJECT('id', 'a2', 'name', 'Additional Hour', 'price', 5000),
        JSON_OBJECT('id', 'a3', 'name', 'Rush Editing (1 week)', 'price', 8000)
    ),
    details = JSON_OBJECT(
        'coverage_hours', 8,
        'photographers_count', 1,
        'edited_photos', 300,
        'raw_files', false,
        'album_included', false
    ),
    inclusions = JSON_ARRAY(
        '300+ edited photos',
        'Online gallery access',
        'Pre-wedding consultation',
        'USB drive with photos'
    ),
    max_bookings_per_day = 2
WHERE name = 'Standard Wedding Package' 
AND vendor_id = (SELECT id FROM vendors WHERE business_name = 'Maria Santos Photography');

-- Venue Services - Garden Paradise Tagaytay
UPDATE services 
SET 
    category = 'venue',
    pricing_items = JSON_ARRAY(
        JSON_OBJECT('id', 'v1', 'description', 'Venue Rental (Garden Ceremony)', 'quantity', 6, 'unit', 'hours', 'rate', 20000, 'total', 120000),
        JSON_OBJECT('id', 'v2', 'description', 'Chairs Setup', 'quantity', 150, 'unit', 'guests', 'rate', 200, 'total', 30000),
        JSON_OBJECT('id', 'v3', 'description', 'Basic Floral Arch', 'quantity', 1, 'unit', 'setup', 'rate', 25000, 'total', 25000),
        JSON_OBJECT('id', 'v4', 'description', 'Sound System', 'quantity', 1, 'unit', 'package', 'rate', 15000, 'total', 15000),
        JSON_OBJECT('id', 'v5', 'description', 'Venue Coordinator', 'quantity', 1, 'unit', 'day', 'rate', 10000, 'total', 10000)
    ),
    base_total = 200000,
    add_ons = JSON_ARRAY(
        JSON_OBJECT('id', 'a1', 'name', 'Extra Hour', 'price', 15000),
        JSON_OBJECT('id', 'a2', 'name', 'Bridal Suite (overnight)', 'price', 12000),
        JSON_OBJECT('id', 'a3', 'name', 'Generator Backup', 'price', 10000),
        JSON_OBJECT('id', 'a4', 'name', 'Valet Parking (50 cars)', 'price', 8000),
        JSON_OBJECT('id', 'a5', 'name', 'Fireworks Display', 'price', 35000)
    ),
    details = JSON_OBJECT(
        'capacity', 150,
        'hours_included', 6,
        'setup_included', true,
        'parking_capacity', 80,
        'catering_allowed', true
    ),
    inclusions = JSON_ARRAY(
        'Garden ceremony area',
        'Chairs for 150 guests',
        'Basic floral arch decoration',
        'Sound system with wireless mics',
        'Dedicated venue coordinator',
        'Parking for 80 vehicles',
        'Restroom facilities',
        'Setup and teardown included'
    ),
    max_bookings_per_day = 1
WHERE name = 'Garden Ceremony Package' 
AND vendor_id = (SELECT id FROM vendors WHERE business_name = 'Garden Paradise Tagaytay');

UPDATE services 
SET 
    category = 'venue',
    pricing_items = JSON_ARRAY(
        JSON_OBJECT('id', 'v1', 'description', 'Full Day Venue Rental', 'quantity', 12, 'unit', 'hours', 'rate', 15000, 'total', 180000),
        JSON_OBJECT('id', 'v2', 'description', 'Tables & Chairs', 'quantity', 200, 'unit', 'guests', 'rate', 250, 'total', 50000),
        JSON_OBJECT('id', 'v3', 'description', 'Premium Styling Package', 'quantity', 1, 'unit', 'package', 'rate', 40000, 'total', 40000),
        JSON_OBJECT('id', 'v4', 'description', 'Coordination Team', 'quantity', 3, 'unit', 'staff', 'rate', 10000, 'total', 30000)
    ),
    base_total = 300000,
    add_ons = JSON_ARRAY(
        JSON_OBJECT('id', 'a1', 'name', 'Overnight Stay (2 rooms)', 'price', 25000),
        JSON_OBJECT('id', 'a2', 'name', 'LED Wall (10x6 ft)', 'price', 20000),
        JSON_OBJECT('id', 'a3', 'name', 'Additional 50 Guests Setup', 'price', 15000)
    ),
    details = JSON_OBJECT(
        'capacity', 200,
        'hours_included', 12,
        'setup_included', true,
        'parking_capacity', 100,
        'catering_allowed', true
    ),
    inclusions = JSON_ARRAY(
        'Ceremony + Reception areas',
        'Tables and chairs for 200',
        'Premium venue styling',
        '3-person coordination team',
        'Full day access (12 hours)',
        'Bridal suite access',
        'Parking for 100 cars',
        'Basic lighting package'
    ),
    max_bookings_per_day = 1
WHERE name = 'Full Day Garden Wedding' 
AND vendor_id = (SELECT id FROM vendors WHERE business_name = 'Garden Paradise Tagaytay');

-- Catering Services - Fiesta Catering
UPDATE services 
SET 
    category = 'catering',
    pricing_items = JSON_ARRAY(
        JSON_OBJECT('id', 'c1', 'description', 'Filipino Feast Menu', 'quantity', 100, 'unit', 'pax', 'rate', 1000, 'total', 100000),
        JSON_OBJECT('id', 'c2', 'description', 'Lechon (whole)', 'quantity', 2, 'unit', 'pcs', 'rate', 8000, 'total', 16000),
        JSON_OBJECT('id', 'c3', 'description', 'Waitstaff', 'quantity', 8, 'unit', 'staff', 'rate', 500, 'total', 4000)
    ),
    base_total = 120000,
    add_ons = JSON_ARRAY(
        JSON_OBJECT('id', 'a1', 'name', 'Additional Guest (per pax)', 'price', 1000),
        JSON_OBJECT('id', 'a2', 'name', 'Extra Lechon', 'price', 8000),
        JSON_OBJECT('id', 'a3', 'name', 'Dessert Station', 'price', 15000),
        JSON_OBJECT('id', 'a4', 'name', 'Cocktail Hour', 'price', 12000)
    ),
    details = JSON_OBJECT(
        'minimum_pax', 50,
        'courses', 7,
        'buffet_style', true,
        'plated_service', false,
        'waitstaff_included', true
    ),
    inclusions = JSON_ARRAY(
        '7-course Filipino menu',
        '2 whole lechon included',
        '8 professional waitstaff',
        'Table setup and linens',
        'Serving utensils',
        'Food tasting for 4 persons',
        'Complete cleanup after event'
    ),
    max_bookings_per_day = 2
WHERE name = 'Filipino Feast' 
AND vendor_id = (SELECT id FROM vendors WHERE business_name = 'Fiesta Catering Services');

-- Makeup Services - Glam Squad Manila
UPDATE services 
SET 
    category = 'hair & makeup',
    pricing_items = JSON_ARRAY(
        JSON_OBJECT('id', 'm1', 'description', 'Bridal Makeup & Hair', 'quantity', 1, 'unit', 'session', 'rate', 15000, 'total', 15000),
        JSON_OBJECT('id', 'm2', 'description', 'Trial Session', 'quantity', 1, 'unit', 'session', 'rate', 5000, 'total', 5000),
        JSON_OBJECT('id', 'm3', 'description', 'Touch-up Service', 'quantity', 4, 'unit', 'hours', 'rate', 1500, 'total', 6000),
        JSON_OBJECT('id', 'm4', 'description', 'Touch-up Kit', 'quantity', 1, 'unit', 'kit', 'rate', 4000, 'total', 4000),
        JSON_OBJECT('id', 'm5', 'description', 'Premium Lashes', 'quantity', 2, 'unit', 'pairs', 'rate', 2500, 'total', 5000)
    ),
    base_total = 35000,
    add_ons = JSON_ARRAY(
        JSON_OBJECT('id', 'a1', 'name', 'Second Look Change', 'price', 5000),
        JSON_OBJECT('id', 'a2', 'name', 'Airbrush Upgrade', 'price', 3000),
        JSON_OBJECT('id', 'a3', 'name', 'Hair Extensions', 'price', 6000),
        JSON_OBJECT('id', 'a4', 'name', 'Extra Trial Session', 'price', 4000)
    ),
    details = JSON_OBJECT(
        'persons_included', 1,
        'trial_included', true,
        'touch_up', true,
        'airbrush', false,
        'hair_styling', true
    ),
    inclusions = JSON_ARRAY(
        'Bridal makeup application',
        'Bridal hair styling',
        'Trial session (1 week before)',
        '4-hour touch-up service',
        'Premium false lashes (2 pairs)',
        'Touch-up kit to keep',
        'Setting spray application'
    ),
    max_bookings_per_day = 2
WHERE name = 'Bridal Glam Package' 
AND vendor_id = (SELECT id FROM vendors WHERE business_name = 'Glam Squad Manila');

UPDATE services 
SET 
    category = 'hair & makeup',
    pricing_items = JSON_ARRAY(
        JSON_OBJECT('id', 'm1', 'description', 'Bride Makeup & Hair', 'quantity', 1, 'unit', 'person', 'rate', 15000, 'total', 15000),
        JSON_OBJECT('id', 'm2', 'description', 'Bridesmaids (6 pax)', 'quantity', 6, 'unit', 'persons', 'rate', 4000, 'total', 24000),
        JSON_OBJECT('id', 'm3', 'description', 'Mothers (2 pax)', 'quantity', 2, 'unit', 'persons', 'rate', 5000, 'total', 10000),
        JSON_OBJECT('id', 'm4', 'description', 'Trial Sessions', 'quantity', 2, 'unit', 'sessions', 'rate', 4000, 'total', 8000),
        JSON_OBJECT('id', 'm5', 'description', 'Touch-up Service', 'quantity', 6, 'unit', 'hours', 'rate', 1500, 'total', 8000)
    ),
    base_total = 65000,
    add_ons = JSON_ARRAY(
        JSON_OBJECT('id', 'a1', 'name', 'Additional Entourage Member', 'price', 3500),
        JSON_OBJECT('id', 'a2', 'name', 'Flower Girl', 'price', 2000),
        JSON_OBJECT('id', 'a3', 'name', 'Extra Stylist (faster prep)', 'price', 8000)
    ),
    details = JSON_OBJECT(
        'persons_included', 9,
        'trial_included', true,
        'touch_up', true,
        'airbrush', false,
        'hair_styling', true
    ),
    inclusions = JSON_ARRAY(
        'Bride makeup & hair styling',
        '6 bridesmaids makeup & hair',
        '2 mothers makeup & hair',
        '2 trial sessions',
        '6-hour touch-up service',
        'Premium lashes for all',
        '3 makeup artists team'
    ),
    max_bookings_per_day = 1
WHERE name = 'Complete Entourage' 
AND vendor_id = (SELECT id FROM vendors WHERE business_name = 'Glam Squad Manila');

-- Music Services - DJ Beats Entertainment
UPDATE services 
SET 
    category = 'music & entertainment',
    pricing_items = JSON_ARRAY(
        JSON_OBJECT('id', 'd1', 'description', 'DJ Services', 'quantity', 6, 'unit', 'hours', 'rate', 4000, 'total', 24000),
        JSON_OBJECT('id', 'd2', 'description', 'Sound System', 'quantity', 1, 'unit', 'package', 'rate', 12000, 'total', 12000),
        JSON_OBJECT('id', 'd3', 'description', 'Basic Lighting', 'quantity', 1, 'unit', 'package', 'rate', 6000, 'total', 6000),
        JSON_OBJECT('id', 'd4', 'description', 'Setup & Teardown', 'quantity', 1, 'unit', 'service', 'rate', 3000, 'total', 3000)
    ),
    base_total = 45000,
    add_ons = JSON_ARRAY(
        JSON_OBJECT('id', 'a1', 'name', 'Extra Hour', 'price', 4000),
        JSON_OBJECT('id', 'a2', 'name', 'Fog Machine', 'price', 2500),
        JSON_OBJECT('id', 'a3', 'name', 'Uplighting (10 units)', 'price', 8000),
        JSON_OBJECT('id', 'a4', 'name', 'Sparkler Machine', 'price', 5000)
    ),
    details = JSON_OBJECT(
        'hours', 6,
        'equipment_included', true,
        'lighting', true,
        'mc_services', true
    ),
    inclusions = JSON_ARRAY(
        'Professional DJ',
        '6 hours of music',
        'Premium sound system (1000W)',
        'Basic LED lighting',
        '2 wireless microphones',
        'MC services',
        'Song request management',
        'Setup and teardown'
    ),
    max_bookings_per_day = 2
WHERE name = 'Complete DJ Package' 
AND vendor_id = (SELECT id FROM vendors WHERE business_name = 'DJ Beats Entertainment');

UPDATE services 
SET 
    category = 'music & entertainment',
    pricing_items = JSON_ARRAY(
        JSON_OBJECT('id', 'd1', 'description', 'DJ Services', 'quantity', 8, 'unit', 'hours', 'rate', 4500, 'total', 36000),
        JSON_OBJECT('id', 'd2', 'description', 'Premium Sound System', 'quantity', 1, 'unit', 'package', 'rate', 18000, 'total', 18000),
        JSON_OBJECT('id', 'd3', 'description', 'Intelligent Lighting', 'quantity', 1, 'unit', 'package', 'rate', 12000, 'total', 12000),
        JSON_OBJECT('id', 'd4', 'description', 'LED Wall (8x4 ft)', 'quantity', 1, 'unit', 'unit', 'rate', 9000, 'total', 9000)
    ),
    base_total = 75000,
    add_ons = JSON_ARRAY(
        JSON_OBJECT('id', 'a1', 'name', 'Extra Hour', 'price', 5000),
        JSON_OBJECT('id', 'a2', 'name', 'Cold Sparks', 'price', 8000),
        JSON_OBJECT('id', 'a3', 'name', 'Confetti Cannon', 'price', 3500),
        JSON_OBJECT('id', 'a4', 'name', 'CO2 Jets', 'price', 6000)
    ),
    details = JSON_OBJECT(
        'hours', 8,
        'equipment_included', true,
        'lighting', true,
        'mc_services', true
    ),
    inclusions = JSON_ARRAY(
        'Premium DJ',
        '8 hours of music',
        'Premium sound system (2000W)',
        'Intelligent moving lights',
        'LED video wall (8x4 ft)',
        '4 wireless microphones',
        'Professional MC',
        'Fog machine included',
        'Full setup and teardown'
    ),
    max_bookings_per_day = 1
WHERE name = 'Premium Package' 
AND vendor_id = (SELECT id FROM vendors WHERE business_name = 'DJ Beats Entertainment');

-- Videography Services - Cinematic Dreams PH
UPDATE services 
SET 
    category = 'videography',
    pricing_items = JSON_ARRAY(
        JSON_OBJECT('id', 'v1', 'description', 'Video Coverage', 'quantity', 10, 'unit', 'hours', 'rate', 8000, 'total', 80000),
        JSON_OBJECT('id', 'v2', 'description', 'Lead Videographer', 'quantity', 1, 'unit', 'day', 'rate', 25000, 'total', 25000),
        JSON_OBJECT('id', 'v3', 'description', 'Second Videographer', 'quantity', 1, 'unit', 'day', 'rate', 18000, 'total', 18000),
        JSON_OBJECT('id', 'v4', 'description', 'Highlight Film (5 min)', 'quantity', 1, 'unit', 'video', 'rate', 15000, 'total', 15000),
        JSON_OBJECT('id', 'v5', 'description', 'Full Edit', 'quantity', 1, 'unit', 'video', 'rate', 12000, 'total', 12000)
    ),
    base_total = 150000,
    add_ons = JSON_ARRAY(
        JSON_OBJECT('id', 'a1', 'name', 'Same-Day Edit', 'price', 30000),
        JSON_OBJECT('id', 'a2', 'name', 'Drone Footage', 'price', 15000),
        JSON_OBJECT('id', 'a3', 'name', 'Extended Highlight (10 min)', 'price', 10000),
        JSON_OBJECT('id', 'a4', 'name', 'RAW Footage', 'price', 8000)
    ),
    details = JSON_OBJECT(
        'coverage_hours', 10,
        'videographers_count', 2,
        'highlight_video', 5,
        'full_video', true,
        'drone_footage', false
    ),
    inclusions = JSON_ARRAY(
        '10-hour full coverage',
        '2-person video team',
        '5-minute cinematic highlight',
        'Full ceremony video',
        'Full reception video',
        'Licensed music',
        'Color grading',
        'USB drive delivery'
    ),
    max_bookings_per_day = 1
WHERE name = 'Cinematic Package' 
AND vendor_id = (SELECT id FROM vendors WHERE business_name = 'Cinematic Dreams PH');

-- Coordinator Services - Ana Reyes Events
UPDATE services 
SET 
    category = 'wedding planner',
    pricing_items = JSON_ARRAY(
        JSON_OBJECT('id', 'c1', 'description', 'Full Planning Service', 'quantity', 12, 'unit', 'months', 'rate', 12000, 'total', 144000),
        JSON_OBJECT('id', 'c2', 'description', 'Day-of Coordination Team', 'quantity', 3, 'unit', 'staff', 'rate', 12000, 'total', 36000),
        JSON_OBJECT('id', 'c3', 'description', 'Planning Meetings', 'quantity', 8, 'unit', 'sessions', 'rate', 2500, 'total', 20000)
    ),
    base_total = 200000,
    add_ons = JSON_ARRAY(
        JSON_OBJECT('id', 'a1', 'name', 'Rehearsal Dinner Coordination', 'price', 15000),
        JSON_OBJECT('id', 'a2', 'name', 'Post-Wedding Brunch', 'price', 12000),
        JSON_OBJECT('id', 'a3', 'name', 'Honeymoon Planning', 'price', 8000),
        JSON_OBJECT('id', 'a4', 'name', 'Additional Assistant', 'price', 8000)
    ),
    details = JSON_OBJECT(
        'planning_type', 'Full Planning',
        'meetings_included', 8,
        'vendor_coordination', true,
        'timeline_creation', true,
        'assistants', 3
    ),
    inclusions = JSON_ARRAY(
        '12 months of planning',
        '8 planning meetings',
        'Vendor sourcing & negotiations',
        'Budget management',
        'Timeline creation',
        '3-person day-of team',
        'Vendor coordination',
        'Emergency handling',
        'Guest list management'
    ),
    max_bookings_per_day = 1
WHERE name = 'Full Planning Package' 
AND vendor_id = (SELECT id FROM vendors WHERE business_name = 'Ana Reyes Events');

UPDATE services 
SET 
    category = 'wedding planner',
    pricing_items = JSON_ARRAY(
        JSON_OBJECT('id', 'c1', 'description', 'Day-of Coordination', 'quantity', 1, 'unit', 'event', 'rate', 50000, 'total', 50000),
        JSON_OBJECT('id', 'c2', 'description', 'Coordination Team', 'quantity', 2, 'unit', 'staff', 'rate', 10000, 'total', 20000),
        JSON_OBJECT('id', 'c3', 'description', 'Pre-Wedding Meeting', 'quantity', 2, 'unit', 'sessions', 'rate', 5000, 'total', 10000)
    ),
    base_total = 80000,
    add_ons = JSON_ARRAY(
        JSON_OBJECT('id', 'a1', 'name', 'Extra Coordinator', 'price', 8000),
        JSON_OBJECT('id', 'a2', 'name', 'Rehearsal Coordination', 'price', 10000)
    ),
    details = JSON_OBJECT(
        'planning_type', 'Day-of Coordination',
        'meetings_included', 2,
        'vendor_coordination', true,
        'timeline_creation', true,
        'assistants', 2
    ),
    inclusions = JSON_ARRAY(
        '2 pre-wedding meetings',
        'Timeline finalization',
        'Vendor coordination on the day',
        '2-person coordination team',
        'Emergency kit',
        'Full day presence (12 hours)'
    ),
    max_bookings_per_day = 2
WHERE name = 'Day-of Coordination' 
AND vendor_id = (SELECT id FROM vendors WHERE business_name = 'Ana Reyes Events');

-- Florist Services - Bloom & Petals Studio
UPDATE services 
SET 
    category = 'florist',
    pricing_items = JSON_ARRAY(
        JSON_OBJECT('id', 'f1', 'description', 'Bridal Bouquet (Premium)', 'quantity', 1, 'unit', 'pc', 'rate', 8000, 'total', 8000),
        JSON_OBJECT('id', 'f2', 'description', 'Bridesmaid Bouquets', 'quantity', 5, 'unit', 'pcs', 'rate', 3500, 'total', 17500),
        JSON_OBJECT('id', 'f3', 'description', 'Groom Boutonniere', 'quantity', 1, 'unit', 'pc', 'rate', 1200, 'total', 1200),
        JSON_OBJECT('id', 'f4', 'description', 'Groomsmen Boutonnieres', 'quantity', 5, 'unit', 'pcs', 'rate', 800, 'total', 4000),
        JSON_OBJECT('id', 'f5', 'description', 'Centerpieces', 'quantity', 20, 'unit', 'pcs', 'rate', 2500, 'total', 50000),
        JSON_OBJECT('id', 'f6', 'description', 'Altar Arrangement', 'quantity', 1, 'unit', 'setup', 'rate', 35000, 'total', 35000),
        JSON_OBJECT('id', 'f7', 'description', 'Flower Arch', 'quantity', 1, 'unit', 'setup', 'rate', 25000, 'total', 25000),
        JSON_OBJECT('id', 'f8', 'description', 'Setup & Delivery', 'quantity', 1, 'unit', 'service', 'rate', 9300, 'total', 9300)
    ),
    base_total = 150000,
    add_ons = JSON_ARRAY(
        JSON_OBJECT('id', 'a1', 'name', 'Flower Crown', 'price', 3500),
        JSON_OBJECT('id', 'a2', 'name', 'Petal Aisle', 'price', 10000),
        JSON_OBJECT('id', 'a3', 'name', 'Corsages (per pc)', 'price', 1500),
        JSON_OBJECT('id', 'a4', 'name', 'Additional Centerpiece', 'price', 2500),
        JSON_OBJECT('id', 'a5', 'name', 'Premium Rose Upgrade', 'price', 8000)
    ),
    details = JSON_OBJECT(
        'bouquets', 6,
        'boutonnieres', 6,
        'centerpieces', 20,
        'fresh_flowers', true
    ),
    inclusions = JSON_ARRAY(
        'Premium bridal bouquet',
        '5 bridesmaid bouquets',
        '6 boutonnieres',
        '20 table centerpieces',
        'Altar flower arrangement',
        'Ceremony flower arch',
        'Fresh flowers only',
        'Delivery and setup',
        'Consultation included'
    ),
    max_bookings_per_day = 1
WHERE name = 'Complete Floral Package' 
AND vendor_id = (SELECT id FROM vendors WHERE business_name = 'Bloom & Petals Studio');

SELECT 'Services updated with full pricing structure!' as status;
