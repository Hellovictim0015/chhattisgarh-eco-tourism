import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { bookedRoomCounts, validateStay, newBookingCode, BOOKING_LIST_SQL } from "@/lib/hotels";
import { sendBookingEmail } from "@/lib/nodemailer";

// ==========================================
// GET: The logged-in user's bookings
// ==========================================
export async function GET(req) {
  try {
    const user = getUserFromRequest(req);
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const [bookings] = await db.query(`${BOOKING_LIST_SQL} WHERE b.user_id = ? ORDER BY b.created_at DESC`, [user.id]);
    return NextResponse.json({ success: true, data: bookings });
  } catch (error) {
    console.error("GET My Bookings Error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

// ==========================================
// POST: Book a room (login required). Payment is taken at the hotel, so the booking
// starts PENDING until the hotel owner / admin confirms it.
// The room row is locked for the transaction so two guests cannot take the last room together.
// ==========================================
export async function POST(req) {
  const user = getUserFromRequest(req);
  if (!user) return NextResponse.json({ success: false, error: "Please login to book" }, { status: 401 });

  let conn;
  try {
    const body = await req.json();
    const roomId = parseInt(body.room_id, 10);
    const roomsCount = Math.max(1, parseInt(body.rooms_count, 10) || 1);
    const guests = Math.max(1, parseInt(body.guests, 10) || 1);
    const guestName = String(body.guest_name || "").trim();
    const guestPhone = String(body.guest_phone || "").trim();
    const guestEmail = String(body.guest_email || "").trim().toLowerCase() || null;
    const specialRequest = String(body.special_request || "").trim() || null;

    if (!roomId) return NextResponse.json({ success: false, error: "Please choose a room" }, { status: 400 });
    if (!guestName || !guestPhone) {
      return NextResponse.json({ success: false, error: "Guest name and phone number are required" }, { status: 400 });
    }
    const stay = validateStay(body.check_in, body.check_out);
    if (stay.error) return NextResponse.json({ success: false, error: stay.error }, { status: 400 });

    conn = await db.getConnection();
    await conn.beginTransaction();

    const [[room]] = await conn.query(
      `SELECT r.*, h.status AS hotel_status, h.name AS hotel_name
       FROM rooms r JOIN hotels h ON h.id = r.hotel_id WHERE r.id = ? FOR UPDATE`,
      [roomId]
    );
    if (!room || room.status !== "ACTIVE" || room.hotel_status !== "ACTIVE") {
      await conn.rollback();
      return NextResponse.json({ success: false, error: "This room is not available for booking" }, { status: 404 });
    }
    if (guests > room.max_guests * roomsCount) {
      await conn.rollback();
      return NextResponse.json(
        { success: false, error: `${roomsCount} × ${room.name} fits at most ${room.max_guests * roomsCount} guests` },
        { status: 400 }
      );
    }

    const booked = (await bookedRoomCounts([room.id], body.check_in, body.check_out, conn)).get(Number(room.id)) || 0;
    const available = room.total_rooms - booked;
    if (available < roomsCount) {
      await conn.rollback();
      return NextResponse.json(
        { success: false, error: available > 0 ? `Only ${available} room(s) left for these dates` : "Sold out for these dates" },
        { status: 409 }
      );
    }

    const totalAmount = Number(room.price_per_night) * stay.nights * roomsCount;
    let bookingId;
    for (let attempt = 0; ; attempt++) {
      try {
        const [res] = await conn.query(
          `INSERT INTO bookings (booking_code, hotel_id, room_id, user_id, guest_name, guest_email, guest_phone,
            check_in, check_out, rooms_count, guests, nights, total_amount, special_request)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [newBookingCode(), room.hotel_id, room.id, user.id, guestName, guestEmail, guestPhone,
            body.check_in, body.check_out, roomsCount, guests, stay.nights, totalAmount, specialRequest]
        );
        bookingId = res.insertId;
        break;
      } catch (err) {
        if (err.code !== "ER_DUP_ENTRY" || attempt >= 4) throw err; // booking_code collision: try another
      }
    }

    await conn.commit();

    const [[booking]] = await db.query(`${BOOKING_LIST_SQL} WHERE b.id = ?`, [bookingId]);
    sendBookingEmail(booking);

    return NextResponse.json(
      { success: true, message: "Booking request sent! The hotel will confirm it shortly.", data: booking },
      { status: 201 }
    );
  } catch (error) {
    if (conn) await conn.rollback().catch(() => {});
    console.error("POST Booking Error:", error);
    return NextResponse.json({ success: false, error: "Booking failed. Please try again." }, { status: 500 });
  } finally {
    if (conn) conn.release();
  }
}
