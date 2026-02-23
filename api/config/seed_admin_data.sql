-- Seed Admin Test Data
-- Creates test tickets, complaints, and login attempts for admin dashboard

-- =====================================================
-- SEED SUPPORT TICKETS (using coupletest - user_id 27)
-- =====================================================

INSERT INTO support_tickets (user_id, category, subject, description, priority, status, created_at, updated_at) VALUES
(27, 'payment', 'Payment not reflecting', 'I made a payment for my booking 2 days ago but it still shows as unpaid. My reference number is PAY-2026-0214.', 'high', 'open', '2026-02-20 09:30:00', '2026-02-20 09:30:00'),
(27, 'booking', 'How to change event date?', 'I need to reschedule my wedding from June 15 to July 20. How can I do this?', 'medium', 'in_progress', '2026-02-18 14:15:00', '2026-02-19 10:00:00'),
(27, 'vendor', 'Vendor not responding', 'I have been trying to contact the photographer for 3 days but no response. Can you help?', 'high', 'open', '2026-02-22 11:45:00', '2026-02-22 11:45:00'),
(2, 'technical', 'Cannot upload profile picture', 'When I try to upload my profile photo, it shows an error message. I have tried different file formats.', 'low', 'resolved', '2026-02-10 16:20:00', '2026-02-11 09:00:00'),
(2, 'payment', 'Request for invoice', 'Please send me the official invoice for my booking #3. I need it for my records.', 'medium', 'resolved', '2026-02-15 08:00:00', '2026-02-15 14:30:00');

-- =====================================================
-- SEED TICKET REPLIES
-- =====================================================

INSERT INTO ticket_replies (ticket_id, user_id, message, created_at) VALUES
(2, 26, 'Hi! You can reschedule your event by going to your booking details and clicking "Request Reschedule". The vendor will need to approve the new date.', '2026-02-19 10:00:00'),
(4, 26, 'We have fixed the image upload issue. Please try again and let us know if it works.', '2026-02-11 09:00:00'),
(4, 2, 'Thank you! It works now.', '2026-02-11 10:30:00'),
(5, 26, 'Your invoice has been sent to your registered email address. Please check your inbox.', '2026-02-15 14:30:00');

-- =====================================================
-- SEED COMPLAINTS (match actual table structure)
-- =====================================================

INSERT INTO complaints (complainant_id, reported_id, reported_type, category, subject, description, evidence, status, priority, resolution, created_at, updated_at) VALUES
(27, 1, 'vendor', 'service_quality', 'Poor photo quality', 'The photos delivered were of poor quality and not what was promised. Many shots were blurry and the editing was inconsistent.', '["https://example.com/evidence1.jpg", "https://example.com/evidence2.jpg"]', 'investigating', 'high', NULL, '2026-02-21 13:00:00', '2026-02-22 09:00:00'),
(2, 22, 'vendor', 'late_delivery', 'Vendor arrived late', 'The vendor arrived 2 hours late to our event and missed important moments.', NULL, 'pending', 'high', NULL, '2026-02-23 10:15:00', '2026-02-23 10:15:00'),
(27, 15, 'coordinator', 'unprofessional', 'Unprofessional behavior', 'The coordinator was rude to our guests and argued with our family members.', NULL, 'resolved', 'medium', 'Both parties have been contacted. Issue resolved with formal apology from coordinator.', '2026-02-05 18:30:00', '2026-02-08 16:00:00');

-- =====================================================
-- SEED LOGIN ATTEMPTS (for login security page)
-- =====================================================

