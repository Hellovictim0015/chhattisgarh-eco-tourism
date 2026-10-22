import { NextResponse } from "next/server";
import db from "@/lib/db";

// ==========================================
// DELETE: Remove a featured property
// ==========================================
export async function DELETE(req, { params }) {
  try {
    const { id } = await params;

    const [result] = await db.query("DELETE FROM latest_featured_properties WHERE id = ?", [id]);

    if (result.affectedRows === 0) {
      return NextResponse.json({ success: false, error: "Featured property not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Removed from featured properties",
    }, { status: 200 });

  } catch (error) {
    console.error("DELETE Featured Property Error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

// ==========================================
// PUT: Update Sort Order or Status
// ==========================================
export async function PUT(req, { params }) {
  try {
    const { id } = await params;
    const { sort_order, status } = await req.json();

    const query = "UPDATE latest_featured_properties SET sort_order = ?, status = ? WHERE id = ?";
    await db.query(query, [sort_order, status, id]);

    return NextResponse.json({
      success: true,
      message: "Featured property updated successfully",
    }, { status: 200 });

  } catch (error) {
    console.error("PUT Featured Property Error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}