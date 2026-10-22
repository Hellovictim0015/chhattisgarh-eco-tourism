-- Call / WhatsApp buttons on the hotel page.
--   site_settings: site-wide values the admin edits in Admin -> Settings (default call and WhatsApp numbers)
--   hotels.whatsapp: optional per-hotel WhatsApp number; hotels.phone is the per-hotel call number
-- A hotel without its own numbers uses the site-wide ones.
-- Run once on every database (local and live). Also included in schema/schema.sql.

CREATE TABLE IF NOT EXISTS site_settings (
  setting_key VARCHAR(100) NOT NULL,
  value       TEXT         DEFAULT NULL,
  updated_at  TIMESTAMP    NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO site_settings (setting_key, value) VALUES
  ('contact_phone', NULL),
  ('whatsapp_number', NULL);

-- MySQL has no "ADD COLUMN IF NOT EXISTS", so only add it when missing
SET @has_col := (SELECT COUNT(*) FROM information_schema.COLUMNS
                 WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'hotels' AND COLUMN_NAME = 'whatsapp');
SET @sql := IF(@has_col = 0, 'ALTER TABLE hotels ADD COLUMN whatsapp VARCHAR(20) NULL AFTER phone', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
