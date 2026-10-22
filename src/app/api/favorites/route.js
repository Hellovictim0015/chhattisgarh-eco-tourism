import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

// ==========================================
// GET: List the logged-in user's favorited properties
// ==========================================
export async function GET(req) {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const [favorites] = await db.query(
      `SELECT
        f.id AS favorite_id, f.created_at AS favorited_at,
        p.id, p.title, p.city, p.location, p.price, p.listing_type, p.property_type,
        p.property_sub_type, p.bedrooms, p.bathrooms, p.area_sqft, p.status,
        (SELECT image FROM property_images WHERE property_id = p.id LIMIT 1) as image
      FROM favorites f
      JOIN properties p ON f.property_id = p.id
      WHERE f.user_id = ? AND p.status = 'ACTIVE'
      ORDER BY f.created_at DESC`,
      [user.id]
    );

    return NextResponse.json({ success: true, data: favorites });
  } catch (error) {
    console.error("GET Favorites Error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

// ==========================================
// POST: Add a property to favorites
// ==========================================
export async function POST(req) {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { property_id } = await req.json();
    if (!property_id) {
      return NextResponse.json({ success: false, error: "property_id is required" }, { status: 400 });
    }

    await db.query(
      "INSERT IGNORE INTO favorites (user_id, property_id) VALUES (?, ?)",
      [user.id, property_id]
    );

    return NextResponse.json({ success: true, message: "Added to favorites" }, { status: 201 });
  } catch (error) {
    console.error("POST Favorite Error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
