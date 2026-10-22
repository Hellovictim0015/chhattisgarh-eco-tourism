-- Hotel booking system: hotels (listed by admin or hotel owners), their room types, and guest bookings.
-- Reuses the existing `amenities` table for hotel facilities.
-- Run once on every database (local and live) before deploying the code that uses it.

CREATE TABLE IF NOT EXISTS hotels (
  id             BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id        BIGINT       NULL,                         -- owner; NULL when added by admin
  name           VARCHAR(255) NOT NULL,
  hotel_type     VARCHAR(50)  NOT NULL DEFAULT 'HOTEL',     -- HOTEL / RESORT / ECO_LODGE / HOMESTAY / CAMP / GUEST_HOUSE
  description    LONGTEXT     NULL,
  city           VARCHAR(100) NULL,
  address        VARCHAR(255) NULL,
  star_rating    TINYINT      NULL,
  phone          VARCHAR(20)  NULL,
  email          VARCHAR(150) NULL,
  check_in_time  VARCHAR(10)  NOT NULL DEFAULT '12:00',
  check_out_time VARCHAR(10)  NOT NULL DEFAULT '11:00',
  policies       TEXT         NULL,
  status         ENUM('ACTIVE','PENDING','INACTIVE') NOT NULL DEFAULT 'PENDING',
  is_featured    TINYINT(1)   NOT NULL DEFAULT 0,
  views          INT          NOT NULL DEFAULT 0,
  created_at     TIMESTAMP    NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP    NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_hotels_status (status),
  KEY idx_hotels_city (city),
  KEY idx_hotels_user (user_id),
  CONSTRAINT hotels_user_fk FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS hotel_images (
  id         BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
  hotel_id   BIGINT       NOT NULL,
  image      VARCHAR(500) NOT NULL,
  sort_order INT          NOT NULL DEFAULT 0,
  created_at TIMESTAMP    NULL DEFAULT CURRENT_TIMESTAMP,
  KEY hotel_id (hotel_id),
  CONSTRAINT hotel_images_hotel_fk FOREIGN KEY (hotel_id) REFERENCES hotels (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS hotel_amenities (
  hotel_id   BIGINT NOT NULL,
  amenity_id BIGINT NOT NULL,
  PRIMARY KEY (hotel_id, amenity_id),
  CONSTRAINT hotel_amenities_hotel_fk FOREIGN KEY (hotel_id) REFERENCES hotels (id) ON DELETE CASCADE,
  CONSTRAINT hotel_amenities_amenity_fk FOREIGN KEY (amenity_id) REFERENCES amenities (id) ON DELETE CASCADE
);

-- A room type (e.g. "Deluxe Cottage") with how many identical rooms of it the hotel has.
CREATE TABLE IF NOT EXISTS rooms (
  id              BIGINT        NOT NULL AUTO_INCREMENT PRIMARY KEY,
  hotel_id        BIGINT        NOT NULL,
  name            VARCHAR(150)  NOT NULL,
  description     TEXT          NULL,
  price_per_night DECIMAL(10,2) NOT NULL,
  max_guests      INT           NOT NULL DEFAULT 2,
  total_rooms     INT           NOT NULL DEFAULT 1,
  bed_type        VARCHAR(50)   NULL,
  image           VARCHAR(500)  NULL,
  status          ENUM('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  created_at      TIMESTAMP     NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP     NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY hotel_id (hotel_id),
  CONSTRAINT rooms_hotel_fk FOREIGN KEY (hotel_id) REFERENCES hotels (id) ON DELETE CASCADE
);

-- PENDING and CONFIRMED bookings hold rooms; CANCELLED / REJECTED free them.
CREATE TABLE IF NOT EXISTS bookings (
  id           BIGINT        NOT NULL AUTO_INCREMENT PRIMARY KEY,
  booking_code VARCHAR(20)   NOT NULL,
  hotel_id     BIGINT        NOT NULL,
  room_id      BIGINT        NOT NULL,
  user_id      BIGINT        NULL,
  guest_name   VARCHAR(150)  NOT NULL,
  guest_email  VARCHAR(150)  NULL,
  guest_phone  VARCHAR(20)   NOT NULL,
  check_in     DATE          NOT NULL,
  check_out    DATE          NOT NULL,
  rooms_count  INT           NOT NULL DEFAULT 1,
  guests       INT           NOT NULL DEFAULT 1,
  nights       INT           NOT NULL,
  total_amount DECIMAL(12,2) NOT NULL,
  special_request TEXT       NULL,
  status       ENUM('PENDING','CONFIRMED','CANCELLED','REJECTED','COMPLETED') NOT NULL DEFAULT 'PENDING',
  created_at   TIMESTAMP     NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP     NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY booking_code (booking_code),
  KEY idx_bookings_room_dates (room_id, check_in, check_out),
  KEY idx_bookings_hotel (hotel_id),
  KEY idx_bookings_user (user_id),
  CONSTRAINT bookings_hotel_fk FOREIGN KEY (hotel_id) REFERENCES hotels (id) ON DELETE CASCADE,
  CONSTRAINT bookings_room_fk FOREIGN KEY (room_id) REFERENCES rooms (id) ON DELETE CASCADE,
  CONSTRAINT bookings_user_fk FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
);

-- Common hotel facilities, only when no amenities exist yet.
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
