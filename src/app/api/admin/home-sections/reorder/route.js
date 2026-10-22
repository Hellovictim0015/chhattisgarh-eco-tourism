import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getAdminFromRequest } from "@/lib/hotels";

// ==========================================
// PUT: Set the order of sections on the home page.  { ids: [sectionId, ...] } top to bottom
// ==========================================
export async function PUT(req) {
  try {
    if (!getAdminFromRequest(req)) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    const { ids } = await req.json();
    if (!Array.isArray(ids) || !ids.length) return NextResponse.json({ success: false, error: "ids are required" }, { status: 400 });

    const order = ids.map(Number).filter((n) => n > 0);
    await db.query(
      `UPDATE home_sections SET sort_order = CASE id ${order.map(() => "WHEN ? THEN ?").join(" ")} ELSE sort_order END WHERE id IN (?)`,
      [...order.flatMap((id, i) => [id, i + 1]), order]
    );
    return NextResponse.json({ success: true, message: "Order saved" });
  } catch (error) {
    console.error("PUT Reorder Home Sections Error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
