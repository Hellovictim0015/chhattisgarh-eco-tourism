import db from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { saveImage, deleteUpload } from "@/lib/uploads";
import { ADMIN_LOGIN_REQUIRED } from "@/lib/site";
import { cleanPhone } from "@/lib/settings";

export const HOTEL_STATUSES = ["ACTIVE", "PENDING", "INACTIVE"];
export const BOOKING_STATUSES = ["PENDING", "CONFIRMED", "CANCELLED", "REJECTED", "COMPLETED"];

// Bookings in these states hold their rooms; the rest free them up again.
export const HOLDING_STATUSES = ["PENDING", "CONFIRMED"];

const MAX_NIGHTS = 30;

// Returns the decoded admin token, or null when the request is not from an admin.
// While ADMIN_LOGIN_REQUIRED is off, every request is treated as an admin.
export function getAdminFromRequest(req) {
  const user = getUserFromRequest(req);
  if (!ADMIN_LOGIN_REQUIRED) return user?.role === "ADMIN" ? user : { id: null, role: "ADMIN" };
  return user?.role === "ADMIN" ? user : null;
}

// "YYYY-MM-DD" -> Date at UTC midnight, or null for anything else.
function parseDay(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ""))) return null;
  const d = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== value ? null : d;
}

// Today's date in India, as "YYYY-MM-DD".
export function todayIST() {
  return new Date(Date.now() + 5.5 * 3600 * 1000).toISOString().slice(0, 10);
}

// Validates a check-in / check-out pair. Returns { nights } or { error }.
export function validateStay(checkIn, checkOut, { allowPast = false } = {}) {
  const inDay = parseDay(checkIn);
  const outDay = parseDay(checkOut);
  if (!inDay || !outDay) return { error: "Please select valid check-in and check-out dates" };
  if (!allowPast && checkIn < todayIST()) return { error: "Check-in date cannot be in the past" };
  const nights = Math.round((outDay - inDay) / 86400000);
  if (nights < 1) return { error: "Check-out must be after check-in" };
  if (nights > MAX_NIGHTS) return { error: `A booking can be for at most ${MAX_NIGHTS} nights` };
  return { nights };
}

// Map of room_id -> rooms already held between checkIn and checkOut (stays overlap when
// one starts before the other ends). Pass a transaction connection to read with locks.
export async function bookedRoomCounts(roomIds, checkIn, checkOut, conn = db) {
  if (!roomIds.length) return new Map();
  const [rows] = await conn.query(
    `SELECT room_id, COALESCE(SUM(rooms_count), 0) AS booked
     FROM bookings
     WHERE room_id IN (?) AND status IN (?) AND check_in < ? AND check_out > ?
     GROUP BY room_id`,
    [roomIds, HOLDING_STATUSES, checkOut, checkIn]
  );
  return new Map(rows.map((r) => [Number(r.room_id), Number(r.booked)]));
}

