-- Testimonials and FAQs Migration
-- Run this migration to add testimonials and FAQs tables

-- Create testimonials table for curated testimonials
CREATE TABLE IF NOT EXISTS testimonials (
    id INT AUTO_INCREMENT PRIMARY KEY,
    couple_names VARCHAR(255) NOT NULL,
    location VARCHAR(255) DEFAULT NULL,
    avatar VARCHAR(500) DEFAULT NULL,
    rating INT NOT NULL DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
    testimonial TEXT NOT NULL,
    wedding_date DATE DEFAULT NULL,
    vendor_name VARCHAR(255) DEFAULT NULL,
    service_type VARCHAR(100) DEFAULT NULL,
    is_approved TINYINT(1) DEFAULT 1,
    is_featured TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_approved (is_approved),
    INDEX idx_featured (is_featured),
    INDEX idx_wedding_date (wedding_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create FAQs table
CREATE TABLE IF NOT EXISTS faqs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    question VARCHAR(500) NOT NULL,
    answer TEXT NOT NULL,
    category VARCHAR(100) DEFAULT 'General',
    sort_order INT DEFAULT 0,
    is_published TINYINT(1) DEFAULT 1,
    view_count INT DEFAULT 0,
    helpful_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_category (category),
    INDEX idx_published (is_published),
    INDEX idx_sort (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample testimonials (Philippine couples)
INSERT INTO testimonials (couple_names, location, rating, testimonial, wedding_date, vendor_name, service_type) VALUES
('Maria & Juan Santos', 'Manila, Metro Manila', 5, 'Wedding Bazaar made our wedding planning so much easier! We found the perfect photographer and venue through this platform. The booking process was seamless and all vendors were professional. Highly recommended!', '2026-01-15', 'Maria Santos Photography', 'photography'),
('Ana & Carlo Reyes', 'Makati, Metro Manila', 5, 'The vendors we connected with were professional and delivered exactly what we envisioned. Our wedding at Garden Paradise Tagaytay was magical thanks to Wedding Bazaar. The platform made coordination so easy!', '2026-02-01', 'Garden Paradise Tagaytay', 'venue'),
('Patricia & Miguel Cruz', 'Quezon City, Metro Manila', 5, 'From makeup artist to caterer, we found all our vendors here. The reviews helped us make informed decisions. Best wedding planning experience! Everything was perfect on our big day.', '2025-12-20', 'Glam Squad Manila', 'makeup'),
('Sofia & Rafael Gonzales', 'Cebu City, Cebu', 5, 'We were worried about planning our destination wedding but Wedding Bazaar connected us with amazing local vendors in Cebu. The florist exceeded our expectations with stunning arrangements!', '2025-11-28', 'Bloom & Petals Studio', 'florist'),
('Isabella & David Lim', 'Tagaytay, Cavite', 5, 'The coordination service we booked through Wedding Bazaar was exceptional. Ana Reyes Events handled every detail perfectly, allowing us to just enjoy our special day without stress.', '2026-01-22', 'Ana Reyes Events', 'coordinator'),
('Grace & Mark Tan', 'Batangas City, Batangas', 5, 'Our beach wedding was a dream come true! The videography team from Cinematic Dreams PH captured every beautiful moment. We watch our wedding film every anniversary!', '2025-10-15', 'Cinematic Dreams PH', 'videography');

-- Insert FAQs
INSERT INTO faqs (question, answer, category, sort_order) VALUES
('How do I book a vendor?', 'Browse our vendor listings, select a vendor you like, check their availability using the calendar, and click "Book Now". You can then choose your date and complete the booking with secure payment through PayMongo.', 'Getting Started', 1),
('How do I become a vendor on Wedding Bazaar?', 'Click "Register" and select "Vendor" as your account type. Fill in your business details, submit verification documents (DTI/SEC registration, valid ID, portfolio), and wait for admin approval. Once approved, you can start listing your services.', 'For Vendors', 2),
('Is my payment secure?', 'Yes! We use secure payment processing through PayMongo, a PCI-DSS compliant payment provider. Your payment information is encrypted and never stored on our servers. We support GCash, Maya, credit cards, and bank transfers.', 'Payments', 3),
('Can I cancel a booking?', 'Cancellation policies vary by vendor. Check the vendor''s cancellation policy before booking. Generally, cancellations made 30+ days before the event may receive a full refund, while closer cancellations may have fees. Contact the vendor through our messaging system for specific inquiries.', 'Bookings', 4),
('How do I contact a vendor?', 'After creating an account, you can send messages to any vendor through our built-in messaging system. Just click the "Message" button on their profile. You''ll receive notifications when they reply.', 'Getting Started', 5),
('What if I have a dispute with a vendor?', 'Contact our support team immediately through the Help Center or email support@weddingbazaar.ph. We take disputes seriously and will work with both parties to find a fair resolution. You can also use the "Report" feature on the vendor profile.', 'Support', 6),
('How do I get verified as a vendor?', 'Go to your Vendor Dashboard, click on "Get Verified", and upload the required documents: DTI/SEC registration certificate, valid government ID, and portfolio samples. Our team reviews submissions within 2-3 business days.', 'For Vendors', 7),
('What payment methods do you accept?', 'We accept GCash, Maya (PayMaya), credit/debit cards (Visa, Mastercard), and bank transfers through PayMongo. All payments are processed securely.', 'Payments', 8),
('How do I update my vendor profile?', 'Log in to your account, go to your Vendor Dashboard, and click "Profile". From there you can update your business information, add photos, update pricing, and manage your services.', 'For Vendors', 9),
('What happens after I book a vendor?', 'After booking, you''ll receive a confirmation email. The vendor will be notified and can confirm your booking. You can track all your bookings in your dashboard and communicate with vendors through our messaging system.', 'Bookings', 10),
('How do coordinators work on the platform?', 'Wedding coordinators can register as coordinators and offer their planning services. Couples can hire coordinators to help manage multiple vendor bookings, timelines, and day-of coordination.', 'For Coordinators', 11),
('Can I save favorite vendors?', 'Yes! Click the heart icon on any vendor profile to save them to your favorites. Access your saved vendors anytime from your dashboard to compare and make decisions.', 'Getting Started', 12);
