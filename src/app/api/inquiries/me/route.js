import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

// ==========================================
// GET: The logged-in user's own inquiries, with property info
// ==========================================
export async function GET(req) {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const [inquiries] = await db.query(
      `SELECT
        i.id, i.message, i.status, i.created_at,
        p.id AS property_id, p.title AS property_title, p.price, p.listing_type,
        (SELECT image FROM property_images WHERE property_id = p.id LIMIT 1) as image
      FROM property_inquiries i
      JOIN properties p ON i.property_id = p.id
      WHERE i.user_id = ?
      ORDER BY i.created_at DESC`,
      [user.id]
    );

    return NextResponse.json({ success: true, data: inquiries });
  } catch (error) {
    console.error("GET My Inquiries Error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
