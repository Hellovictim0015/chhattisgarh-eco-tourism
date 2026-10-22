import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getAdminFromRequest } from "@/lib/hotels";
import { readSectionBody, setSectionHotels } from "@/lib/homeSections";

const unauthorized = () => NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

// ==========================================
// PUT: Update title / subtitle / status and the ordered hotel list.
// The slug stays the same so shared "View all" links keep working.
// ==========================================
export async function PUT(req, { params }) {
  let conn;
  try {
    if (!getAdminFromRequest(req)) return unauthorized();
    const { id } = await params;
    const body = readSectionBody(await req.json());
    if (body.error) return NextResponse.json({ success: false, error: body.error }, { status: 400 });

    conn = await db.getConnection();
    await conn.beginTransaction();
    const { title, subtitle, status } = body.fields;
    const [res] = await conn.query("UPDATE home_sections SET title = ?, subtitle = ?, status = ? WHERE id = ?", [title, subtitle, status, id]);
    if (res.affectedRows === 0) {
      await conn.rollback();
      return NextResponse.json({ success: false, error: "Section not found" }, { status: 404 });
    }
    await setSectionHotels(conn, Number(id), body.hotelIds);
    await conn.commit();
    return NextResponse.json({ success: true, message: "Section updated" });
  } catch (error) {
    if (conn) await conn.rollback().catch(() => {});
    console.error("PUT Admin Home Section Error:", error);
    return NextResponse.json({ success: false, error: "Could not save section" }, { status: 500 });
  } finally {
    if (conn) conn.release();
  }
}

// ==========================================
// DELETE: Remove a section (its hotels are not touched)
// ==========================================
export async function DELETE(req, { params }) {
  try {
    if (!getAdminFromRequest(req)) return unauthorized();
    const { id } = await params;
    const [res] = await db.query("DELETE FROM home_sections WHERE id = ?", [id]);
    if (res.affectedRows === 0) return NextResponse.json({ success: false, error: "Section not found" }, { status: 404 });
    return NextResponse.json({ success: true, message: "Section deleted" });
  } catch (error) {
    console.error("DELETE Admin Home Section Error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
