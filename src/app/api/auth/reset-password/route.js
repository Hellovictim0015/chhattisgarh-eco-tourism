import { NextResponse } from "next/server";
import db from "@/lib/db";
import bcrypt from "bcryptjs";
import { verifyOtp } from "@/lib/otpStore";

export async function POST(req) {
  try {
    const { email, otp, newPassword } = await req.json();

    if (!email || !otp || !newPassword) {
      return NextResponse.json(
        { success: false, message: "Email, OTP, and new password are required" },
        { status: 400 }
      );
    }
    if (newPassword.length < 6) {
      return NextResponse.json(
        { success: false, message: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const isValid = await verifyOtp(`reset:${email}`, otp);
    if (!isValid) {
      return NextResponse.json(
        { success: false, message: "Invalid or expired OTP. Please request a new one." },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const [result] = await db.query("UPDATE users SET password = ? WHERE email = ?", [hashedPassword, email]);

    if (result.affectedRows === 0) {
      return NextResponse.json({ success: false, message: "No account found with this email" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Password reset successfully. Please login with your new password." });
  } catch (error) {
    console.error("Reset Password Error:", error);
    return NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 });
  }
}
