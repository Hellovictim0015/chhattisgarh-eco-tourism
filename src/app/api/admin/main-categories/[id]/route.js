import { NextResponse } from "next/server";
import db from "@/lib/db";
import { saveImage, deleteUpload } from "@/lib/uploads";

// Accepts multipart/form-data: name, slug, status, image (optional new file),
// remove_image ("1" to clear the current image). Without either, the image is kept.
export async function PUT(req, { params }) {
  try {

    const { id } = await params;

    const form = await req.formData();
    const name = form.get("name");
    const slug = form.get("slug");
    const status = form.get("status");
    const removeImage = form.get("remove_image") === "1";

    const [rows] = await db.query("SELECT image FROM main_categories WHERE id = ?", [id]);
    if (rows.length === 0) {
      return NextResponse.json({ success: false, message: "Category not found" }, { status: 404 });
    }
    const oldImage = rows[0].image;

    let newImage;
    try {
      newImage = await saveImage(form.get("image"));
    } catch (err) {
      return NextResponse.json({ success: false, message: err.message }, { status: 400 });
    }

    const image = newImage || (removeImage ? null : oldImage);

    await db.query(
      `UPDATE main_categories
       SET
       name = ?,
       slug = ?,
       image = ?,
       status = ?
       WHERE id = ?`,
      [
        name,
        slug,
        image,
        status,
        id
      ]
    );

    if (oldImage && oldImage !== image) await deleteUpload(oldImage);

    return NextResponse.json({
      success: true,
      message: "Category updated successfully"
    });

  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}


export async function DELETE(req, { params }) {
  try {

    const { id } = await params;

    const [rows] = await db.query("SELECT image FROM main_categories WHERE id = ?", [id]);

    await db.query(
      "DELETE FROM main_categories WHERE id = ?",
      [id]
    );

    if (rows[0]?.image) await deleteUpload(rows[0].image);

    return NextResponse.json({
      success: true,
      message: "Category deleted successfully"
    });

  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
