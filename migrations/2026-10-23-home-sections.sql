-- Home page sections built from the admin panel (e.g. "Navratri Specials", "Popular stays"):
-- each section shows the hotels the admin picked, in the admin's order, and the sections
-- themselves appear on the home page in sort_order.
-- Run once on every database (local and live). Also included in schema/schema.sql.

CREATE TABLE IF NOT EXISTS home_sections (
  id         BIGINT       NOT NULL AUTO_INCREMENT,
  title      VARCHAR(150) NOT NULL,
  subtitle   VARCHAR(255) DEFAULT NULL,
  slug       VARCHAR(180) NOT NULL,                  -- used by the "View all" page: /collections/<slug>
  sort_order INT          NOT NULL DEFAULT 0,
  status     ENUM('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMP    NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP    NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS home_section_hotels (
  section_id BIGINT NOT NULL,
  hotel_id   BIGINT NOT NULL,
  sort_order INT    NOT NULL DEFAULT 0,
  PRIMARY KEY (section_id, hotel_id),
  KEY home_section_hotels_hotel_fk (hotel_id),
  CONSTRAINT home_section_hotels_section_fk FOREIGN KEY (section_id) REFERENCES home_sections (id) ON DELETE CASCADE,
  CONSTRAINT home_section_hotels_hotel_fk FOREIGN KEY (hotel_id) REFERENCES hotels (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Replace the old automatic "Popular stays" block with an editable section holding the featured hotels
INSERT INTO home_sections (title, subtitle, slug, sort_order)
SELECT 'Popular stays', 'Handpicked places guests love', 'popular-stays', 1 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM home_sections);

INSERT IGNORE INTO home_section_hotels (section_id, hotel_id, sort_order)
SELECT s.id, h.id, ROW_NUMBER() OVER (ORDER BY h.created_at DESC)
FROM home_sections s JOIN hotels h ON h.is_featured = 1 AND h.status = 'ACTIVE'
WHERE s.slug = 'popular-stays'
  AND NOT EXISTS (SELECT 1 FROM home_section_hotels x WHERE x.section_id = s.id);
