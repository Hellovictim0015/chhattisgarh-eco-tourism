import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { getHotelDetail, readHotelForm, saveHotel, deleteHotel } from "@/lib/hotels";

// Loads the hotel only if it belongs to the requesting user.
async function ownHotel(req, params) {
  const user = getUserFromRequest(req);
  if (!user) return { res: NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 }) };
  const { id } = await params;
  const [[hotel]] = await db.query("SELECT id, status FROM hotels WHERE id = ? AND user_id = ?", [id, user.id]);
  if (!hotel) return { res: NextResponse.json({ success: false, error: "Hotel not found" }, { status: 404 }) };
  return { hotel };
}

// ==========================================
// GET: Full hotel (all rooms, including inactive) for the edit form
// ==========================================
export async function GET(req, { params }) {
  try {
    const { hotel, res } = await ownHotel(req, params);
    if (res) return res;
    return NextResponse.json({ success: true, data: await getHotelDetail(hotel.id) });
  } catch (error) {
    console.error("GET Owner Hotel Error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

// ==========================================
// PUT: Update the hotel. Status is left as the admin set it.
// ==========================================
export async function PUT(req, { params }) {
  try {
    const { hotel, res } = await ownHotel(req, params);
    if (res) return res;

    const formData = await req.formData();
    const form = await readHotelForm(formData);
    if (form.error) return NextResponse.json({ success: false, error: form.error }, { status: 400 });

    await saveHotel({ hotelId: hotel.id, ...form, formData });
    return NextResponse.json({ success: true, message: "Hotel updated" });
  } catch (error) {
    console.error("PUT Owner Hotel Error:", error);
    return NextResponse.json({ success: false, error: error.message || "Could not save hotel" }, { status: 500 });
  }
}

// ==========================================
// DELETE: Remove a hotel that has never been booked
// ==========================================
export async function DELETE(req, { params }) {
  try {
    const { hotel, res } = await ownHotel(req, params);
    if (res) return res;

    const [[{ n }]] = await db.query("SELECT COUNT(*) AS n FROM bookings WHERE hotel_id = ?", [hotel.id]);
    if (n > 0) {
      return NextResponse.json(
        { success: false, error: "This hotel has bookings, so it cannot be deleted. Contact support to deactivate it." },
        { status: 409 }
      );
    }
    await deleteHotel(hotel.id);
    return NextResponse.json({ success: true, message: "Hotel deleted" });
  } catch (error) {
    console.error("DELETE Owner Hotel Error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
