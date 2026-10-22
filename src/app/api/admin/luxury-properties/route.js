import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET() {
  try {
    const query = `
      SELECT
        lp.id, lp.property_id, lp.sort_order, lp.status,
        p.title, p.price, p.city, p.location, p.listing_type,
        p.bedrooms, p.bathrooms, p.area_sqft,
        (SELECT image FROM property_images WHERE property_id = p.id LIMIT 1) as image
      FROM luxury_properties lp
      JOIN properties p ON lp.property_id = p.id
      ORDER BY lp.sort_order ASC, lp.created_at DESC
    `;
    const [data] = await db.query(query);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { property_id, sort_order = 0, status = 'ACTIVE' } = body;

    // 1. Validation: Ensure property_id exists
    if (!property_id) {
      return NextResponse.json({ success: false, error: "property_id is required" }, { status: 400 });
    }

    // 2. Check for conflict
    const [existing] = await db.query(
      "SELECT id FROM luxury_properties WHERE property_id = ?", 
      [property_id]
    );

    if (existing.length > 0) {
      console.warn(`Attempted to add duplicate luxury property: ID ${property_id}`);
      return NextResponse.json(
        { success: false, error: "This property is already in the Luxury list" }, 
        { status: 400 }
      );
    }

    // 3. Insert data
    await db.query(
      "INSERT INTO luxury_properties (property_id, sort_order, status) VALUES (?, ?, ?)", 
      [property_id, sort_order, status]
    );

    return NextResponse.json({ success: true, message: "Added successfully" }, { status: 201 });

  } catch (error) {
    console.error("POST Luxury Property Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error: " + error.message }, 
      { status: 500 }
    );
  }
}