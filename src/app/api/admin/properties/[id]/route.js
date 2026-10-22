import { NextResponse } from "next/server";
import db from "@/lib/db";

// ==========================================
// 1. GET BY ID: Fetch a single property
// ==========================================
export async function GET(req, { params }) {
  try {
    // Await params if you are using Next.js 15+
    const { id } = await params;

    const [properties] = await db.query(
      "SELECT * FROM properties WHERE id = ?",
      [id]
    );

    if (properties.length === 0) {
      return NextResponse.json({ success: false, error: "Property not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: properties[0],
    }, { status: 200 });

  } catch (error) {
    console.error("GET By ID Error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

// ==========================================
// 2. PUT: Update a property
// ==========================================
export async function PUT(req, { params }) {
  try {
    const { id } = await params;
    const body = await req.json(); 

    const { status } = body;

    // Validate that a status was actually provided
    if (!status) {
      return NextResponse.json({ success: false, error: "Status is required to update" }, { status: 400 });
    }

    // Check if the property exists first
    const [existing] = await db.query("SELECT id FROM properties WHERE id = ?", [id]);
    if (existing.length === 0) {
      return NextResponse.json({ success: false, error: "Property not found" }, { status: 404 });
    }

    // Hardcode the query to update ONLY the status
    const query = "UPDATE properties SET status = ?, updated_at = NOW() WHERE id = ?";
    await db.query(query, [status, id]);

    // Fetch the updated property to return it
    const [updatedProperty] = await db.query("SELECT * FROM properties WHERE id = ?", [id]);

    return NextResponse.json({
      success: true,
      message: "Property status updated successfully",
      data: updatedProperty[0]
    }, { status: 200 });

  } catch (error) {
    console.error("PUT Error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

// ==========================================
// 3. DELETE: Remove a property
// ==========================================
export async function DELETE(req, { params }) {
  try {
    const { id } = await params;

    // Optional: Check if it exists before deleting
    const [existing] = await db.query("SELECT id FROM properties WHERE id = ?", [id]);
    if (existing.length === 0) {
      return NextResponse.json({ success: false, error: "Property not found" }, { status: 404 });
    }

    // Note: If your database uses foreign keys with "ON DELETE CASCADE", 
    // this will automatically delete related images, plans, and amenities.
    // If not, you may need to manually delete those related records first:
    // await db.query("DELETE FROM property_images WHERE property_id = ?", [id]);
    // await db.query("DELETE FROM property_amenities WHERE property_id = ?", [id]);

    await db.query("DELETE FROM properties WHERE id = ?", [id]);

    return NextResponse.json({
      success: true,
      message: "Property deleted successfully"
    }, { status: 200 });

  } catch (error) {
    console.error("DELETE Error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}