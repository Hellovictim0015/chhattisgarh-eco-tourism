import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { HOTEL_CARD_COLUMNS, readHotelForm, saveHotel } from "@/lib/hotels";

// ==========================================
// GET: Hotels listed by the logged-in owner, with booking counts
// ==========================================
export async function GET(req) {
  try {
    const user = getUserFromRequest(req);
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const [hotels] = await db.query(
      `SELECT ${HOTEL_CARD_COLUMNS}, h.views,
        (SELECT COUNT(*) FROM bookings WHERE hotel_id = h.id AND status = 'PENDING') AS pending_bookings
       FROM hotels h WHERE h.user_id = ? ORDER BY h.created_at DESC`,
      [user.id]
    );
    return NextResponse.json({ success: true, data: hotels });
  } catch (error) {
    console.error("GET Owner Hotels Error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

// ==========================================
// POST: List a new hotel. It stays PENDING until an admin approves it.
// ==========================================
export async function POST(req) {
  try {
    const user = getUserFromRequest(req);
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const formData = await req.formData();
    const form = await readHotelForm(formData);
    if (form.error) return NextResponse.json({ success: false, error: form.error }, { status: 400 });

    const hotelId = await saveHotel({ ...form, formData, extra: { user_id: user.id, status: "PENDING" } });
    return NextResponse.json(
      { success: true, message: "Hotel submitted for review. It will go live once approved.", hotel_id: hotelId },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST Owner Hotel Error:", error);
    return NextResponse.json({ success: false, error: error.message || "Could not save hotel" }, { status: 500 });
  }
}