// Booking reference shown to guests, e.g. "CG7K2M9QX".
export function newBookingCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "CG";
  for (let i = 0; i < 7; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

// Full hotel with images, amenities and rooms. Returns null when it does not exist.
export async function getHotelDetail(id, { activeRoomsOnly = false } = {}) {
  const [[hotel]] = await db.query(
    `SELECT h.*, u.name AS owner_name, u.phone AS owner_phone,
       (SELECT name FROM stay_types WHERE code = h.hotel_type) AS hotel_type_name
     FROM hotels h LEFT JOIN users u ON u.id = h.user_id
     WHERE h.id = ?`,
    [id]
  );
  if (!hotel) return null;

  const [[images], [amenities], [rooms]] = await Promise.all([
    db.query("SELECT id, image FROM hotel_images WHERE hotel_id = ? ORDER BY sort_order, id", [id]),
    db.query(
      `SELECT a.id, a.name, a.icon, a.status FROM hotel_amenities ha
       JOIN amenities a ON a.id = ha.amenity_id WHERE ha.hotel_id = ? ORDER BY a.name`,
      [id]
    ),
    db.query(
      `SELECT * FROM rooms WHERE hotel_id = ? ${activeRoomsOnly ? "AND status = 'ACTIVE'" : ""} ORDER BY price_per_night, id`,
      [id]
    ),
  ]);

  return { ...hotel, images, amenities, rooms };
}

// SELECT list for hotel cards: cover image and the cheapest active room price.
export const HOTEL_CARD_COLUMNS = `
  h.id, h.name, h.hotel_type, h.city, h.address, h.star_rating, h.status, h.is_featured, h.created_at,
  (SELECT name FROM stay_types WHERE code = h.hotel_type) AS hotel_type_name,
  (SELECT image FROM hotel_images WHERE hotel_id = h.id ORDER BY sort_order, id LIMIT 1) AS image,
  (SELECT MIN(price_per_night) FROM rooms WHERE hotel_id = h.id AND status = 'ACTIVE') AS min_price,
  (SELECT COALESCE(SUM(total_rooms), 0) FROM rooms WHERE hotel_id = h.id AND status = 'ACTIVE') AS total_rooms`;

const toInt = (v, fallback = null) => {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : fallback;
};
const clean = (v) => {
  const s = typeof v === "string" ? v.trim() : v;
  return s === "" || s === undefined ? null : s;
};

// Reads and validates the hotel form (multipart). Returns { fields, rooms } or { error }.
//   fields: name, hotel_type, description, city, address, star_rating, phone, whatsapp, email,
//           check_in_time, check_out_time, policies
//   rooms:  JSON array [{ id?, name, description, price_per_night, max_guests, total_rooms, bed_type, status, image? }]
//           with an optional new image per room in file field `room_image_<index>`
export async function readHotelForm(formData) {
  const fields = {
    name: clean(formData.get("name")),
    hotel_type: clean(formData.get("hotel_type")) || "HOTEL",
    description: clean(formData.get("description")),
    city: clean(formData.get("city")),
    address: clean(formData.get("address")),
    star_rating: toInt(formData.get("star_rating")),
    phone: clean(formData.get("phone")),
    whatsapp: clean(formData.get("whatsapp")),
    email: clean(formData.get("email")),
    check_in_time: clean(formData.get("check_in_time")) || "12:00",
    check_out_time: clean(formData.get("check_out_time")) || "11:00",
    policies: clean(formData.get("policies")),
  };

  if (!fields.name) return { error: "Hotel name is required" };
  if (!fields.city) return { error: "City is required" };
  const [[stayType]] = await db.query("SELECT id FROM stay_types WHERE code = ?", [fields.hotel_type]);
  if (!stayType) return { error: "Please choose a valid stay type" };
  if (fields.star_rating !== null && (fields.star_rating < 1 || fields.star_rating > 5)) fields.star_rating = null;
  for (const [key, label] of [["phone", "Contact phone"], ["whatsapp", "WhatsApp number"]]) {
    if (!fields[key]) continue;
    fields[key] = cleanPhone(fields[key]);
    if (!fields[key]) return { error: `${label} must be a valid phone number (10–15 digits)` };
  }

  let rooms;
  try {
    rooms = JSON.parse(formData.get("rooms") || "[]");
    if (!Array.isArray(rooms)) throw new Error();
  } catch {
    return { error: "Invalid rooms data" };
  }
  if (rooms.length === 0) return { error: "Add at least one room type" };

  rooms = rooms.map((r, index) => ({
    index,
    id: toInt(r.id),
    name: clean(r.name),
    description: clean(r.description),
    price_per_night: Number(r.price_per_night),
    max_guests: toInt(r.max_guests, 2),
    total_rooms: toInt(r.total_rooms, 1),
    bed_type: clean(r.bed_type),
    status: r.status === "INACTIVE" ? "INACTIVE" : "ACTIVE",
    image: clean(r.image),
  }));
  for (const r of rooms) {
    if (!r.name) return { error: "Every room type needs a name" };
    if (!(r.price_per_night > 0)) return { error: `Enter a price per night for "${r.name}"` };
    if (r.max_guests < 1 || r.total_rooms < 1) return { error: `Guests and number of rooms must be at least 1 for "${r.name}"` };
  }

  return { fields, rooms };
}

// Inserts (hotelId = null) or updates a hotel with its amenities, images and rooms in one transaction.
// `extra` is merged into the hotel row (e.g. { user_id, status }). Returns the hotel id.
// Throws a user-facing Error for bad uploads.
export async function saveHotel({ hotelId = null, fields, rooms, formData, extra = {} }) {
  // Save uploads before opening the transaction so a bad file fails fast.
  const newImages = [];
  for (const file of formData.getAll("images")) {
    const url = await saveImage(file);
    if (url) newImages.push(url);
  }
  for (const r of rooms) {
    const url = await saveImage(formData.get(`room_image_${r.index}`));
    if (url) {
      r.oldImage = r.image;
      r.image = url;
    }
  }

  const removedFiles = [];
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const row = { ...fields, ...extra };
    const cols = Object.keys(row);
    if (hotelId) {
      await conn.query(`UPDATE hotels SET ${cols.map((c) => `\`${c}\` = ?`).join(", ")} WHERE id = ?`, [
        ...cols.map((c) => row[c]),
        hotelId,
      ]);
    } else {
      const [res] = await conn.query(
        `INSERT INTO hotels (${cols.map((c) => `\`${c}\``).join(", ")}) VALUES (${cols.map(() => "?").join(", ")})`,
        cols.map((c) => row[c])
      );
      hotelId = res.insertId;
    }

    // Amenities: replace the whole set. `other_amenities` holds facilities typed in by hand
    // (JSON list of names); each reuses an amenity with the same name or becomes a new one that
    // stays INACTIVE, so it shows on this hotel without joining everyone's checklist.
    const amenityIds = String(formData.get("amenities") || "")
      .split(",")
      .map((s) => toInt(s))
      .filter(Boolean);
    let otherNames = [];
    try {
      otherNames = JSON.parse(formData.get("other_amenities") || "[]");
    } catch {
      otherNames = [];
    }
    for (const raw of Array.isArray(otherNames) ? otherNames.slice(0, 30) : []) {
      const name = String(raw || "").trim().replace(/\s+/g, " ").slice(0, 150);
      if (!name) continue;
      const [[found]] = await conn.query("SELECT id FROM amenities WHERE LOWER(name) = LOWER(?) LIMIT 1", [name]);
      if (found) amenityIds.push(Number(found.id));
      else {
        const [ins] = await conn.query("INSERT INTO amenities (name, status) VALUES (?, 'INACTIVE')", [name]);
        amenityIds.push(ins.insertId);
      }
    }
    await conn.query("DELETE FROM hotel_amenities WHERE hotel_id = ?", [hotelId]);
    if (amenityIds.length) {
      await conn.query("INSERT IGNORE INTO hotel_amenities (hotel_id, amenity_id) VALUES ?", [
        amenityIds.map((a) => [hotelId, a]),
      ]);
    }

    // Images: keep the ones still listed in existing_images, then append new uploads
    let keep = [];
    try {
      keep = JSON.parse(formData.get("existing_images") || "[]");
    } catch {
      keep = [];
    }
    const [currentImages] = await conn.query("SELECT id, image FROM hotel_images WHERE hotel_id = ?", [hotelId]);
    for (const img of currentImages) {
      if (!keep.includes(img.image)) {
        await conn.query("DELETE FROM hotel_images WHERE id = ?", [img.id]);
        removedFiles.push(img.image);
      }
    }
    let order = currentImages.length;
    for (const url of newImages) {
      await conn.query("INSERT INTO hotel_images (hotel_id, image, sort_order) VALUES (?, ?, ?)", [hotelId, url, order++]);
    }

    // Rooms: update listed ones, insert new ones, and retire the rest.
    // A dropped room with bookings is only deactivated so its booking history survives.
    const [currentRooms] = await conn.query("SELECT id, image FROM rooms WHERE hotel_id = ?", [hotelId]);
    const currentIds = new Set(currentRooms.map((r) => Number(r.id)));
    const keptIds = new Set();
    for (const r of rooms) {
      const values = [r.name, r.description, r.price_per_night, r.max_guests, r.total_rooms, r.bed_type, r.image, r.status];
      if (r.id && currentIds.has(r.id)) {
        await conn.query(
          `UPDATE rooms SET name = ?, description = ?, price_per_night = ?, max_guests = ?, total_rooms = ?,
           bed_type = ?, image = ?, status = ? WHERE id = ?`,
          [...values, r.id]
        );
        keptIds.add(r.id);
        if (r.oldImage) removedFiles.push(r.oldImage);
      } else {
        await conn.query(
          `INSERT INTO rooms (name, description, price_per_night, max_guests, total_rooms, bed_type, image, status, hotel_id)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [...values, hotelId]
        );
      }
    }
    for (const room of currentRooms) {
      if (keptIds.has(Number(room.id))) continue;
      const [[{ n }]] = await conn.query("SELECT COUNT(*) AS n FROM bookings WHERE room_id = ?", [room.id]);
      if (n > 0) {
        await conn.query("UPDATE rooms SET status = 'INACTIVE' WHERE id = ?", [room.id]);
      } else {
        await conn.query("DELETE FROM rooms WHERE id = ?", [room.id]);
        removedFiles.push(room.image);
      }
    }

    await conn.commit();
  } catch (err) {
    await conn.rollback();
    // The transaction did not happen, so the files we just wrote are orphans
    await Promise.all([...newImages, ...rooms.filter((r) => r.oldImage !== undefined).map((r) => r.image)].map(deleteUpload));
    throw err;
  } finally {
    conn.release();
  }

  await Promise.all(removedFiles.map(deleteUpload));
  return hotelId;
}

