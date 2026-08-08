CREATE TABLE IF NOT EXISTS events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(6) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    creator_name VARCHAR(100),
    creator_email VARCHAR(255),
    date_from DATE NOT NULL,
    date_to DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS responses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_id INT NOT NULL,
    participant_name VARCHAR(100) NOT NULL,
    availability JSON NOT NULL,
    comment TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    UNIQUE KEY unique_participant (event_id, participant_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Migration from suggested_date to date range + email:
-- ALTER TABLE events ADD COLUMN creator_email VARCHAR(255) DEFAULT NULL AFTER creator_name;
-- ALTER TABLE events ADD COLUMN date_from DATE NOT NULL DEFAULT '2026-01-01' AFTER creator_email;
-- ALTER TABLE events ADD COLUMN date_to DATE NOT NULL DEFAULT '2026-12-31' AFTER date_from;
-- UPDATE events SET date_from = COALESCE(suggested_date, CURDATE()), date_to = COALESCE(suggested_date, DATE_ADD(CURDATE(), INTERVAL 1 MONTH));
-- ALTER TABLE events DROP COLUMN suggested_date;
