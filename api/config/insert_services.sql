-- Realistic Services Data for Wedding Bazaar
-- Insert services with proper Filipino wedding industry pricing

-- Maria Santos Photography (vendor_id 1) - Photography
INSERT INTO services (vendor_id, name, description, category, pricing_items, base_total, add_ons, details, inclusions, is_active) VALUES
(1, 'Intimate Wedding Package', 'Perfect for intimate ceremonies up to 50 guests. 6 hours of premium coverage capturing every heartfelt moment.', 'photography',
'[{"id":"p1","description":"Photography Coverage","quantity":6,"unit":"hours","rate":5000,"total":30000},{"id":"p2","description":"Lead Photographer","quantity":1,"unit":"day","rate":15000,"total":15000},{"id":"p3","description":"Edited Digital Photos","quantity":150,"unit":"photos","rate":50,"total":7500}]',
52500,
'[{"id":"a1","name":"Drone Aerial Coverage","price":8000},{"id":"a2","name":"Same-Day Edit (10 photos)","price":10000},{"id":"a3","name":"Extra Hour","price":5000}]',
'{"coverage_hours":6,"photographers":1,"edited_photos":150}',
'["150 edited high-resolution photos","Online gallery with download","USB drive delivery","Pre-wedding consultation","Printed 4R photos (20pcs)"]', 1);

INSERT INTO services (vendor_id, name, description, category, pricing_items, base_total, add_ons, details, inclusions, is_active) VALUES
(1, 'Premium Wedding Package', 'Our signature package with full-day coverage by two photographers. Includes prenuptial shoot and premium layflat album.', 'photography',
'[{"id":"p1","description":"Full Day Coverage","quantity":10,"unit":"hours","rate":5000,"total":50000},{"id":"p2","description":"Lead Photographer","quantity":1,"unit":"day","rate":20000,"total":20000},{"id":"p3","description":"Second Shooter","quantity":1,"unit":"day","rate":12000,"total":12000},{"id":"p4","description":"Premium Layflat Album (40 pages)","quantity":1,"unit":"album","rate":18000,"total":18000}]',
100000,
'[{"id":"a1","name":"Prenuptial Shoot","price":15000},{"id":"a2","name":"Parent Albums (2pcs)","price":12000},{"id":"a3","name":"Drone Coverage","price":10000}]',
'{"coverage_hours":10,"photographers":2,"edited_photos":400}',
'["400+ edited high-resolution photos","40-page premium layflat album","Online gallery with lifetime access","USB with all edited + RAW files","Same-day teaser (5 photos)"]', 1);

-- Juan Dela Cruz Studios (vendor_id 2) - Photography
INSERT INTO services (vendor_id, name, description, category, pricing_items, base_total, add_ons, details, inclusions, is_active) VALUES
(2, 'Classic Wedding Coverage', 'Traditional documentation of your wedding day with artistic flair. Perfect for modern couples who appreciate timeless photography.', 'photography',
'[{"id":"p1","description":"Photography Coverage","quantity":8,"unit":"hours","rate":4500,"total":36000},{"id":"p2","description":"Professional Photographer","quantity":1,"unit":"day","rate":12000,"total":12000},{"id":"p3","description":"Edited Photos","quantity":200,"unit":"photos","rate":45,"total":9000}]',
57000,
'[{"id":"a1","name":"Engagement Session","price":12000},{"id":"a2","name":"Photo Booth Setup","price":8000}]',
'{"coverage_hours":8,"photographers":1,"edited_photos":200}',
'["200 professionally edited photos","Online gallery access","High-res digital copies","Pre-wedding consultation"]', 1);

-- Grand Ballroom Manila (vendor_id 4) - Venue
INSERT INTO services (vendor_id, name, description, category, pricing_items, base_total, add_ons, details, inclusions, is_active) VALUES
(4, 'Crystal Ballroom Package', 'Elegant indoor venue perfect for grand celebrations. Crystal chandeliers, marble floors, and exceptional service for up to 300 guests.', 'venue',
'[{"id":"v1","description":"Venue Rental (8 hours)","quantity":8,"unit":"hours","rate":20000,"total":160000},{"id":"v2","description":"Tables & Chairs (300 pax)","quantity":300,"unit":"guests","rate":150,"total":45000},{"id":"v3","description":"Basic Sound System","quantity":1,"unit":"package","rate":15000,"total":15000},{"id":"v4","description":"Bridal Suite Access","quantity":1,"unit":"room","rate":10000,"total":10000}]',
230000,
'[{"id":"a1","name":"Extra Hour","price":20000},{"id":"a2","name":"Premium Lighting Package","price":35000},{"id":"a3","name":"Red Carpet Setup","price":8000}]',
'{"capacity":300,"hours_included":8,"parking_slots":100}',
'["8-hour venue access","Tables and chairs for 300","Basic sound system","Bridal suite","100-car parking","Security personnel","Cleanup service"]', 1);

