import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getAdminFromRequest } from "@/lib/hotels";
import { sectionHotels, readSectionBody, setSectionHotels, uniqueSlug } from "@/lib/homeSections";

const unauthorized = () => NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

// ==========================================
// GET: All sections in display order, each with all its hotels (any status)
// ==========================================
export async function GET(req) {
  try {
    if (!getAdminFromRequest(req)) return unauthorized();
    const [sections] = await db.query("SELECT * FROM home_sections ORDER BY sort_order, id");
    const hotels = await sectionHotels(sections.map((s) => s.id), { activeOnly: false });
    return NextResponse.json({ success: true, data: sections.map((s) => ({ ...s, hotels: hotels.get(Number(s.id)) })) });
  } catch (error) {
    console.error("GET Admin Home Sections Error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

// ==========================================
// POST: Create a section at the bottom of the page.  { title, subtitle, status, hotel_ids: [ordered] }
// ==========================================
export async function POST(req) {
  let conn;
  try {
    if (!getAdminFromRequest(req)) return unauthorized();
    const body = readSectionBody(await req.json());
    if (body.error) return NextResponse.json({ success: false, error: body.error }, { status: 400 });

    const { title, subtitle, status } = body.fields;
    const slug = await uniqueSlug(title);
    conn = await db.getConnection();
    await conn.beginTransaction();
    const [[{ next }]] = await conn.query("SELECT COALESCE(MAX(sort_order), 0) + 1 AS next FROM home_sections");
    const [res] = await conn.query(
      "INSERT INTO home_sections (title, subtitle, slug, sort_order, status) VALUES (?, ?, ?, ?, ?)",
      [title, subtitle, slug, next, status]
    );
    await setSectionHotels(conn, res.insertId, body.hotelIds);
    await conn.commit();
    return NextResponse.json({ success: true, message: "Section created", id: res.insertId }, { status: 201 });
  } catch (error) {
    if (conn) await conn.rollback().catch(() => {});
    console.error("POST Admin Home Section Error:", error);
    return NextResponse.json({ success: false, error: "Could not save section" }, { status: 500 });
  } finally {
    if (conn) conn.release();
  }
}
