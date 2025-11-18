-- Understory Superhost - MySQL Schema
-- Run this in your Digital Ocean MySQL database

-- Drop existing tables if they exist
DROP TABLE IF EXISTS evaluations;
DROP TABLE IF EXISTS experiences;
DROP TABLE IF EXISTS hosts;

-- Hosts table
CREATE TABLE hosts (
    host_id INT AUTO_INCREMENT PRIMARY KEY,
    host_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    badge_override VARCHAR(10) DEFAULT 'auto',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_host_name (host_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Experiences table
CREATE TABLE experiences (
    experience_id INT AUTO_INCREMENT PRIMARY KEY,
    host_id INT NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    price DECIMAL(10,2),
    image_url VARCHAR(1000),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (host_id) REFERENCES hosts(host_id) ON DELETE CASCADE,
    INDEX idx_host_id (host_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Evaluations table
CREATE TABLE evaluations (
    evaluation_id INT AUTO_INCREMENT PRIMARY KEY,
    host_id INT NOT NULL,
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment_text TEXT,
    customer_phone VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (host_id) REFERENCES hosts(host_id) ON DELETE CASCADE,
    INDEX idx_host_id (host_id),
    INDEX idx_created_at (created_at),
    INDEX idx_rating (rating)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Badge statistics view
CREATE OR REPLACE VIEW vw_host_badge_status AS
SELECT 
    h.host_id,
    h.host_name,
    h.email,
    h.phone,
    h.badge_override,
    COUNT(e.evaluation_id) as reviews_count_90d,
    COALESCE(AVG(e.rating), 0) as avg_rating_90d,
    CASE 
        WHEN h.badge_override = 'on' THEN 1
        WHEN h.badge_override = 'off' THEN 0
        WHEN COUNT(e.evaluation_id) >= 10 AND COALESCE(AVG(e.rating), 0) >= 4.8 THEN 1
        ELSE 0
    END as has_valuable_host_badge
FROM hosts h
LEFT JOIN evaluations e ON h.host_id = e.host_id 
    AND e.created_at >= DATE_SUB(NOW(), INTERVAL 90 DAY)
GROUP BY h.host_id, h.host_name, h.email, h.phone, h.badge_override;

SELECT 'Schema created successfully!' as status;