-- Garden Paradise Tagaytay (vendor_id 5) - Venue
INSERT INTO services (vendor_id, name, description, category, pricing_items, base_total, add_ons, details, inclusions, is_active) VALUES
(5, 'Garden Ceremony Package', 'Breathtaking outdoor garden ceremony with panoramic Taal Lake views. Perfect for romantic intimate weddings up to 150 guests.', 'venue',
'[{"id":"v1","description":"Garden Venue Rental","quantity":6,"unit":"hours","rate":18000,"total":108000},{"id":"v2","description":"Garden Chairs & Setup","quantity":150,"unit":"guests","rate":200,"total":30000},{"id":"v3","description":"Ceremony Arch","quantity":1,"unit":"setup","rate":15000,"total":15000}]',
153000,
'[{"id":"a1","name":"Overnight Accommodation","price":12000},{"id":"a2","name":"Sunset Cocktails","price":18000}]',
'{"capacity":150,"hours_included":6,"outdoor":true}',
'["6-hour garden access","Garden chairs and setup","Ceremony arch","Bridal cottage access","Scenic photo spots","Event coordinator"]', 1);

-- Fiesta Catering Services (vendor_id 7) - Catering
INSERT INTO services (vendor_id, name, description, category, pricing_items, base_total, add_ons, details, inclusions, is_active) VALUES
(7, 'Filipino Feast Buffet', 'Authentic Filipino wedding feast featuring heirloom recipes and premium local ingredients. Minimum 100 guests.', 'catering',
'[{"id":"c1","description":"Food (7 Courses)","quantity":100,"unit":"pax","rate":750,"total":75000},{"id":"c2","description":"Professional Waitstaff","quantity":8,"unit":"staff","rate":1500,"total":12000},{"id":"c3","description":"Complete Buffet Setup","quantity":1,"unit":"package","rate":18000,"total":18000},{"id":"c4","description":"Unlimited Drinks","quantity":100,"unit":"pax","rate":80,"total":8000}]',
113000,
'[{"id":"a1","name":"Lechon (50kg)","price":15000},{"id":"a2","name":"Dessert Station","price":12000},{"id":"a3","name":"Midnight Snacks","price":8000}]',
'{"minimum_pax":100,"courses":7,"waitstaff":8}',
'["7-course premium Filipino buffet","Food tasting for 6 persons","Professional waitstaff","Complete table setup","Unlimited iced tea and water","Cleanup service"]', 1);

-- Gourmet Kitchen PH (vendor_id 8) - Catering
INSERT INTO services (vendor_id, name, description, category, pricing_items, base_total, add_ons, details, inclusions, is_active) VALUES
(8, 'International Fusion Buffet', 'World-class international cuisine with Filipino favorites. Chef-crafted dishes using premium imported ingredients.', 'catering',
'[{"id":"c1","description":"Premium Buffet","quantity":100,"unit":"pax","rate":950,"total":95000},{"id":"c2","description":"Executive Chef Team","quantity":1,"unit":"team","rate":20000,"total":20000},{"id":"c3","description":"Premium Setup & Service","quantity":1,"unit":"package","rate":25000,"total":25000}]',
140000,
'[{"id":"a1","name":"Live Cooking Station","price":18000},{"id":"a2","name":"Wine Pairing","price":25000}]',
'{"minimum_pax":100,"courses":9,"premium":true}',
'["9-course international buffet","Executive chef team","Premium table setup","Waitstaff in formal attire","Wine glasses and premium utensils"]', 1);

-- Bloom & Petals Studio (vendor_id 9) - Florist
INSERT INTO services (vendor_id, name, description, category, pricing_items, base_total, add_ons, details, inclusions, is_active) VALUES
(9, 'Classic Romance Package', 'Timeless elegance with premium roses, peonies, and lush greenery. Complete floral package for ceremony and reception.', 'florist',
'[{"id":"f1","description":"Bridal Bouquet (Premium)","quantity":1,"unit":"piece","rate":8500,"total":8500},{"id":"f2","description":"Bridesmaid Bouquets","quantity":4,"unit":"pieces","rate":3000,"total":12000},{"id":"f3","description":"Boutonnieres","quantity":6,"unit":"pieces","rate":600,"total":3600},{"id":"f4","description":"Table Centerpieces","quantity":12,"unit":"pieces","rate":2500,"total":30000},{"id":"f5","description":"Ceremony Setup","quantity":1,"unit":"package","rate":18000,"total":18000}]',
72100,
'[{"id":"a1","name":"Flower Crown","price":3500},{"id":"a2","name":"Petals for Aisle","price":6000},{"id":"a3","name":"Car Decoration","price":5000}]',
'{"bouquets":5,"centerpieces":12,"ceremony_setup":true}',
'["Premium bridal bouquet","4 bridesmaid bouquets","6 boutonnieres","12 reception centerpieces","Ceremony floral setup","Delivery and installation"]', 1);

