import { NextResponse } from "next/server";
import db from "@/lib/db";

// ==========================================
// PUT: Update inquiry status (NEW / CONTACTED / SITE_VISIT / CLOSED)
// ==========================================
export async function PUT(req, { params }) {
  try {
    const { id } = await params;
    const { status } = await req.json();

    if (!status) {
      return NextResponse.json({ success: false, error: "Status is required" }, { status: 400 });
    }

    await db.query("UPDATE property_inquiries SET status = ? WHERE id = ?", [status, id]);

    return NextResponse.json({ success: true, message: "Status updated" });
  } catch (error) {
    console.error("PUT Admin Inquiry Error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
