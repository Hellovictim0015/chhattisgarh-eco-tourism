import { NextResponse } from "next/server";
import db from "@/lib/db";

// ==========================================
// GET: Fetch Featured Properties (with Title, Price, Image)
// ==========================================
export async function GET() {
  try {
    const query = `
      SELECT
        lfp.id,
        lfp.property_id,
        lfp.sort_order,
        lfp.status,
        p.title,
        p.price,
        p.city,
        p.location,
        p.listing_type,
        p.bedrooms,
        p.bathrooms,
        p.area_sqft,
        (SELECT image FROM property_images WHERE property_id = p.id LIMIT 1) as image
      FROM latest_featured_properties lfp
      JOIN properties p ON lfp.property_id = p.id
      ORDER BY lfp.sort_order ASC, lfp.created_at DESC
    `;

    const [featuredProperties] = await db.query(query);

    return NextResponse.json({
      success: true,
      data: featuredProperties,
    }, { status: 200 });

  } catch (error) {
    console.error("GET Featured Properties Error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

// ==========================================
// POST: Add a new Featured Property
// ==========================================
export async function POST(req) {
  try {
    const body = await req.json();
    const { property_id, sort_order = 0, status = 'ACTIVE' } = body;

    if (!property_id) {
      return NextResponse.json({ success: false, error: "property_id is required" }, { status: 400 });
    }

    // Check if it's already featured to prevent duplicates
    const [existing] = await db.query("SELECT id FROM latest_featured_properties WHERE property_id = ?", [property_id]);
    if (existing.length > 0) {
      return NextResponse.json({ success: false, error: "Property is already featured" }, { status: 400 });
    }

    const query = "INSERT INTO latest_featured_properties (property_id, sort_order, status) VALUES (?, ?, ?)";
    await db.query(query, [property_id, sort_order, status]);

    return NextResponse.json({
      success: true,
      message: "Property featured successfully",
    }, { status: 201 });

  } catch (error) {
    console.error("POST Featured Property Error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}