-- Harmony Band Manila (vendor_id 11) - Music
INSERT INTO services (vendor_id, name, description, category, pricing_items, base_total, add_ons, details, inclusions, is_active) VALUES
(11, 'Live Band Performance', 'Experience live music by our 6-piece band. From romantic ballads to upbeat party hits, we set the perfect mood.', 'music',
'[{"id":"m1","description":"6-Piece Band","quantity":4,"unit":"hours","rate":12000,"total":48000},{"id":"m2","description":"Professional Sound System","quantity":1,"unit":"set","rate":20000,"total":20000},{"id":"m3","description":"Stage Lighting","quantity":1,"unit":"package","rate":12000,"total":12000}]',
80000,
'[{"id":"a1","name":"Extra Hour","price":12000},{"id":"a2","name":"String Quartet (Ceremony)","price":25000}]',
'{"band_members":6,"hours":4,"sound_system":true}',
'["4-hour live band performance","Professional sound system","Stage lighting","Song request coordination","2 wireless microphones"]', 1);

-- DJ Beats Entertainment (vendor_id 12) - Music/DJ
INSERT INTO services (vendor_id, name, description, category, pricing_items, base_total, add_ons, details, inclusions, is_active) VALUES
(12, 'Premium DJ Package', 'High-energy entertainment with state-of-the-art sound and lighting. Our DJs know how to keep the party going!', 'music',
'[{"id":"d1","description":"Professional DJ","quantity":5,"unit":"hours","rate":5000,"total":25000},{"id":"d2","description":"Sound System (300 pax)","quantity":1,"unit":"set","rate":18000,"total":18000},{"id":"d3","description":"Party Lights & Effects","quantity":1,"unit":"package","rate":15000,"total":15000},{"id":"d4","description":"Wireless Microphones","quantity":4,"unit":"units","rate":800,"total":3200}]',
61200,
'[{"id":"a1","name":"LED Wall (8x10ft)","price":25000},{"id":"a2","name":"Fog Machine","price":3000},{"id":"a3","name":"Extra Hour","price":5000}]',
'{"hours":5,"equipment_included":true}',
'["5-hour professional DJ service","High-quality sound system","Party lights and effects","4 wireless microphones","Song request coordination"]', 1);

-- Glam Squad Manila (vendor_id 13) - Makeup
INSERT INTO services (vendor_id, name, description, category, pricing_items, base_total, add_ons, details, inclusions, is_active) VALUES
(13, 'Bridal Glam Package', 'Complete bridal beauty transformation by celebrity makeup artists. Includes trial session and day-of services for bride and entourage.', 'makeup',
'[{"id":"m1","description":"Bridal Makeup & Hair","quantity":1,"unit":"session","rate":18000,"total":18000},{"id":"m2","description":"Bridal Trial Session","quantity":1,"unit":"session","rate":5000,"total":5000},{"id":"m3","description":"Entourage Makeup & Hair","quantity":4,"unit":"persons","rate":4000,"total":16000},{"id":"m4","description":"Touch-up Service","quantity":3,"unit":"hours","rate":2000,"total":6000}]',
45000,
'[{"id":"a1","name":"Airbrush Makeup Upgrade","price":3000},{"id":"a2","name":"Lash Extensions","price":2500},{"id":"a3","name":"Extra Person","price":4000}]',
'{"persons_included":5,"trial":true,"touch_up_hours":3}',
'["Bridal makeup and hairstyling","Trial session included","4 entourage makeup & hair","3-hour touch-up service","False lashes included","Touch-up kit"]', 1);

