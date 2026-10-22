import { NextResponse } from "next/server";
import db from "@/lib/db";
import { HOTEL_CARD_COLUMNS, HOTEL_STATUSES, getAdminFromRequest, readHotelForm, saveHotel } from "@/lib/hotels";

const unauthorized = () => NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

// ==========================================
// GET: All hotels with owner and booking counts.  ?status=PENDING
// ==========================================
export async function GET(req) {
  try {
    if (!getAdminFromRequest(req)) return unauthorized();

    const status = new URL(req.url).searchParams.get("status");
    const [hotels] = await db.query(
      `SELECT ${HOTEL_CARD_COLUMNS}, h.views, u.name AS owner_name, u.phone AS owner_phone,
        (SELECT COUNT(*) FROM bookings WHERE hotel_id = h.id) AS total_bookings
       FROM hotels h LEFT JOIN users u ON u.id = h.user_id
       ${status ? "WHERE h.status = ?" : ""}
       ORDER BY FIELD(h.status, 'PENDING', 'ACTIVE', 'INACTIVE'), h.created_at DESC`,
      status ? [status] : []
    );
    return NextResponse.json({ success: true, data: hotels });
  } catch (error) {
    console.error("GET Admin Hotels Error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

// ==========================================
// POST: Admin adds a hotel (live immediately unless another status is chosen)
// ==========================================
export async function POST(req) {
  try {
    if (!getAdminFromRequest(req)) return unauthorized();

    const formData = await req.formData();
    const form = await readHotelForm(formData);
    if (form.error) return NextResponse.json({ success: false, error: form.error }, { status: 400 });

    const status = HOTEL_STATUSES.includes(formData.get("status")) ? formData.get("status") : "ACTIVE";
    const hotelId = await saveHotel({
      ...form,
      formData,
      extra: { status, is_featured: formData.get("is_featured") === "1" ? 1 : 0 },
    });
    return NextResponse.json({ success: true, message: "Hotel added", hotel_id: hotelId }, { status: 201 });
  } catch (error) {
    console.error("POST Admin Hotel Error:", error);
    return NextResponse.json({ success: false, error: error.message || "Could not save hotel" }, { status: 500 });
  }
}