// Deletes a hotel and its uploaded files. Returns false when it did not exist.
export async function deleteHotel(id) {
  const [images] = await db.query("SELECT image FROM hotel_images WHERE hotel_id = ?", [id]);
  const [rooms] = await db.query("SELECT image FROM rooms WHERE hotel_id = ?", [id]);
  const [res] = await db.query("DELETE FROM hotels WHERE id = ?", [id]);
  if (res.affectedRows === 0) return false;
  await Promise.all([...images, ...rooms].map((r) => deleteUpload(r.image)));
  return true;
}

// Booking rows joined with hotel / room names, for listings.
export const BOOKING_LIST_SQL = `
  SELECT b.*, DATE_FORMAT(b.check_in, '%Y-%m-%d') AS check_in, DATE_FORMAT(b.check_out, '%Y-%m-%d') AS check_out,
    h.name AS hotel_name, h.city AS hotel_city, r.name AS room_name,
    (SELECT image FROM hotel_images WHERE hotel_id = h.id ORDER BY sort_order, id LIMIT 1) AS hotel_image
  FROM bookings b
  JOIN hotels h ON h.id = b.hotel_id
  JOIN rooms r ON r.id = b.room_id`;

// Which status a booking may move to from its current one. CANCELLED / REJECTED / COMPLETED are final.
const BOOKING_TRANSITIONS = {
  PENDING: ["CONFIRMED", "REJECTED", "CANCELLED"],
  CONFIRMED: ["COMPLETED", "CANCELLED"],
};

// Moves a booking to `status`. `scopeSql` / `scopeValues` restrict which bookings the caller may touch
// (e.g. "b.user_id = ?"). Returns { booking } or { error, code }.
export async function changeBookingStatus(id, status, { scopeSql = "1 = 1", scopeValues = [], allowed = BOOKING_STATUSES } = {}) {
  if (!allowed.includes(status)) return { error: "This status change is not allowed", code: 400 };

  const [[booking]] = await db.query(`${BOOKING_LIST_SQL} WHERE b.id = ? AND ${scopeSql}`, [id, ...scopeValues]);
  if (!booking) return { error: "Booking not found", code: 404 };
  if (booking.status === status) return { booking };
  if (!(BOOKING_TRANSITIONS[booking.status] || []).includes(status)) {
    return { error: `A ${booking.status.toLowerCase()} booking cannot be marked ${status.toLowerCase()}`, code: 409 };
  }

  await db.query("UPDATE bookings SET status = ? WHERE id = ? AND status = ?", [status, id, booking.status]);
  return { booking: { ...booking, status } };
}
