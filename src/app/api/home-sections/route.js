import { NextResponse } from "next/server";
import db from "@/lib/db";
import { sectionHotels } from "@/lib/homeSections";

const PER_SECTION = 8;

// ==========================================
// GET: Active home page sections in order, each with its first few live hotels.
// Sections with no live hotels are left out.
// ==========================================
export async function GET() {
  try {
    const [sections] = await db.query(
      "SELECT id, title, subtitle, slug FROM home_sections WHERE status = 'ACTIVE' ORDER BY sort_order, id"
    );
    const hotels = await sectionHotels(sections.map((s) => s.id), { limit: PER_SECTION });
    const [counts] = sections.length
      ? await db.query(
          `SELECT x.section_id, COUNT(*) AS n FROM home_section_hotels x JOIN hotels h ON h.id = x.hotel_id
           WHERE x.section_id IN (?) AND h.status = 'ACTIVE' GROUP BY x.section_id`,
          [sections.map((s) => s.id)]
        )
      : [[]];
    const total = new Map(counts.map((c) => [Number(c.section_id), Number(c.n)]));

    const data = sections
      .map((s) => ({ ...s, hotels: hotels.get(Number(s.id)), total_hotels: total.get(Number(s.id)) || 0 }))
      .filter((s) => s.hotels.length > 0);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("GET Home Sections Error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
