-- Stay types (Hotel, Resort, Eco Lodge...) managed from the admin panel, each with an image.
-- hotels.hotel_type holds the stay type's `code`.
-- Run once on every database (local and live) after 2026-10-21-hotel-booking.sql.

CREATE TABLE IF NOT EXISTS stay_types (
  id         BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
  code       VARCHAR(50)  NOT NULL,                 -- stored in hotels.hotel_type and used in /hotels?type=
  name       VARCHAR(100) NOT NULL,
  image      VARCHAR(500) NULL,
  sort_order INT          NOT NULL DEFAULT 0,
  status     ENUM('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMP    NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP    NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY code (code)
);

-- The types the site started with
INSERT IGNORE INTO stay_types (code, name, sort_order) VALUES
  ('HOTEL', 'Hotels', 1),
  ('RESORT', 'Resorts', 2),
  ('ECO_LODGE', 'Eco Lodges', 3),
  ('HOMESTAY', 'Homestays', 4),
  ('CAMP', 'Camps & Tents', 5),
  ('GUEST_HOUSE', 'Guest Houses', 6);
