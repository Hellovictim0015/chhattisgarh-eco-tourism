import { NextResponse } from "next/server";
import { changeBookingStatus, getAdminFromRequest } from "@/lib/hotels";
import { sendBookingEmail } from "@/lib/nodemailer";

// ==========================================
// PATCH: Change a booking's status  { status }
// ==========================================
export async function PATCH(req, { params }) {
  try {
    if (!getAdminFromRequest(req)) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const { status } = await req.json();

    const result = await changeBookingStatus(id, status);
    if (result.error) return NextResponse.json({ success: false, error: result.error }, { status: result.code });

    sendBookingEmail(result.booking);
    return NextResponse.json({ success: true, message: "Booking updated", data: result.booking });
  } catch (error) {
    console.error("PATCH Admin Booking Error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
