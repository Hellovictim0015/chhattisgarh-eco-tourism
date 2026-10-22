-- Home page hero banner slides (image + heading + subtitle), managed from the admin panel.
-- The banner auto-scrolls through the ACTIVE slides in sort_order.
-- Run once on every database (local and live).

CREATE TABLE IF NOT EXISTS hero_slides (
  id         BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
  image      VARCHAR(500) NOT NULL,
  title      VARCHAR(150) NOT NULL,
  highlight  VARCHAR(60)  NULL,     -- a word/phrase of the title shown in the accent colour
  subtitle   VARCHAR(255) NULL,
  sort_order INT          NOT NULL DEFAULT 0,
  status     ENUM('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMP    NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP    NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Starting slides, only when the table is empty
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
