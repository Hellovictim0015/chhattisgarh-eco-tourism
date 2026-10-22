import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

// ==========================================
// DELETE: Remove a property from favorites
// ==========================================
export async function DELETE(req, { params }) {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { propertyId } = await params;
    await db.query("DELETE FROM favorites WHERE user_id = ? AND property_id = ?", [user.id, propertyId]);

    return NextResponse.json({ success: true, message: "Removed from favorites" });
  } catch (error) {
    console.error("DELETE Favorite Error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
