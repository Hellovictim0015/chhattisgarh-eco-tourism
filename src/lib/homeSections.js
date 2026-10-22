import db from "@/lib/db";
import { HOTEL_CARD_COLUMNS } from "@/lib/hotels";

// Live hotels of the given sections, in each section's own order. Returns Map(section_id -> hotels[]).
// `limit` caps how many hotels each section gets (for the home page rows).
export async function sectionHotels(sectionIds, { limit = null, activeOnly = true } = {}) {
  const map = new Map(sectionIds.map((id) => [Number(id), []]));
  if (!sectionIds.length) return map;
  const [rows] = await db.query(
    `SELECT x.section_id, ${HOTEL_CARD_COLUMNS}
     FROM home_section_hotels x JOIN hotels h ON h.id = x.hotel_id
     WHERE x.section_id IN (?) ${activeOnly ? "AND h.status = 'ACTIVE'" : ""}
     ORDER BY x.section_id, x.sort_order, h.id`,
    [sectionIds]
  );
  for (const { section_id, ...hotel } of rows) {
    const list = map.get(Number(section_id));
    if (!limit || list.length < limit) list.push(hotel);
  }
  return map;
}

// "Navratri Specials!" -> "navratri-specials"; falls back to "section" for titles with no latin letters
export function slugify(text) {
  return String(text).toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 150) || "section";
}

// A slug not used by any other section
export async function uniqueSlug(title, exceptId = null) {
  const base = slugify(title);
  for (let n = 1; ; n++) {
    const slug = n === 1 ? base : `${base}-${n}`;
    const [[taken]] = await db.query("SELECT id FROM home_sections WHERE slug = ? AND id <> ?", [slug, exceptId || 0]);
    if (!taken) return slug;
  }
}

// Validates { title, subtitle, status, hotel_ids } from the admin. Returns { fields, hotelIds } or { error }.
export function readSectionBody(body) {
  const title = String(body.title || "").trim().slice(0, 150);
  if (!title) return { error: "Section title is required" };
  const hotelIds = [...new Set((Array.isArray(body.hotel_ids) ? body.hotel_ids : []).map(Number).filter((n) => n > 0))];
  return {
    fields: {
      title,
      subtitle: String(body.subtitle || "").trim().slice(0, 255) || null,
      status: body.status === "INACTIVE" ? "INACTIVE" : "ACTIVE",
    },
    hotelIds,
  };
}

// Replaces a section's hotel list, keeping the given order
export async function setSectionHotels(conn, sectionId, hotelIds) {
  await conn.query("DELETE FROM home_section_hotels WHERE section_id = ?", [sectionId]);
  if (!hotelIds.length) return;
  const [found] = await conn.query("SELECT id FROM hotels WHERE id IN (?)", [hotelIds]);
  const exists = new Set(found.map((r) => Number(r.id)));
  const rows = hotelIds.filter((id) => exists.has(id)).map((id, i) => [sectionId, id, i + 1]);
  if (rows.length) await conn.query("INSERT INTO home_section_hotels (section_id, hotel_id, sort_order) VALUES ?", [rows]);
}
