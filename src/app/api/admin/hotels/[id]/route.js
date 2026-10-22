import { NextResponse } from "next/server";
import db from "@/lib/db";
import { HOTEL_STATUSES, getAdminFromRequest, getHotelDetail, readHotelForm, saveHotel, deleteHotel } from "@/lib/hotels";

const unauthorized = () => NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

// ==========================================
// GET: Full hotel for the edit form
// ==========================================
export async function GET(req, { params }) {
  try {
    if (!getAdminFromRequest(req)) return unauthorized();
    const { id } = await params;
    const hotel = await getHotelDetail(id);
    if (!hotel) return NextResponse.json({ success: false, error: "Hotel not found" }, { status: 404 });
    return NextResponse.json({ success: true, data: hotel });
  } catch (error) {
    console.error("GET Admin Hotel Error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

// ==========================================
// PUT: Update everything about a hotel
// ==========================================
export async function PUT(req, { params }) {
  try {
    if (!getAdminFromRequest(req)) return unauthorized();
    const { id } = await params;
    const [[exists]] = await db.query("SELECT id FROM hotels WHERE id = ?", [id]);
    if (!exists) return NextResponse.json({ success: false, error: "Hotel not found" }, { status: 404 });

    const formData = await req.formData();
    const form = await readHotelForm(formData);
    if (form.error) return NextResponse.json({ success: false, error: form.error }, { status: 400 });

    const extra = { is_featured: formData.get("is_featured") === "1" ? 1 : 0 };
    if (HOTEL_STATUSES.includes(formData.get("status"))) extra.status = formData.get("status");

    await saveHotel({ hotelId: exists.id, ...form, formData, extra });
    return NextResponse.json({ success: true, message: "Hotel updated" });
  } catch (error) {
    console.error("PUT Admin Hotel Error:", error);
    return NextResponse.json({ success: false, error: error.message || "Could not save hotel" }, { status: 500 });
  }
}

// ==========================================
// PATCH: Quick changes from the list — { status } (approve / deactivate) and/or { is_featured }
// ==========================================
export async function PATCH(req, { params }) {
  try {
    if (!getAdminFromRequest(req)) return unauthorized();
    const { id } = await params;
    const body = await req.json();

    const sets = [];
    const values = [];
    if (body.status !== undefined) {
      if (!HOTEL_STATUSES.includes(body.status)) {
        return NextResponse.json({ success: false, error: "Invalid status" }, { status: 400 });
      }
      sets.push("status = ?");
      values.push(body.status);
    }
    if (body.is_featured !== undefined) {
      sets.push("is_featured = ?");
      values.push(body.is_featured ? 1 : 0);
    }
    if (!sets.length) return NextResponse.json({ success: false, error: "Nothing to update" }, { status: 400 });

    const [res] = await db.query(`UPDATE hotels SET ${sets.join(", ")} WHERE id = ?`, [...values, id]);
    if (res.affectedRows === 0) return NextResponse.json({ success: false, error: "Hotel not found" }, { status: 404 });
    return NextResponse.json({ success: true, message: "Hotel updated" });
  } catch (error) {
    console.error("PATCH Admin Hotel Error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

// ==========================================
// DELETE: Remove a hotel along with its rooms and bookings
// ==========================================
export async function DELETE(req, { params }) {
  try {
    if (!getAdminFromRequest(req)) return unauthorized();
    const { id } = await params;
    if (!(await deleteHotel(id))) return NextResponse.json({ success: false, error: "Hotel not found" }, { status: 404 });
    return NextResponse.json({ success: true, message: "Hotel deleted" });
  } catch (error) {
    console.error("DELETE Admin Hotel Error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
