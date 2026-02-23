-- Delete old test login attempts and reseed with correct schema
-- ============================================================

-- Clear existing test login attempts
DELETE FROM login_attempts WHERE email IN ('admin@weddingbazaar.ph', 'coupletest@example.com', 'couple@example.com', 'test@hacker.com', 'root@weddingbazaar.ph');

-- Successful logins
INSERT INTO login_attempts (user_id, email, ip_address, status, user_agent, created_at) VALUES
(26, 'admin@weddingbazaar.ph', '192.168.1.1', 'success', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/121.0', '2026-02-24 08:00:00'),
(26, 'admin@weddingbazaar.ph', '192.168.1.1', 'success', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/121.0', '2026-02-23 09:15:00'),
(27, 'coupletest@example.com', '192.168.1.50', 'success', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) Safari/605.1', '2026-02-24 07:30:00'),
(27, 'coupletest@example.com', '192.168.1.50', 'success', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) Safari/605.1', '2026-02-22 14:20:00'),
(2, 'couple@example.com', '192.168.1.100', 'success', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1', '2026-02-23 11:00:00');

-- Failed login attempts
INSERT INTO login_attempts (user_id, email, ip_address, status, failure_reason, user_agent, created_at) VALUES
(NULL, 'admin@weddingbazaar.ph', '45.33.32.156', 'failed', 'Invalid password', 'Mozilla/5.0 (Linux; Android) AppleWebKit/537.36', '2026-02-24 03:15:00'),
(NULL, 'admin@weddingbazaar.ph', '45.33.32.156', 'failed', 'Invalid password', 'Mozilla/5.0 (Linux; Android) AppleWebKit/537.36', '2026-02-24 03:15:30'),
(NULL, 'admin@weddingbazaar.ph', '45.33.32.156', 'blocked', 'Too many failed attempts', 'Mozilla/5.0 (Linux; Android) AppleWebKit/537.36', '2026-02-24 03:16:00'),
(NULL, 'test@hacker.com', '103.25.41.82', 'failed', 'User not found', 'curl/7.64.1', '2026-02-23 22:45:00'),
(NULL, 'root@weddingbazaar.ph', '103.25.41.82', 'blocked', 'Suspicious activity', 'curl/7.64.1', '2026-02-23 22:45:05'),
(NULL, 'coupletest@example.com', '192.168.1.50', 'failed', 'Invalid password', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) Safari/605.1', '2026-02-24 07:28:00'),
(NULL, 'coupletest@example.com', '192.168.1.50', 'failed', 'Invalid password', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) Safari/605.1', '2026-02-24 07:29:00');
