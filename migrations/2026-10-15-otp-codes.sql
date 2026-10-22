-- Stores login / registration / password-reset OTPs in the database instead of server memory,
-- so they keep working when the live server runs several processes or restarts.
-- Run once on every database (local and live) before deploying the code that uses it.
CREATE TABLE IF NOT EXISTS otp_codes (
  otp_key    VARCHAR(191) NOT NULL PRIMARY KEY,  -- e.g. "login:user@example.com"
  otp_hash   CHAR(64)     NOT NULL,              -- sha256 of the 6-digit code
  expires_at DATETIME     NOT NULL,
  sent_at    DATETIME     NOT NULL,
  attempts   INT          NOT NULL DEFAULT 0
);
