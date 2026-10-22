import { NextResponse } from "next/server";
import db from "@/lib/db";

// ==========================================
// GET: Active home page hero slides, in display order
// ==========================================
export async function GET() {
  try {
    const [slides] = await db.query(
      "SELECT id, image, title, highlight, subtitle FROM hero_slides WHERE status = 'ACTIVE' ORDER BY sort_order, id"
    );
    return NextResponse.json({ success: true, data: slides });
  } catch (error) {
    console.error("GET Hero Slides Error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
