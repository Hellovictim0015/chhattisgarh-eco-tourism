import { NextResponse } from "next/server";
import db from "@/lib/db";
import { sectionHotels } from "@/lib/homeSections";

// ==========================================
// GET: One active section with all of its live hotels (the "View all" page)
// ==========================================
export async function GET(req, { params }) {
  try {
    const { slug } = await params;
    const [[section]] = await db.query(
      "SELECT id, title, subtitle, slug FROM home_sections WHERE slug = ? AND status = 'ACTIVE'",
      [slug]
    );
    if (!section) return NextResponse.json({ success: false, error: "Section not found" }, { status: 404 });
    const hotels = await sectionHotels([section.id]);
    return NextResponse.json({ success: true, data: { ...section, hotels: hotels.get(Number(section.id)) } });
  } catch (error) {
    console.error("GET Home Section Error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
