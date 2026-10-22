import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getAdminFromRequest } from "@/lib/hotels";
import { readHeroSlideForm } from "@/lib/heroSlides";
import { saveImage, deleteUpload } from "@/lib/uploads";

const unauthorized = () => NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

// ==========================================
// PUT: Update a slide's text, order, status and (optionally) image
// ==========================================
export async function PUT(req, { params }) {
  let newImage = null;
  try {
    if (!getAdminFromRequest(req)) return unauthorized();
    const { id } = await params;
    const [[current]] = await db.query("SELECT * FROM hero_slides WHERE id = ?", [id]);
    if (!current) return NextResponse.json({ success: false, error: "Slide not found" }, { status: 404 });

    const formData = await req.formData();
    const form = readHeroSlideForm(formData);
    if (form.error) return NextResponse.json({ success: false, error: form.error }, { status: 400 });

    newImage = await saveImage(formData.get("image"));
    const { title, highlight, subtitle, sort_order, status } = form.fields;
    await db.query(
      "UPDATE hero_slides SET image = ?, title = ?, highlight = ?, subtitle = ?, sort_order = ?, status = ? WHERE id = ?",
      [newImage || current.image, title, highlight, subtitle, sort_order, status, id]
    );
    if (newImage) await deleteUpload(current.image);
    return NextResponse.json({ success: true, message: "Slide updated" });
  } catch (error) {
    await deleteUpload(newImage);
    console.error("PUT Admin Hero Slide Error:", error);
    return NextResponse.json({ success: false, error: error.message || "Could not save slide" }, { status: 500 });
  }
}

// ==========================================
// DELETE: Remove a slide and its uploaded image
// ==========================================
export async function DELETE(req, { params }) {
  try {
    if (!getAdminFromRequest(req)) return unauthorized();
    const { id } = await params;
    const [[current]] = await db.query("SELECT image FROM hero_slides WHERE id = ?", [id]);
    if (!current) return NextResponse.json({ success: false, error: "Slide not found" }, { status: 404 });
    await db.query("DELETE FROM hero_slides WHERE id = ?", [id]);
    await deleteUpload(current.image);
    return NextResponse.json({ success: true, message: "Slide deleted" });
  } catch (error) {
    console.error("DELETE Admin Hero Slide Error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
