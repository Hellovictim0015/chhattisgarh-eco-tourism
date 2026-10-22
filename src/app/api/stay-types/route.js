import { NextResponse } from "next/server";
import db from "@/lib/db";

// ==========================================
// GET: Active stay types in display order, with how many live hotels each has
// ==========================================
export async function GET() {
  try {
    const [types] = await db.query(
      `SELECT t.id, t.code, t.name, t.image,
        (SELECT COUNT(*) FROM hotels h WHERE h.hotel_type = t.code AND h.status = 'ACTIVE') AS hotel_count
       FROM stay_types t WHERE t.status = 'ACTIVE' ORDER BY t.sort_order, t.name`
    );
    return NextResponse.json({ success: true, data: types });
  } catch (error) {
    console.error("GET Stay Types Error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
