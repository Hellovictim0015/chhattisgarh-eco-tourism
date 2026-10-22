import { NextResponse } from "next/server";
import db from "@/lib/db";
import { HOTEL_CARD_COLUMNS, HOLDING_STATUSES, validateStay } from "@/lib/hotels";

// ==========================================
// GET: Public hotel search (ACTIVE only).
// With check_in + check_out, only hotels with a room type that still has enough
// free rooms for the whole stay (and fits the guests) are returned.
// ==========================================
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);

    const q = searchParams.get("q");
    const city = searchParams.get("city");
    const hotelType = searchParams.get("type");
    const minPrice = searchParams.get("min_price");
    const maxPrice = searchParams.get("max_price");
    const featured = searchParams.get("featured");
    const checkIn = searchParams.get("check_in");
    const checkOut = searchParams.get("check_out");
    const guests = Math.max(1, parseInt(searchParams.get("guests"), 10) || 1);
    const roomsWanted = Math.max(1, parseInt(searchParams.get("rooms"), 10) || 1);
    const sort = searchParams.get("sort") || "newest";

    const page = Math.max(1, parseInt(searchParams.get("page"), 10) || 1);
    const limit = Math.min(48, Math.max(1, parseInt(searchParams.get("limit"), 10) || 12));
    const offset = (page - 1) * limit;

    const where = ["h.status = 'ACTIVE'"];
    const values = [];

    if (q) {
      where.push("(h.name LIKE ? OR h.city LIKE ? OR h.address LIKE ?)");
      values.push(`%${q}%`, `%${q}%`, `%${q}%`);
    }
    if (city) {
      where.push("h.city LIKE ?");
      values.push(`%${city}%`);
    }
    if (hotelType) {
      where.push("h.hotel_type = ?");
      values.push(hotelType);
    }
    if (featured) where.push("h.is_featured = 1");

    // Room-level conditions: price range, and availability for the requested stay
    const roomWhere = ["r.hotel_id = h.id", "r.status = 'ACTIVE'"];
    const roomValues = [];
    if (minPrice) {
      roomWhere.push("r.price_per_night >= ?");
      roomValues.push(minPrice);
    }
    if (maxPrice) {
      roomWhere.push("r.price_per_night <= ?");
      roomValues.push(maxPrice);
    }
    if (checkIn || checkOut) {
      const stay = validateStay(checkIn, checkOut);
      if (stay.error) return NextResponse.json({ success: false, error: stay.error }, { status: 400 });
      roomWhere.push(
        `r.max_guests * ? >= ?`,
        `r.total_rooms - COALESCE((SELECT SUM(b.rooms_count) FROM bookings b
           WHERE b.room_id = r.id AND b.status IN (?) AND b.check_in < ? AND b.check_out > ?), 0) >= ?`
      );
      roomValues.push(roomsWanted, guests, HOLDING_STATUSES, checkOut, checkIn, roomsWanted);
    }
    where.push(`EXISTS (SELECT 1 FROM rooms r WHERE ${roomWhere.join(" AND ")})`);
    values.push(...roomValues);

    const whereSql = where.join(" AND ");

    let orderBy = "h.is_featured DESC, h.created_at DESC";
    if (sort === "price_asc") orderBy = "min_price ASC";
    else if (sort === "price_desc") orderBy = "min_price DESC";
    else if (sort === "rating") orderBy = "h.star_rating DESC, h.created_at DESC";

    const [[{ total }]] = await db.query(`SELECT COUNT(*) AS total FROM hotels h WHERE ${whereSql}`, values);

    const [hotels] = await db.query(
      `SELECT ${HOTEL_CARD_COLUMNS} FROM hotels h WHERE ${whereSql} ORDER BY ${orderBy} LIMIT ? OFFSET ?`,
      [...values, limit, offset]
    );

    return NextResponse.json({
      success: true,
      data: hotels,
      pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
    });
  } catch (error) {
    console.error("GET Hotels Search Error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
