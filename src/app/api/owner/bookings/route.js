import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { BOOKING_LIST_SQL } from "@/lib/hotels";

// ==========================================
// GET: Bookings for the hotels the logged-in user owns.  ?status=PENDING&hotel_id=1
// ==========================================
export async function GET(req) {
  try {
    const user = getUserFromRequest(req);
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const where = ["h.user_id = ?"];
    const values = [user.id];
    if (searchParams.get("status")) {
      where.push("b.status = ?");
      values.push(searchParams.get("status"));
    }
    if (searchParams.get("hotel_id")) {
      where.push("b.hotel_id = ?");
      values.push(searchParams.get("hotel_id"));
    }

    const [bookings] = await db.query(
      `${BOOKING_LIST_SQL} WHERE ${where.join(" AND ")} ORDER BY b.check_in DESC, b.created_at DESC`,
      values
    );
    return NextResponse.json({ success: true, data: bookings });
  } catch (error) {
    console.error("GET Owner Bookings Error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
