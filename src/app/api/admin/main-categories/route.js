import { NextResponse } from "next/server";
import db from "@/lib/db";
import { saveImage } from "@/lib/uploads";

// Accepts multipart/form-data: name, slug, status, image (optional file)
export async function POST(req) {
  try {
    const form = await req.formData();
    const name = form.get("name");
    const slug = form.get("slug");
    const status = form.get("status");

    if (!name) {
      return NextResponse.json(
        { success: false, message: "Name is required" },
        { status: 400 }
      );
    }

    const [existing] = await db.query(
      "SELECT id FROM main_categories WHERE slug = ?",
      [slug]
    );

    if (existing.length > 0) {
      return NextResponse.json(
        { success: false, message: "Slug already exists" },
        { status: 400 }
      );
    }

    let image;
    try {
      image = await saveImage(form.get("image"));
    } catch (err) {
      return NextResponse.json({ success: false, message: err.message }, { status: 400 });
    }

    const [result] = await db.query(
      `INSERT INTO main_categories
      (name, slug, image, status)
      VALUES (?, ?, ?, ?)`,
      [
        name,
        slug,
        image,
        status || "ACTIVE"
      ]
    );

    return NextResponse.json({
      success: true,
      message: "Category created successfully",
      id: result.insertId
    });

  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {

    const [categories] = await db.query(`
      SELECT *
      FROM main_categories
      ORDER BY id DESC
    `);

    return NextResponse.json({
      success: true,
      data: categories
    });

  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
