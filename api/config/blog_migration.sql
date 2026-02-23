-- Blog Posts Migration
-- Run this to add blog functionality

CREATE TABLE IF NOT EXISTS blog_posts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    slug VARCHAR(255) NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    excerpt TEXT,
    content LONGTEXT,
    featured_image VARCHAR(500),
    author_name VARCHAR(100) NOT NULL DEFAULT 'Wedding Bazaar Team',
    category VARCHAR(100) DEFAULT 'General',
    status ENUM('draft', 'published', 'archived') DEFAULT 'draft',
    is_featured BOOLEAN DEFAULT FALSE,
    view_count INT DEFAULT 0,
    published_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status (status),
    INDEX idx_published (published_at),
    INDEX idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample blog posts (optional - can be removed for empty start)
INSERT INTO blog_posts (slug, title, excerpt, content, featured_image, author_name, category, status, is_featured, published_at) VALUES
('top-wedding-trends-2026', 'Top Wedding Trends for 2026', 'From sustainable celebrations to intimate micro-weddings, discover what''s trending this wedding season.', '<p>The wedding industry continues to evolve, with couples seeking more personalized and meaningful celebrations. Here are the top trends we''re seeing in 2026...</p>', 'https://images.unsplash.com/photo-1519741497674-611481863552?w=600', 'Maria Santos', 'Trends', 'published', TRUE, NOW()),
('choosing-wedding-photographer', 'How to Choose the Perfect Wedding Photographer', 'Your wedding photos will last a lifetime. Here''s how to find a photographer who captures your unique love story.', '<p>Choosing a wedding photographer is one of the most important decisions you''ll make. Here''s our comprehensive guide...</p>', 'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=600', 'Juan dela Cruz', 'Tips', 'published', FALSE, NOW() - INTERVAL 5 DAY),
('budget-wedding-tips', 'Planning a Beautiful Wedding on a Budget', 'You don''t need to break the bank for your dream wedding. Here are practical tips to save money without sacrificing style.', '<p>Your dream wedding doesn''t have to cost a fortune. With smart planning and creative ideas, you can have a beautiful celebration...</p>', 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=600', 'Ana Reyes', 'Budget', 'published', FALSE, NOW() - INTERVAL 10 DAY);
