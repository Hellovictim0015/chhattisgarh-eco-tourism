import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET() {
  try {
    const query = `
      SELECT
        trp.id, trp.property_id, trp.sort_order, trp.status,
        p.title, p.price, p.city, p.location, p.listing_type,
        p.bedrooms, p.bathrooms, p.area_sqft,
        (SELECT image FROM property_images WHERE property_id = p.id LIMIT 1) as image
      FROM top_residential_projects trp
      JOIN properties p ON trp.property_id = p.id
      ORDER BY trp.sort_order ASC, trp.created_at DESC
    `;
    const [data] = await db.query(query);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { property_id, sort_order = 0, status = 'ACTIVE' } = await req.json();
    
    // Check for existing to prevent duplicate entries
    const [existing] = await db.query("SELECT id FROM top_residential_projects WHERE property_id = ?", [property_id]);
    if (existing.length > 0) return NextResponse.json({ success: false, error: "Already added to Top Residential Projects" }, { status: 400 });

    await db.query(
      "INSERT INTO top_residential_projects (property_id, sort_order, status) VALUES (?, ?, ?)", 
      [property_id, sort_order, status]
    );
    return NextResponse.json({ success: true, message: "Added successfully" }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}