-- Successful logins
INSERT INTO login_attempts (user_id, email, ip_address, status, user_agent, created_at) VALUES
(26, 'admin@weddingbazaar.ph', '192.168.1.1', 'success', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/121.0', '2026-02-24 08:00:00'),
(26, 'admin@weddingbazaar.ph', '192.168.1.1', 'success', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/121.0', '2026-02-23 09:15:00'),
(27, 'coupletest@example.com', '192.168.1.50', 'success', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) Safari/605.1', '2026-02-24 07:30:00'),
(27, 'coupletest@example.com', '192.168.1.50', 'success', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) Safari/605.1', '2026-02-22 14:20:00'),
(2, 'couple@example.com', '192.168.1.100', 'success', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1', '2026-02-23 11:00:00');

-- Failed login attempts (for security monitoring)
INSERT INTO login_attempts (user_id, email, ip_address, status, failure_reason, user_agent, created_at) VALUES
(NULL, 'admin@weddingbazaar.ph', '45.33.32.156', 'failed', 'Invalid password', 'Mozilla/5.0 (Linux; Android) AppleWebKit/537.36', '2026-02-24 03:15:00'),
(NULL, 'admin@weddingbazaar.ph', '45.33.32.156', 'failed', 'Invalid password', 'Mozilla/5.0 (Linux; Android) AppleWebKit/537.36', '2026-02-24 03:15:30'),
(NULL, 'admin@weddingbazaar.ph', '45.33.32.156', 'blocked', 'Too many failed attempts', 'Mozilla/5.0 (Linux; Android) AppleWebKit/537.36', '2026-02-24 03:16:00'),
(NULL, 'test@hacker.com', '103.25.41.82', 'failed', 'User not found', 'curl/7.64.1', '2026-02-23 22:45:00'),
(NULL, 'root@weddingbazaar.ph', '103.25.41.82', 'blocked', 'Suspicious activity', 'curl/7.64.1', '2026-02-23 22:45:05'),
(NULL, 'coupletest@example.com', '192.168.1.50', 'failed', 'Invalid password', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) Safari/605.1', '2026-02-24 07:28:00'),
(NULL, 'coupletest@example.com', '192.168.1.50', 'failed', 'Invalid password', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) Safari/605.1', '2026-02-24 07:29:00');

-- =====================================================
-- SEED LOCATION LOGS (for location tracking page)
-- =====================================================

INSERT INTO location_logs (user_id, ip_address, city, province, country, latitude, longitude, purpose, created_at) VALUES
(26, '192.168.1.1', 'Manila', 'Metro Manila', 'Philippines', 14.5995, 120.9842, 'login', '2026-02-24 08:00:00'),
(27, '192.168.1.50', 'Quezon City', 'Metro Manila', 'Philippines', 14.6760, 121.0437, 'login', '2026-02-24 07:30:00'),
(2, '192.168.1.100', 'Makati', 'Metro Manila', 'Philippines', 14.5547, 121.0244, 'login', '2026-02-23 11:00:00'),
(26, '192.168.1.1', 'Manila', 'Metro Manila', 'Philippines', 14.5995, 120.9842, 'page_view', '2026-02-24 08:05:00'),
(26, '192.168.1.1', 'Manila', 'Metro Manila', 'Philippines', 14.5995, 120.9842, 'settings_change', '2026-02-24 08:10:00');

-- =====================================================
-- SEED ACTIVITY LOGS (add more if needed)
-- =====================================================

INSERT INTO activity_logs (user_id, action, entity_type, entity_id, description, ip_address, location, created_at) VALUES
(26, 'login', NULL, NULL, 'Admin logged in successfully', '192.168.1.1', 'Manila, PH', '2026-02-24 08:00:00'),
(26, 'user_view', 'user', 27, 'Viewed user profile: coupletest', '192.168.1.1', 'Manila, PH', '2026-02-24 08:05:00'),
(26, 'ticket_reply', 'ticket', 2, 'Replied to support ticket #2', '192.168.1.1', 'Manila, PH', '2026-02-24 08:15:00'),
(26, 'complaint_update', 'complaint', 1, 'Updated complaint status to investigating', '192.168.1.1', 'Manila, PH', '2026-02-24 08:20:00'),
(27, 'login', NULL, NULL, 'User logged in successfully', '192.168.1.50', 'Quezon City, PH', '2026-02-24 07:30:00'),
(27, 'ticket_create', 'ticket', 3, 'Created support ticket: Vendor not responding', '192.168.1.50', 'Quezon City, PH', '2026-02-22 11:45:00'),
(2, 'login', NULL, NULL, 'User logged in successfully', '192.168.1.100', 'Makati, PH', '2026-02-23 11:00:00');
