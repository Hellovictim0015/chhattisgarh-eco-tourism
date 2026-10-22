import { NextResponse } from "next/server";
import db from "@/lib/db";

// ==========================================
// GET: Active amenities, for the hotel forms
// ==========================================
export async function GET() {
  try {
    const [amenities] = await db.query("SELECT id, name, icon FROM amenities WHERE status = 'ACTIVE' ORDER BY name");
    return NextResponse.json({ success: true, data: amenities });
  } catch (error) {
    console.error("GET Amenities Error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
