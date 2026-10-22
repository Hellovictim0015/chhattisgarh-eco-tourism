import { NextResponse } from "next/server";
import db from "@/lib/db";

// ==========================================
// POST: Public contact form submission
// ==========================================
export async function POST(req) {
  try {
    const { name, email, phone, subject, message } = await req.json();

    if (!name || !email || !message) {
      return NextResponse.json(
        { success: false, message: "Name, email, and message are required" },
        { status: 400 }
      );
    }

    await db.query(
      "INSERT INTO contact_messages (name, email, phone, subject, message) VALUES (?, ?, ?, ?, ?)",
      [name, email, phone || null, subject || null, message]
    );

    return NextResponse.json({
      success: true,
      message: "Thank you for reaching out. We'll get back to you soon.",
    });
  } catch (error) {
    console.error("Contact Form Error:", error);
    return NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 });
  }
}
