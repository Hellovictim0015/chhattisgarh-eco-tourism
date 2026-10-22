import crypto from "crypto";
import db from "@/lib/db";

// OTPs live in the `otp_codes` table (see migrations/2026-10-15-otp-codes.sql), not in memory,
// so they survive restarts and work when the live server runs several processes.
// Only a sha256 hash of each code is stored. All time math uses the database clock (NOW()).

const MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_SECONDS = 60;

const hash = (otp) => crypto.createHash("sha256").update(String(otp)).digest("hex");

export function generateOtp() {
  return crypto.randomInt(100000, 1000000).toString();
}

export async function setOtp(key, otp, ttlMs) {
  const ttlSeconds = Math.round(ttlMs / 1000);
  await db.query(
    `INSERT INTO otp_codes (otp_key, otp_hash, expires_at, sent_at, attempts)
     VALUES (?, ?, NOW() + INTERVAL ? SECOND, NOW(), 0)
     ON DUPLICATE KEY UPDATE
       otp_hash = VALUES(otp_hash), expires_at = VALUES(expires_at), sent_at = VALUES(sent_at), attempts = 0`,
    [key, hash(otp), ttlSeconds]
  );
}

// Seconds the caller must wait before another OTP can be sent for this key (0 = can send now)
export async function resendWaitSeconds(key) {
  const [rows] = await db.query(
    `SELECT GREATEST(0, TIMESTAMPDIFF(SECOND, NOW(), sent_at + INTERVAL ? SECOND)) AS wait
     FROM otp_codes WHERE otp_key = ? AND expires_at > NOW()`,
    [RESEND_COOLDOWN_SECONDS, key]
  );
  return rows.length ? Number(rows[0].wait) : 0;
}

export async function verifyOtp(key, otp) {
  const [rows] = await db.query(
    "SELECT otp_hash, attempts, expires_at > NOW() AS valid FROM otp_codes WHERE otp_key = ?",
    [key]
  );
  if (rows.length === 0) return false;
  const entry = rows[0];

  if (!entry.valid) {
    await db.query("DELETE FROM otp_codes WHERE otp_key = ?", [key]);
    return false;
  }

  if (entry.otp_hash !== hash(otp)) {
    // Too many wrong guesses: burn this OTP so it can't be brute-forced
    if (entry.attempts + 1 >= MAX_ATTEMPTS) await db.query("DELETE FROM otp_codes WHERE otp_key = ?", [key]);
    else await db.query("UPDATE otp_codes SET attempts = attempts + 1 WHERE otp_key = ?", [key]);
    return false;
  }

  await db.query("DELETE FROM otp_codes WHERE otp_key = ?", [key]);
  return true;
}

// Removes a pending OTP (e.g. when the email could not be sent, so the user can retry immediately)
export async function clearOtp(key) {
  await db.query("DELETE FROM otp_codes WHERE otp_key = ?", [key]);
}