-- Cinematic Dreams PH (vendor_id 15) - Videography
INSERT INTO services (vendor_id, name, description, category, pricing_items, base_total, add_ons, details, inclusions, is_active) VALUES
(15, 'Cinematic Wedding Film', 'Award-winning cinematic storytelling that captures the emotion and beauty of your love story. Full-day coverage with highlight film.', 'videography',
'[{"id":"v1","description":"Video Coverage","quantity":10,"unit":"hours","rate":6000,"total":60000},{"id":"v2","description":"Lead Videographer","quantity":1,"unit":"day","rate":18000,"total":18000},{"id":"v3","description":"Cinematic Highlight Film","quantity":1,"unit":"video","rate":30000,"total":30000},{"id":"v4","description":"Full Ceremony Edit","quantity":1,"unit":"video","rate":15000,"total":15000}]',
123000,
'[{"id":"a1","name":"Same-Day Edit Video","price":30000},{"id":"a2","name":"Drone Footage","price":15000},{"id":"a3","name":"Second Videographer","price":12000}]',
'{"coverage_hours":10,"videographers":1,"highlight_minutes":5}',
'["10-hour video coverage","5-7 minute cinematic highlight","Full ceremony video","Licensed background music","Online delivery","1 revision round"]', 1);

-- Enchanted Designs (vendor_id 16) - Decoration
INSERT INTO services (vendor_id, name, description, category, pricing_items, base_total, add_ons, details, inclusions, is_active) VALUES
(16, 'Enchanted Garden Theme', 'Transform your venue into a magical garden paradise with lush greenery, fairy lights, and romantic florals.', 'decoration',
'[{"id":"d1","description":"Ceremony Backdrop","quantity":1,"unit":"setup","rate":28000,"total":28000},{"id":"d2","description":"Aisle Decorations","quantity":1,"unit":"setup","rate":15000,"total":15000},{"id":"d3","description":"Reception Centerpieces","quantity":15,"unit":"tables","rate":3500,"total":52500},{"id":"d4","description":"String Light Installation","quantity":1,"unit":"package","rate":18000,"total":18000},{"id":"d5","description":"Setup & Teardown","quantity":1,"unit":"service","rate":12000,"total":12000}]',
125500,
'[{"id":"a1","name":"Ceiling Draping","price":28000},{"id":"a2","name":"Photo Booth Backdrop","price":15000},{"id":"a3","name":"Neon Sign Rental","price":8000}]',
'{"centerpieces":15,"lighting":true}',
'["Ceremony backdrop","Aisle decorations","15 reception centerpieces","String light installation","Setup and teardown","Free design consultation"]', 1);

-- Royal Photography (vendor_id 22) - This is the vendor the user likely tests with
INSERT INTO services (vendor_id, name, description, category, pricing_items, base_total, add_ons, details, inclusions, is_active) VALUES
(22, 'Signature Wedding Package', 'Our most popular package featuring dual photographer coverage, drone aerials, and a premium layflat album. Perfect for couples who want comprehensive documentation.', 'photography',
'[{"id":"p1","description":"Full Day Coverage","quantity":12,"unit":"hours","rate":5500,"total":66000},{"id":"p2","description":"Lead Photographer","quantity":1,"unit":"day","rate":22000,"total":22000},{"id":"p3","description":"Second Photographer","quantity":1,"unit":"day","rate":15000,"total":15000},{"id":"p4","description":"Drone Coverage","quantity":1,"unit":"session","rate":12000,"total":12000},{"id":"p5","description":"Premium Album (50 pages)","quantity":1,"unit":"album","rate":25000,"total":25000}]',
140000,
'[{"id":"a1","name":"Prenuptial Shoot","price":18000},{"id":"a2","name":"Same-Day Edit (15 photos)","price":12000},{"id":"a3","name":"Parent Albums (2pcs)","price":15000},{"id":"a4","name":"Canvas Print (24x36)","price":8000}]',
'{"coverage_hours":12,"photographers":2,"drone":true,"edited_photos":500}',
'["500+ edited high-resolution photos","50-page premium layflat album","Drone aerial coverage","Online gallery with lifetime access","USB with edited + RAW files","Same-day teaser (5 photos)","Engagement photos (20 pcs)"]', 1);

INSERT INTO services (vendor_id, name, description, category, pricing_items, base_total, add_ons, details, inclusions, is_active) VALUES
(22, 'Essential Wedding Package', 'Quality coverage for intimate celebrations. Single photographer with all the essentials for your special day.', 'photography',
'[{"id":"p1","description":"Photography Coverage","quantity":6,"unit":"hours","rate":4500,"total":27000},{"id":"p2","description":"Professional Photographer","quantity":1,"unit":"day","rate":15000,"total":15000},{"id":"p3","description":"Edited Digital Photos","quantity":120,"unit":"photos","rate":50,"total":6000}]',
48000,
'[{"id":"a1","name":"Extra Hour","price":4500},{"id":"a2","name":"Photo Booth","price":8000}]',
'{"coverage_hours":6,"photographers":1,"edited_photos":120}',
'["120 edited high-resolution photos","Online gallery with download","USB drive delivery","Pre-wedding consultation"]', 1);
