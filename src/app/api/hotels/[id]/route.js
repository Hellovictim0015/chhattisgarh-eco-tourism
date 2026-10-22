import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { getHotelDetail, bookedRoomCounts, validateStay } from "@/lib/hotels";

// ==========================================
// GET: Public hotel detail. Pass check_in + check_out to get `available` per room type.
// Non-active hotels are only visible to their owner and admins (for previews).
// ==========================================
export async function GET(req, { params }) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const checkIn = searchParams.get("check_in");
    const checkOut = searchParams.get("check_out");

    const hotel = await getHotelDetail(id, { activeRoomsOnly: true });
    if (!hotel) return NextResponse.json({ success: false, error: "Hotel not found" }, { status: 404 });

    const user = getUserFromRequest(req);
    const canPreview = user && (user.role === "ADMIN" || Number(user.id) === Number(hotel.user_id));
    if (hotel.status !== "ACTIVE" && !canPreview) {
      return NextResponse.json({ success: false, error: "Hotel not found" }, { status: 404 });
    }

    let stay = null;
    if (checkIn && checkOut) {
      const check = validateStay(checkIn, checkOut);
      if (check.error) return NextResponse.json({ success: false, error: check.error }, { status: 400 });
      const booked = await bookedRoomCounts(hotel.rooms.map((r) => r.id), checkIn, checkOut);
      hotel.rooms = hotel.rooms.map((r) => ({ ...r, available: Math.max(0, r.total_rooms - (booked.get(Number(r.id)) || 0)) }));
      stay = { check_in: checkIn, check_out: checkOut, nights: check.nights };
    }

    if (hotel.status === "ACTIVE" && !canPreview) {
      db.query("UPDATE hotels SET views = views + 1 WHERE id = ?", [id]).catch(() => {});
    }

    // Owner contact details stay private
    delete hotel.owner_phone;

    return NextResponse.json({ success: true, data: hotel, stay });
  } catch (error) {
    console.error("GET Hotel Detail Error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
