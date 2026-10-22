import { NextResponse } from "next/server";
import db from "@/lib/db";
import { BOOKING_LIST_SQL, getAdminFromRequest } from "@/lib/hotels";

// ==========================================
// GET: All bookings, newest first.  ?status=PENDING&hotel_id=1&q=<code / guest name / phone>
// ==========================================
export async function GET(req) {
  try {
    if (!getAdminFromRequest(req)) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const where = ["1 = 1"];
    const values = [];
    if (searchParams.get("status")) {
      where.push("b.status = ?");
      values.push(searchParams.get("status"));
    }
    if (searchParams.get("hotel_id")) {
      where.push("b.hotel_id = ?");
      values.push(searchParams.get("hotel_id"));
    }
    const q = searchParams.get("q");
    if (q) {
      where.push("(b.booking_code LIKE ? OR b.guest_name LIKE ? OR b.guest_phone LIKE ?)");
      values.push(`%${q}%`, `%${q}%`, `%${q}%`);
    }

    const [bookings] = await db.query(
      `${BOOKING_LIST_SQL} WHERE ${where.join(" AND ")} ORDER BY b.created_at DESC LIMIT 500`,
      values
    );
    return NextResponse.json({ success: true, data: bookings });
  } catch (error) {
    console.error("GET Admin Bookings Error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
