-- CMS Schema for Wedding Bazaar
-- Run this SQL in Railway MySQL to add CMS tables

-- Site Settings (key-value store)
CREATE TABLE IF NOT EXISTS `site_settings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `setting_key` varchar(100) NOT NULL UNIQUE,
  `setting_value` text DEFAULT NULL,
  `setting_type` enum('text', 'textarea', 'number', 'boolean', 'json', 'image') DEFAULT 'text',
  `setting_group` varchar(50) DEFAULT 'general',
  `label` varchar(100) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `sort_order` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_group` (`setting_group`),
  KEY `idx_key` (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Content Pages (static pages like about, help, etc)
CREATE TABLE IF NOT EXISTS `content_pages` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL UNIQUE,
  `content` longtext DEFAULT NULL,
  `excerpt` text DEFAULT NULL,
  `meta_title` varchar(255) DEFAULT NULL,
  `meta_description` text DEFAULT NULL,
  `featured_image` varchar(500) DEFAULT NULL,
  `status` enum('draft', 'published', 'archived') DEFAULT 'draft',
  `author_id` int(11) DEFAULT NULL,
  `published_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_slug` (`slug`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Landing Page Sections (hero, features, testimonials, etc)
CREATE TABLE IF NOT EXISTS `landing_sections` (
  `id` int NOT NULL AUTO_INCREMENT,
  `section_key` varchar(100) NOT NULL UNIQUE,
  `section_type` enum('hero', 'features', 'testimonials', 'cta', 'stats', 'steps', 'faq', 'custom') DEFAULT 'custom',
  `title` varchar(255) DEFAULT NULL,
  `subtitle` text DEFAULT NULL,
  `content` JSON DEFAULT NULL,
  `background_image` varchar(500) DEFAULT NULL,
  `background_color` varchar(20) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `sort_order` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_section_key` (`section_key`),
  KEY `idx_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Media Library
CREATE TABLE IF NOT EXISTS `media_library` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `filename` varchar(255) NOT NULL,
  `original_name` varchar(255) NOT NULL,
  `file_path` varchar(500) NOT NULL,
  `file_url` varchar(500) NOT NULL,
  `mime_type` varchar(100) NOT NULL,
  `file_size` int(11) DEFAULT 0,
  `width` int(11) DEFAULT NULL,
  `height` int(11) DEFAULT NULL,
  `alt_text` varchar(255) DEFAULT NULL,
  `caption` text DEFAULT NULL,
  `folder` varchar(100) DEFAULT 'general',
  `uploaded_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_folder` (`folder`),
  KEY `idx_mime` (`mime_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default site settings
INSERT INTO `site_settings` (`setting_key`, `setting_value`, `setting_type`, `setting_group`, `label`, `description`, `sort_order`) VALUES
-- Contact Information
('contact_email', 'hello@weddingbazaar.ph', 'text', 'contact', 'Contact Email', 'Main contact email address', 1),
('contact_phone', '+63 917 123 4567', 'text', 'contact', 'Contact Phone', 'Main contact phone number', 2),
('contact_address', 'BGC, Taguig City, Metro Manila, Philippines', 'textarea', 'contact', 'Address', 'Physical address', 3),
('contact_hours', 'Mon-Fri: 9AM-6PM, Sat: 10AM-4PM', 'text', 'contact', 'Business Hours', 'Operating hours', 4),

-- Social Media
('social_facebook', 'https://facebook.com/weddingbazaarph', 'text', 'social', 'Facebook URL', 'Facebook page URL', 1),
('social_instagram', 'https://instagram.com/weddingbazaarph', 'text', 'social', 'Instagram URL', 'Instagram profile URL', 2),
('social_twitter', 'https://twitter.com/weddingbazaarph', 'text', 'social', 'Twitter URL', 'Twitter profile URL', 3),
('social_youtube', '', 'text', 'social', 'YouTube URL', 'YouTube channel URL', 4),
('social_tiktok', '', 'text', 'social', 'TikTok URL', 'TikTok profile URL', 5),

-- Branding
('site_name', 'WeddingBazaar', 'text', 'branding', 'Site Name', 'Website name', 1),
('site_tagline', 'Plan Your Perfect Wedding', 'text', 'branding', 'Tagline', 'Site tagline/slogan', 2),
('site_description', 'The Philippines'' premier wedding marketplace connecting couples with trusted vendors and coordinators.', 'textarea', 'branding', 'Site Description', 'Main site description for SEO', 3),
('logo_url', '', 'image', 'branding', 'Logo', 'Site logo image', 4),
('favicon_url', '', 'image', 'branding', 'Favicon', 'Browser favicon', 5),

-- Footer
('footer_about', 'WeddingBazaar is the Philippines'' premier wedding marketplace, connecting couples with trusted vendors and coordinators to create their perfect wedding day.', 'textarea', 'footer', 'About Text', 'Footer about section text', 1),
('footer_copyright', '© 2026 WeddingBazaar. All rights reserved.', 'text', 'footer', 'Copyright Text', 'Copyright notice', 2);

-- Insert default landing page sections
INSERT INTO `landing_sections` (`section_key`, `section_type`, `title`, `subtitle`, `content`, `is_active`, `sort_order`) VALUES
('hero', 'hero', 'Plan Your Perfect Wedding', 'Connect with the Philippines'' finest wedding vendors and coordinators. Start your journey to the wedding of your dreams.', 
'{"primaryButton": {"text": "Find Vendors", "link": "/vendors"}, "secondaryButton": {"text": "Browse Coordinators", "link": "/coordinators"}, "backgroundImage": "", "stats": [{"value": "500+", "label": "Verified Vendors"}, {"value": "1000+", "label": "Happy Couples"}, {"value": "50+", "label": "Cities Covered"}]}', 
1, 1),

('features', 'features', 'Why Choose WeddingBazaar?', 'Everything you need to plan your perfect wedding day', 
'{"items": [{"icon": "Shield", "title": "Verified Vendors", "description": "All vendors undergo strict verification for quality assurance"}, {"icon": "Calendar", "title": "Easy Booking", "description": "Book and manage all your wedding services in one place"}, {"icon": "MessageCircle", "title": "Direct Communication", "description": "Chat directly with vendors and coordinators"}, {"icon": "CreditCard", "title": "Secure Payments", "description": "Pay safely through our secure payment system"}, {"icon": "Star", "title": "Real Reviews", "description": "Read authentic reviews from verified couples"}, {"icon": "MapPin", "title": "Nationwide Coverage", "description": "Find vendors across the Philippines"}]}', 
1, 2),

('how_it_works', 'steps', 'How It Works', 'Planning your wedding is easy with WeddingBazaar', 
'{"steps": [{"number": 1, "title": "Browse & Discover", "description": "Explore our curated list of verified vendors and coordinators"}, {"number": 2, "title": "Compare & Connect", "description": "Compare services, read reviews, and message your favorites"}, {"number": 3, "title": "Book & Pay", "description": "Secure your booking with our safe payment system"}, {"number": 4, "title": "Celebrate", "description": "Enjoy your perfect wedding day!"}]}', 
1, 3),

('stats', 'stats', NULL, NULL, 
'{"items": [{"value": "500+", "label": "Verified Vendors", "icon": "Building"}, {"value": "1,000+", "label": "Weddings Organized", "icon": "Heart"}, {"value": "50+", "label": "Cities Covered", "icon": "MapPin"}, {"value": "4.9", "label": "Average Rating", "icon": "Star"}]}', 
1, 4),

('testimonials', 'testimonials', 'What Couples Say', 'Real stories from real weddings', 
'{"items": [{"name": "Maria & Juan", "wedding_date": "December 2025", "quote": "WeddingBazaar made planning our wedding so much easier! We found amazing vendors all in one place.", "avatar": "", "rating": 5}, {"name": "Ana & Carlos", "wedding_date": "November 2025", "quote": "The verified vendors gave us peace of mind. Every service exceeded our expectations!", "avatar": "", "rating": 5}, {"name": "Claire & Miguel", "wedding_date": "October 2025", "quote": "Best decision we made was using WeddingBazaar. Our coordinator was incredible!", "avatar": "", "rating": 5}]}', 
1, 5),

('cta', 'cta', 'Ready to Plan Your Wedding?', 'Join thousands of happy couples who found their perfect wedding vendors', 
'{"primaryButton": {"text": "Get Started Free", "link": "/register"}, "secondaryButton": {"text": "Learn More", "link": "/how-it-works"}}', 
1, 6),

('faq', 'faq', 'Frequently Asked Questions', 'Everything you need to know about WeddingBazaar', 
'{"items": [{"question": "How do I find vendors?", "answer": "Browse our categories, use filters to narrow down your search, and view detailed vendor profiles with reviews and portfolios."}, {"question": "Are all vendors verified?", "answer": "Yes! All vendors undergo a verification process including business registration, portfolio review, and identity verification."}, {"question": "How do payments work?", "answer": "We support multiple payment methods including GCash, Maya, credit/debit cards, and bank transfers. All payments are secured."}, {"question": "Can I cancel a booking?", "answer": "Cancellation policies vary by vendor. Check the specific vendor terms before booking, and contact our support for assistance."}, {"question": "Is there a fee for couples?", "answer": "Creating an account and browsing vendors is completely free! You only pay when you book a service."}]}', 
1, 7);

-- Insert default content pages
INSERT INTO `content_pages` (`title`, `slug`, `content`, `excerpt`, `status`, `published_at`) VALUES
('About Us', 'about', '<h2>Our Story</h2><p>WeddingBazaar was founded with a simple mission: to make wedding planning easier and more enjoyable for Filipino couples.</p><h2>Our Mission</h2><p>We connect couples with verified, talented wedding professionals across the Philippines, ensuring every wedding is as unique and beautiful as the love it celebrates.</p><h2>Why Choose Us</h2><ul><li>500+ verified vendors nationwide</li><li>Secure booking and payment system</li><li>Dedicated customer support</li><li>Real reviews from real couples</li></ul>', 'Learn about WeddingBazaar and our mission to make wedding planning easier.', 'published', NOW()),

('How It Works', 'how-it-works', '<h2>Planning Made Simple</h2><p>WeddingBazaar streamlines the wedding planning process in four easy steps.</p><h3>Step 1: Browse & Discover</h3><p>Explore our curated marketplace of verified vendors. Filter by category, location, price range, and ratings.</p><h3>Step 2: Compare & Connect</h3><p>View detailed profiles, portfolios, and reviews. Message vendors directly to discuss your needs.</p><h3>Step 3: Book & Pay</h3><p>Secure your booking with our safe payment system. Choose from multiple payment options.</p><h3>Step 4: Celebrate</h3><p>Enjoy your perfect wedding day with confidence, knowing you have the best team!</p>', 'Discover how easy it is to plan your wedding with WeddingBazaar.', 'published', NOW()),

('Contact Us', 'contact', '<h2>Get in Touch</h2><p>We would love to hear from you! Whether you have questions, feedback, or need assistance, our team is here to help.</p><h3>Customer Support</h3><p>Email: support@weddingbazaar.ph<br>Phone: +63 917 123 4567<br>Hours: Mon-Fri 9AM-6PM, Sat 10AM-4PM</p><h3>For Vendors</h3><p>Interested in joining our marketplace? Email us at vendors@weddingbazaar.ph</p><h3>Office Location</h3><p>BGC, Taguig City<br>Metro Manila, Philippines</p>', 'Contact the WeddingBazaar team for support and inquiries.', 'published', NOW()),

('Help Center', 'help', '<h2>Help Center</h2><p>Find answers to common questions and learn how to get the most out of WeddingBazaar.</p><h3>For Couples</h3><ul><li>How to create an account</li><li>Searching for vendors</li><li>Making a booking</li><li>Payment options</li><li>Cancellations and refunds</li></ul><h3>For Vendors</h3><ul><li>Joining the marketplace</li><li>Setting up your profile</li><li>Managing bookings</li><li>Receiving payments</li></ul><p>Need more help? Contact our support team!</p>', 'Get help with your WeddingBazaar account and bookings.', 'published', NOW()),

('Terms of Service', 'terms', '<h2>Terms of Service</h2><p>Last updated: February 2026</p><h3>1. Acceptance of Terms</h3><p>By accessing WeddingBazaar, you agree to these Terms of Service.</p><h3>2. User Accounts</h3><p>You are responsible for maintaining the security of your account credentials.</p><h3>3. Bookings</h3><p>All bookings are subject to vendor availability and terms. WeddingBazaar facilitates connections but vendors provide services independently.</p><h3>4. Payments</h3><p>Payments are processed securely. Refund policies vary by vendor.</p><h3>5. User Conduct</h3><p>Users must not engage in fraudulent activity, harassment, or violate any laws.</p>', 'Read our terms of service and user agreement.', 'published', NOW()),

('Privacy Policy', 'privacy', '<h2>Privacy Policy</h2><p>Last updated: February 2026</p><h3>Information We Collect</h3><p>We collect information you provide (name, email, phone) and usage data to improve our services.</p><h3>How We Use Your Information</h3><p>Your information is used to provide services, process bookings, and communicate with you.</p><h3>Data Security</h3><p>We implement security measures to protect your personal information.</p><h3>Your Rights</h3><p>You can access, update, or delete your personal information through your account settings.</p>', 'Learn how we collect, use, and protect your personal information.', 'published', NOW()),

('Blog', 'blog', '<h2>Wedding Planning Blog</h2><p>Coming soon! Tips, inspiration, and real wedding stories from Filipino couples.</p>', 'Wedding planning tips, inspiration, and real stories.', 'published', NOW());
