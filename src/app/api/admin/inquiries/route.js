import { NextResponse } from "next/server";
import db from "@/lib/db";

// ==========================================
// GET: List all property inquiries (from web contact forms and the mobile app)
// ==========================================
export async function GET() {
  try {
    const [inquiries] = await db.query(
      `SELECT
        i.id, i.name, i.email, i.phone, i.message, i.status, i.created_at,
        u.id AS user_id, u.name AS user_name,
        p.id AS property_id, p.title AS property_title,
        (SELECT image FROM property_images WHERE property_id = p.id LIMIT 1) as image
      FROM property_inquiries i
      JOIN properties p ON i.property_id = p.id
      LEFT JOIN users u ON i.user_id = u.id
      ORDER BY i.created_at DESC`
    );

    return NextResponse.json({ success: true, data: inquiries });
  } catch (error) {
    console.error("GET Admin Inquiries Error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
