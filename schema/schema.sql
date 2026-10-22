-- =====================================================================
-- Chhattisgarh Eco Tourism — full database schema
--
-- Creates every table the website needs, plus starter data (facilities,
-- stay types, home page hero slides and a first home section). Safe to run again and again:
-- existing tables and rows are never dropped or overwritten.
--
-- How to run (pick one):
--   npm run db:setup                         (uses DB_* from .env)
--   mysql -u <user> -p <database> < schema/schema.sql
--   phpMyAdmin / MySQL Workbench: select the database, then import this file
--
-- Works on MySQL 5.7+, MySQL 8 and MariaDB 10.3+.
-- To also create the database, uncomment the next two lines:
-- CREATE DATABASE IF NOT EXISTS cgecotourism CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- USE cgecotourism;
-- =====================================================================

SET NAMES utf8mb4;

-- ---------------------------------------------------------------------
-- Users & login
-- ---------------------------------------------------------------------

-- Guests, hotel owners and admins. Login is by email OTP.
CREATE TABLE IF NOT EXISTS users (
  id            BIGINT       NOT NULL AUTO_INCREMENT,
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(150) DEFAULT NULL,
  phone         VARCHAR(20)  NOT NULL,
  password      VARCHAR(255) DEFAULT NULL,          -- only used by the admin password login
  role          ENUM('ADMIN','USER') DEFAULT 'USER',
  profile_image VARCHAR(500) DEFAULT NULL,
  is_active     TINYINT(1)   DEFAULT 1,
  created_at    TIMESTAMP    NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP    NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY phone (phone),
  UNIQUE KEY email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- One-time login / registration codes (stored hashed)
CREATE TABLE IF NOT EXISTS otp_codes (
  otp_key    VARCHAR(191) NOT NULL,                  -- e.g. "login:user@example.com"
  otp_hash   CHAR(64)     NOT NULL,                  -- sha256 of the 6-digit code
  expires_at DATETIME     NOT NULL,
  sent_at    DATETIME     NOT NULL,
  attempts   INT          NOT NULL DEFAULT 0,
  PRIMARY KEY (otp_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Hotels
-- ---------------------------------------------------------------------

-- Facilities a hotel can tick (WiFi, Parking, ...)
CREATE TABLE IF NOT EXISTS amenities (
  id         BIGINT       NOT NULL AUTO_INCREMENT,
  name       VARCHAR(150) NOT NULL,
  icon       VARCHAR(255) DEFAULT NULL,
  status     ENUM('ACTIVE','INACTIVE') DEFAULT 'ACTIVE',
  created_at TIMESTAMP    NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP    NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Hotel, Resort, Eco Lodge... managed from Admin -> Stay Types
CREATE TABLE IF NOT EXISTS stay_types (
  id         BIGINT       NOT NULL AUTO_INCREMENT,
  code       VARCHAR(50)  NOT NULL,                  -- stored in hotels.hotel_type, used in /hotels?type=CODE
  name       VARCHAR(100) NOT NULL,
  image      VARCHAR(500) DEFAULT NULL,
  sort_order INT          NOT NULL DEFAULT 0,
  status     ENUM('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMP    NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP    NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- A hotel listed by an owner (user_id) or by the admin (user_id NULL)
CREATE TABLE IF NOT EXISTS hotels (
  id             BIGINT       NOT NULL AUTO_INCREMENT,
  user_id        BIGINT       DEFAULT NULL,
  name           VARCHAR(255) NOT NULL,
  hotel_type     VARCHAR(50)  NOT NULL DEFAULT 'HOTEL', -- stay_types.code
  description    LONGTEXT,
  city           VARCHAR(100) DEFAULT NULL,
  address        VARCHAR(255) DEFAULT NULL,
  star_rating    TINYINT      DEFAULT NULL,
  phone          VARCHAR(20)  DEFAULT NULL,             -- "Call" button; falls back to site_settings.contact_phone
  whatsapp       VARCHAR(20)  DEFAULT NULL,             -- "WhatsApp" button; falls back to site_settings.whatsapp_number
  email          VARCHAR(150) DEFAULT NULL,
  check_in_time  VARCHAR(10)  NOT NULL DEFAULT '12:00',
  check_out_time VARCHAR(10)  NOT NULL DEFAULT '11:00',
  policies       TEXT,
  status         ENUM('ACTIVE','PENDING','INACTIVE') NOT NULL DEFAULT 'PENDING',
  is_featured    TINYINT(1)   NOT NULL DEFAULT 0,
  views          INT          NOT NULL DEFAULT 0,
  created_at     TIMESTAMP    NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP    NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_hotels_status (status),
  KEY idx_hotels_city (city),
  KEY idx_hotels_user (user_id),
  CONSTRAINT hotels_user_fk FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Hotel photos; the lowest sort_order is the cover
CREATE TABLE IF NOT EXISTS hotel_images (
  id         BIGINT       NOT NULL AUTO_INCREMENT,
  hotel_id   BIGINT       NOT NULL,
  image      VARCHAR(500) NOT NULL,
  sort_order INT          NOT NULL DEFAULT 0,
  created_at TIMESTAMP    NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY hotel_id (hotel_id),
  CONSTRAINT hotel_images_hotel_fk FOREIGN KEY (hotel_id) REFERENCES hotels (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS hotel_amenities (
  hotel_id   BIGINT NOT NULL,
  amenity_id BIGINT NOT NULL,
  PRIMARY KEY (hotel_id, amenity_id),
  KEY hotel_amenities_amenity_fk (amenity_id),
  CONSTRAINT hotel_amenities_amenity_fk FOREIGN KEY (amenity_id) REFERENCES amenities (id) ON DELETE CASCADE,
  CONSTRAINT hotel_amenities_hotel_fk FOREIGN KEY (hotel_id) REFERENCES hotels (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- A room type (e.g. "Deluxe Cottage") and how many identical rooms of it the hotel has
CREATE TABLE IF NOT EXISTS rooms (
  id              BIGINT        NOT NULL AUTO_INCREMENT,
  hotel_id        BIGINT        NOT NULL,
  name            VARCHAR(150)  NOT NULL,
  description     TEXT,
  price_per_night DECIMAL(10,2) NOT NULL,
  max_guests      INT           NOT NULL DEFAULT 2,
  total_rooms     INT           NOT NULL DEFAULT 1,
  bed_type        VARCHAR(50)   DEFAULT NULL,
  image           VARCHAR(500)  DEFAULT NULL,
  status          ENUM('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  created_at      TIMESTAMP     NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP     NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY hotel_id (hotel_id),
  CONSTRAINT rooms_hotel_fk FOREIGN KEY (hotel_id) REFERENCES hotels (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Guest bookings. PENDING and CONFIRMED hold rooms; CANCELLED / REJECTED free them.
-- Payment is collected at the hotel.
CREATE TABLE IF NOT EXISTS bookings (
  id              BIGINT        NOT NULL AUTO_INCREMENT,
  booking_code    VARCHAR(20)   NOT NULL,
  hotel_id        BIGINT        NOT NULL,
  room_id         BIGINT        NOT NULL,
  user_id         BIGINT        DEFAULT NULL,
  guest_name      VARCHAR(150)  NOT NULL,
  guest_email     VARCHAR(150)  DEFAULT NULL,
  guest_phone     VARCHAR(20)   NOT NULL,
  check_in        DATE          NOT NULL,
  check_out       DATE          NOT NULL,
  rooms_count     INT           NOT NULL DEFAULT 1,
  guests          INT           NOT NULL DEFAULT 1,
  nights          INT           NOT NULL,
  total_amount    DECIMAL(12,2) NOT NULL,
  special_request TEXT,
  status          ENUM('PENDING','CONFIRMED','CANCELLED','REJECTED','COMPLETED') NOT NULL DEFAULT 'PENDING',
  created_at      TIMESTAMP     NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP     NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY booking_code (booking_code),
  KEY idx_bookings_room_dates (room_id, check_in, check_out),
  KEY idx_bookings_hotel (hotel_id),
  KEY idx_bookings_user (user_id),
  CONSTRAINT bookings_hotel_fk FOREIGN KEY (hotel_id) REFERENCES hotels (id) ON DELETE CASCADE,
  CONSTRAINT bookings_room_fk FOREIGN KEY (room_id) REFERENCES rooms (id) ON DELETE CASCADE,
  CONSTRAINT bookings_user_fk FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Website content
-- ---------------------------------------------------------------------

-- Home page banner slides, managed from Admin -> Hero Slides
CREATE TABLE IF NOT EXISTS hero_slides (
  id         BIGINT       NOT NULL AUTO_INCREMENT,
  image      VARCHAR(500) NOT NULL,
  title      VARCHAR(150) NOT NULL,
  highlight  VARCHAR(60)  DEFAULT NULL,              -- words of the title shown in gold
  subtitle   VARCHAR(255) DEFAULT NULL,
  sort_order INT          NOT NULL DEFAULT 0,
  status     ENUM('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMP    NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP    NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Home page sections built in Admin -> Home Sections ("Navratri Specials", "Popular stays"...),
-- shown on the home page in sort_order, each with the hotels the admin picked
CREATE TABLE IF NOT EXISTS home_sections (
  id         BIGINT       NOT NULL AUTO_INCREMENT,
  title      VARCHAR(150) NOT NULL,
  subtitle   VARCHAR(255) DEFAULT NULL,
  slug       VARCHAR(180) NOT NULL,                  -- "View all" page: /collections/<slug>
  sort_order INT          NOT NULL DEFAULT 0,
  status     ENUM('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMP    NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP    NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- The hotels in each home section, in display order
CREATE TABLE IF NOT EXISTS home_section_hotels (
  section_id BIGINT NOT NULL,
  hotel_id   BIGINT NOT NULL,
  sort_order INT    NOT NULL DEFAULT 0,
  PRIMARY KEY (section_id, hotel_id),
  KEY home_section_hotels_hotel_fk (hotel_id),
  CONSTRAINT home_section_hotels_section_fk FOREIGN KEY (section_id) REFERENCES home_sections (id) ON DELETE CASCADE,
  CONSTRAINT home_section_hotels_hotel_fk FOREIGN KEY (hotel_id) REFERENCES hotels (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Site-wide values edited in Admin -> Settings (e.g. contact_phone, whatsapp_number)
CREATE TABLE IF NOT EXISTS site_settings (
  setting_key VARCHAR(100) NOT NULL,
  value       TEXT         DEFAULT NULL,
  updated_at  TIMESTAMP    NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Messages from the Contact Us page
CREATE TABLE IF NOT EXISTS contact_messages (
  id         BIGINT       NOT NULL AUTO_INCREMENT,
  name       VARCHAR(150) NOT NULL,
  email      VARCHAR(150) NOT NULL,
  phone      VARCHAR(20)  DEFAULT NULL,
  subject    VARCHAR(200) DEFAULT NULL,
  message    TEXT         NOT NULL,
  status     ENUM('NEW','READ','RESPONDED') DEFAULT 'NEW',
  created_at TIMESTAMP    NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- Starter data (only added where it is missing)
-- =====================================================================

-- Facilities, only when the table is empty
INSERT INTO amenities (name, icon)
SELECT t.name, t.icon FROM (
  SELECT 'Free WiFi' AS name, 'fa-wifi' AS icon UNION ALL
  SELECT 'Parking', 'fa-car' UNION ALL
  SELECT 'Restaurant', 'fa-utensils' UNION ALL
  SELECT 'Swimming Pool', 'fa-swimming-pool' UNION ALL
  SELECT 'Air Conditioning', 'fa-snowflake' UNION ALL
  SELECT 'Power Backup', 'fa-bolt' UNION ALL
  SELECT 'Room Service', 'fa-concierge-bell' UNION ALL
  SELECT 'Nature Trails', 'fa-tree' UNION ALL
  SELECT 'Campfire', 'fa-fire' UNION ALL
  SELECT 'CCTV Security', 'fa-video' UNION ALL
  SELECT 'Kids Play Area', 'fa-child' UNION ALL
  SELECT 'Hot Water', 'fa-tint'
) t
WHERE NOT EXISTS (SELECT 1 FROM amenities);

-- Stay types (existing codes are left untouched)
INSERT IGNORE INTO stay_types (code, name, sort_order) VALUES
  ('HOTEL', 'Hotels', 1),
  ('RESORT', 'Resorts', 2),
  ('ECO_LODGE', 'Eco Lodges', 3),
  ('HOMESTAY', 'Homestays', 4),
  ('CAMP', 'Camps & Tents', 5),
  ('GUEST_HOUSE', 'Guest Houses', 6);

-- Hero slides, only when the table is empty. Replace the images from Admin -> Hero Slides.
INSERT INTO hero_slides (image, title, highlight, subtitle, sort_order)
SELECT * FROM (
  SELECT '/home.png' AS image, 'Stay close to nature' AS title, 'nature' AS highlight,
         'Hotels, jungle resorts, eco lodges and homestays — book in minutes, pay at the hotel.' AS subtitle, 1 AS sort_order
  UNION ALL SELECT '/home.png', 'Wake up to waterfalls', 'waterfalls',
         'Riverside resorts near Chitrakote and Tirathgarh, the falls of Bastar.', 2
  UNION ALL SELECT '/home.png', 'Camp under the stars', 'stars',
         'Jungle camps and eco lodges in Barnawapara, Kanger Valley and Achanakmar.', 3
) t
WHERE NOT EXISTS (SELECT 1 FROM hero_slides);

-- One empty home section to start with, only when there are none. Add hotels to it from Admin -> Home Sections.
INSERT INTO home_sections (title, subtitle, slug, sort_order)
SELECT 'Popular stays', 'Handpicked places guests love', 'popular-stays', 1
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM home_sections);

-- Contact numbers for the Call / WhatsApp buttons (set them in Admin -> Settings)
INSERT IGNORE INTO site_settings (setting_key, value) VALUES
  ('contact_phone', NULL),
  ('whatsapp_number', NULL);
