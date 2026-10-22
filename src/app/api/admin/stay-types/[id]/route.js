import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getAdminFromRequest } from "@/lib/hotels";
import { readStayTypeForm } from "@/lib/stayTypes";
import { saveImage, deleteUpload } from "@/lib/uploads";

const unauthorized = () => NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

// ==========================================
// PUT: Update a stay type. Renaming its code moves its hotels along with it.
// Send remove_image=1 to clear the image without uploading a new one.
// ==========================================
export async function PUT(req, { params }) {
  let newImage = null;
  let conn;
  try {
    if (!getAdminFromRequest(req)) return unauthorized();
    const { id } = await params;
    const [[current]] = await db.query("SELECT * FROM stay_types WHERE id = ?", [id]);
    if (!current) return NextResponse.json({ success: false, error: "Stay type not found" }, { status: 404 });

    const formData = await req.formData();
    const form = readStayTypeForm(formData);
    if (form.error) return NextResponse.json({ success: false, error: form.error }, { status: 400 });

    newImage = await saveImage(formData.get("image"));
    const image = newImage || (formData.get("remove_image") === "1" ? null : current.image);
    const { name, code, sort_order, status } = form.fields;

    conn = await db.getConnection();
    await conn.beginTransaction();
    await conn.query("UPDATE stay_types SET name = ?, code = ?, image = ?, sort_order = ?, status = ? WHERE id = ?", [
      name, code, image, sort_order, status, id,
    ]);
    if (code !== current.code) {
      await conn.query("UPDATE hotels SET hotel_type = ? WHERE hotel_type = ?", [code, current.code]);
    }
    await conn.commit();

    if (image !== current.image) await deleteUpload(current.image);
    return NextResponse.json({ success: true, message: "Stay type updated" });
  } catch (error) {
    if (conn) await conn.rollback().catch(() => {});
    await deleteUpload(newImage);
    if (error.code === "ER_DUP_ENTRY") {
      return NextResponse.json({ success: false, error: "A stay type with this code already exists" }, { status: 409 });
    }
    console.error("PUT Admin Stay Type Error:", error);
    return NextResponse.json({ success: false, error: error.message || "Could not save stay type" }, { status: 500 });
  } finally {
    if (conn) conn.release();
  }
}

// ==========================================
// DELETE: Remove a stay type that no hotel uses
// ==========================================
export async function DELETE(req, { params }) {
  try {
    if (!getAdminFromRequest(req)) return unauthorized();
    const { id } = await params;
    const [[current]] = await db.query("SELECT * FROM stay_types WHERE id = ?", [id]);
    if (!current) return NextResponse.json({ success: false, error: "Stay type not found" }, { status: 404 });

    const [[{ n }]] = await db.query("SELECT COUNT(*) AS n FROM hotels WHERE hotel_type = ?", [current.code]);
    if (n > 0) {
      return NextResponse.json(
        { success: false, error: `${n} hotel(s) use this stay type. Move them to another type or set this one Inactive.` },
        { status: 409 }
      );
    }
    await db.query("DELETE FROM stay_types WHERE id = ?", [id]);
    await deleteUpload(current.image);
    return NextResponse.json({ success: true, message: "Stay type deleted" });
  } catch (error) {
    console.error("DELETE Admin Stay Type Error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
