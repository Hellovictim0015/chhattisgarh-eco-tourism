import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { changeBookingStatus } from "@/lib/hotels";
import { sendBookingEmail } from "@/lib/nodemailer";

// ==========================================
// PATCH: Hotel owner confirms / rejects / completes / cancels a booking at their hotel
// ==========================================
export async function PATCH(req, { params }) {
  try {
    const user = getUserFromRequest(req);
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const { status } = await req.json();

    const result = await changeBookingStatus(id, status, {
      scopeSql: "h.user_id = ?",
      scopeValues: [user.id],
      allowed: ["CONFIRMED", "REJECTED", "COMPLETED", "CANCELLED"],
    });
    if (result.error) return NextResponse.json({ success: false, error: result.error }, { status: result.code });

    sendBookingEmail(result.booking);
    return NextResponse.json({ success: true, message: "Booking updated", data: result.booking });
  } catch (error) {
    console.error("PATCH Owner Booking Error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
