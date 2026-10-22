import { NextResponse } from "next/server";
import db from "@/lib/db";

// ==========================================
// GET: List all leads (logged-in users who viewed a property)
// ==========================================
export async function GET() {
  try {
    const [leads] = await db.query(
      `SELECT
        pl.id, pl.view_count, pl.last_viewed_at, pl.created_at,
        u.id AS user_id, u.name AS user_name, u.phone AS user_phone, u.email AS user_email,
        p.id AS property_id, p.title AS property_title, p.price, p.listing_type, p.status AS property_status,
        (SELECT image FROM property_images WHERE property_id = p.id LIMIT 1) as image
      FROM property_leads pl
      JOIN users u ON pl.user_id = u.id
      JOIN properties p ON pl.property_id = p.id
      ORDER BY pl.last_viewed_at DESC`
    );

    return NextResponse.json({ success: true, data: leads });
  } catch (error) {
    console.error("GET Admin Leads Error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
