import { NextResponse } from "next/server";
import db from "@/lib/db";
import jwt from "jsonwebtoken";
import { generateOtp, setOtp, verifyOtp, resendWaitSeconds, clearOtp } from "@/lib/otpStore";
import { sendOtpEmail } from "@/lib/nodemailer";
import { insertUser } from "@/lib/usersSchema";

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[6-9]\d{9}$/;

// Returns an error message if the email or phone is already taken, else null
async function findConflict(email, phone) {
  const [rows] = await db.query("SELECT email, phone FROM users WHERE email = ? OR phone = ?", [email, phone]);
  if (rows.some((r) => r.email && r.email.toLowerCase() === email)) return "This email is already registered. Please login instead.";
  if (rows.some((r) => r.phone === phone)) return "This phone number is already registered.";
  return null;
}

// Two-step email OTP registration:
//   1. { name, email, phone }       -> validates and emails a 6-digit OTP
//   2. { name, email, phone, otp }  -> verifies it, creates the user and returns a JWT
export async function POST(req) {
  let stage = "start";
  try {
    const body = await req.json();
    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const phone = String(body.phone || "").replace(/\D/g, "");
    const otp = body.otp ? String(body.otp).trim() : "";
    stage = otp ? "verify" : "send";

    if (!name || !email || !phone) {
      return NextResponse.json({ success: false, message: "Name, email and phone are required" }, { status: 400 });
    }
    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({ success: false, message: "Please enter a valid email address" }, { status: 400 });
    }
    if (!PHONE_RE.test(phone)) {
      return NextResponse.json({ success: false, message: "Please enter a valid 10-digit mobile number" }, { status: 400 });
    }

    const otpKey = `register:${email}`;

    // ==========================================
    // STEP 2: Verify OTP and create the account
    // ==========================================
    if (otp) {
      const isValid = await verifyOtp(otpKey, otp);
      if (!isValid) {
        return NextResponse.json({ success: false, message: "Invalid or expired OTP. Please request a new one." }, { status: 400 });
      }

      const conflict = await findConflict(email, phone);
      if (conflict) {
        return NextResponse.json({ success: false, message: conflict }, { status: 400 });
      }

      // insertUser adapts to the users table's real columns (they differ between local and live)
      const { id: userId, role } = await insertUser({ name, email, phone });

      const token = jwt.sign({ id: userId, role }, process.env.JWT_SECRET, { expiresIn: "24h" });

      const response = NextResponse.json({
        success: true,
        message: "Registered successfully!",
        token,
        user: { id: userId, name, email, phone, role },
      });

      response.cookies.set("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 86400,
      });

      return response;
    }

    // ==========================================
    // STEP 1: Validate details and email the OTP
    // ==========================================
    const conflict = await findConflict(email, phone);
    if (conflict) {
      return NextResponse.json({ success: false, message: conflict }, { status: 400 });
    }

    const wait = await resendWaitSeconds(otpKey);
    if (wait > 0) {
      return NextResponse.json({ success: false, message: `Please wait ${wait} seconds before requesting a new OTP.`, retryAfter: wait }, { status: 429 });
    }

    const generatedOtp = generateOtp();
    await setOtp(otpKey, generatedOtp, OTP_TTL_MS);
    try {
      await sendOtpEmail(email, generatedOtp, "register");
    } catch (mailError) {
      await clearOtp(otpKey);
      throw mailError;
    }

    return NextResponse.json({ success: true, message: `OTP sent to ${email}` });
  } catch (error) {
    console.error(`Register Error (${stage}):`, error);
    const msg =
      error.code === "ER_DUP_ENTRY" ? "This email or phone number is already registered."
      : stage === "send" ? "Could not send OTP right now. Please try again."
      : "Could not create your account right now. Please try again.";
    // `code` (e.g. ER_NO_DEFAULT_FOR_FIELD, EAUTH) helps diagnose live-server issues without exposing details
    return NextResponse.json({ success: false, message: msg, code: error.code || null }, { status: 500 });
  }
}
