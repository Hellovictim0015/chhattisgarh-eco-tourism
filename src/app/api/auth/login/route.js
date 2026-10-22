import { NextResponse } from "next/server";
import db from "@/lib/db";
import jwt from "jsonwebtoken";
import { generateOtp, setOtp, verifyOtp, resendWaitSeconds, clearOtp } from "@/lib/otpStore";
import { sendOtpEmail } from "@/lib/nodemailer";
import { isUserActive } from "@/lib/usersSchema";

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes

// Two-step email OTP login:
//   1. { email }        -> emails a 6-digit OTP
//   2. { email, otp }   -> verifies it and returns a JWT
export async function POST(req) {
  let stage = "start";
  try {
    const body = await req.json();
    const email = String(body.email || "").trim().toLowerCase();
    const otp = body.otp ? String(body.otp).trim() : "";
    stage = otp ? "verify" : "send";

    if (!email) {
      return NextResponse.json({ success: false, error: "Email is required" }, { status: 400 });
    }

    const [users] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
    if (users.length === 0) {
      return NextResponse.json({ success: false, error: "No account found with this email. Please register first." }, { status: 404 });
    }
    const user = users[0];

    if (!isUserActive(user)) {
      return NextResponse.json({ success: false, error: "This account has been deactivated. Please contact support." }, { status: 403 });
    }

    const otpKey = `login:${email}`;

    // ==========================================
    // STEP 2: Verify OTP and log in
    // ==========================================
    if (otp) {
      const isValid = await verifyOtp(otpKey, otp);
      if (!isValid) {
        return NextResponse.json({ success: false, error: "Invalid or expired OTP. Please request a new one." }, { status: 400 });
      }

      const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "24h" });

      const response = NextResponse.json({
        success: true,
        message: "Login successful",
        token,
        user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role },
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
    // STEP 1: Email the OTP
    // ==========================================
    const wait = await resendWaitSeconds(otpKey);
    if (wait > 0) {
      return NextResponse.json({ success: false, error: `Please wait ${wait} seconds before requesting a new OTP.`, retryAfter: wait }, { status: 429 });
    }

    const generatedOtp = generateOtp();
    await setOtp(otpKey, generatedOtp, OTP_TTL_MS);
    try {
      await sendOtpEmail(email, generatedOtp, "login");
    } catch (mailError) {
      await clearOtp(otpKey);
      throw mailError;
    }

    return NextResponse.json({ success: true, message: `OTP sent to ${email}` });
  } catch (error) {
    console.error(`Login Error (${stage}):`, error);
    const msg =
      error.code === "ER_DUP_ENTRY" ? "This email or phone number is already registered."
      : stage === "send" ? "Could not send OTP right now. Please try again."
      : "Could not log you in right now. Please try again.";
    // `code` (e.g. ER_NO_DEFAULT_FOR_FIELD, EAUTH) helps diagnose live-server issues without exposing details
    return NextResponse.json({ success: false, error: msg, code: error.code || null }, { status: 500 });
  }
}
