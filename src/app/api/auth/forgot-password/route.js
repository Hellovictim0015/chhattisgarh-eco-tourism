import { NextResponse } from "next/server";
import db from "@/lib/db";
import { transporter } from "@/lib/nodemailer";
import { setOtp } from "@/lib/otpStore";

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes

export async function POST(req) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ success: false, message: "Email is required" }, { status: 400 });
    }

    const [users] = await db.query("SELECT id FROM users WHERE email = ?", [email]);
    if (users.length === 0) {
      return NextResponse.json({ success: false, message: "No account found with this email" }, { status: 404 });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await setOtp(`reset:${email}`, otp, OTP_TTL_MS);

    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: email,
      subject: "Your Password Reset OTP",
      text: `Your OTP to reset your password is ${otp}. It is valid for 10 minutes. If you did not request this, please ignore this email.`,
    });

    return NextResponse.json({ success: true, message: "OTP sent to your email" });
  } catch (error) {
    console.error("Forgot Password Error:", error);
    return NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 });
  }
}
