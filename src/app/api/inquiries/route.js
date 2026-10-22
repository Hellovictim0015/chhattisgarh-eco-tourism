import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

// ==========================================
// POST: Submit an inquiry for a property.
// Public — but auto-tags the logged-in user if a valid token is present,
// so it shows up in their "My Inquiries" list.
// ==========================================
export async function POST(req) {
  try {
    const { property_id, name, email, phone, message } = await req.json();

    if (!property_id || !name || !phone) {
      return NextResponse.json(
        { success: false, message: "property_id, name, and phone are required" },
        { status: 400 }
      );
    }

    const user = getUserFromRequest(req);

    await db.query(
      "INSERT INTO property_inquiries (property_id, user_id, name, email, phone, message) VALUES (?, ?, ?, ?, ?, ?)",
      [property_id, user?.id || null, name, email || null, phone, message || null]
    );

    return NextResponse.json({
      success: true,
      message: "Your inquiry has been sent. The team will get back to you soon.",
    });
  } catch (error) {
    console.error("POST Inquiry Error:", error);
    return NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 });
  }
}
