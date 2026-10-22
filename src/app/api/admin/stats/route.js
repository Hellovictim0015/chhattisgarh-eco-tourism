import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getAdminFromRequest, todayIST } from "@/lib/hotels";

// ==========================================
// GET: Numbers for the admin dashboard home
// ==========================================
export async function GET(req) {
  try {
    if (!getAdminFromRequest(req)) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const today = todayIST();
    const [[hotels]] = await db.query(
      `SELECT COUNT(*) AS total, COALESCE(SUM(status = 'ACTIVE'), 0) AS active, COALESCE(SUM(status = 'PENDING'), 0) AS pending FROM hotels`
    );
    const [[bookings]] = await db.query(
      `SELECT COUNT(*) AS total,
        COALESCE(SUM(status = 'PENDING'), 0) AS pending,
        COALESCE(SUM(status IN ('PENDING','CONFIRMED') AND check_in = ?), 0) AS arrivals_today,
        COALESCE(SUM(CASE WHEN status IN ('CONFIRMED','COMPLETED') THEN total_amount END), 0) AS revenue
       FROM bookings`,
      [today]
    );
    const [[{ users }]] = await db.query("SELECT COUNT(*) AS users FROM users WHERE role <> 'ADMIN'");

    return NextResponse.json({ success: true, data: { hotels, bookings, users } });
  } catch (error) {
    console.error("GET Admin Stats Error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
