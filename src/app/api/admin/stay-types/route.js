import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getAdminFromRequest } from "@/lib/hotels";
import { readStayTypeForm } from "@/lib/stayTypes";
import { saveImage, deleteUpload } from "@/lib/uploads";

const unauthorized = () => NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

// ==========================================
// GET: All stay types (including inactive) with hotel counts
// ==========================================
export async function GET(req) {
  try {
    if (!getAdminFromRequest(req)) return unauthorized();
    const [types] = await db.query(
      `SELECT t.*, (SELECT COUNT(*) FROM hotels h WHERE h.hotel_type = t.code) AS hotel_count
       FROM stay_types t ORDER BY t.sort_order, t.name`
    );
    return NextResponse.json({ success: true, data: types });
  } catch (error) {
    console.error("GET Admin Stay Types Error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

// ==========================================
// POST: Create a stay type (multipart: name, code?, sort_order, status, image)
// ==========================================
export async function POST(req) {
  let image = null;
  try {
    if (!getAdminFromRequest(req)) return unauthorized();
    const formData = await req.formData();
    const form = readStayTypeForm(formData);
    if (form.error) return NextResponse.json({ success: false, error: form.error }, { status: 400 });

    image = await saveImage(formData.get("image"));
    const { name, code, sort_order, status } = form.fields;
    const [res] = await db.query(
      "INSERT INTO stay_types (name, code, image, sort_order, status) VALUES (?, ?, ?, ?, ?)",
      [name, code, image, sort_order, status]
    );
    return NextResponse.json({ success: true, message: "Stay type added", id: res.insertId }, { status: 201 });
  } catch (error) {
    await deleteUpload(image);
    if (error.code === "ER_DUP_ENTRY") {
      return NextResponse.json({ success: false, error: "A stay type with this code already exists" }, { status: 409 });
    }
    console.error("POST Admin Stay Type Error:", error);
    return NextResponse.json({ success: false, error: error.message || "Could not save stay type" }, { status: 500 });
  }
}
