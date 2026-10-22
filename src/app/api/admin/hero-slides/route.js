import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getAdminFromRequest } from "@/lib/hotels";
import { readHeroSlideForm } from "@/lib/heroSlides";
import { saveImage, deleteUpload } from "@/lib/uploads";

const unauthorized = () => NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

// ==========================================
// GET: All hero slides (including inactive)
// ==========================================
export async function GET(req) {
  try {
    if (!getAdminFromRequest(req)) return unauthorized();
    const [slides] = await db.query("SELECT * FROM hero_slides ORDER BY sort_order, id");
    return NextResponse.json({ success: true, data: slides });
  } catch (error) {
    console.error("GET Admin Hero Slides Error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

// ==========================================
// POST: Add a slide (multipart: image (required), title, highlight, subtitle, sort_order, status)
// ==========================================
export async function POST(req) {
  let image = null;
  try {
    if (!getAdminFromRequest(req)) return unauthorized();
    const formData = await req.formData();
    const form = readHeroSlideForm(formData);
    if (form.error) return NextResponse.json({ success: false, error: form.error }, { status: 400 });

    image = await saveImage(formData.get("image"));
    if (!image) return NextResponse.json({ success: false, error: "Please upload a banner image" }, { status: 400 });

    const { title, highlight, subtitle, sort_order, status } = form.fields;
    const [res] = await db.query(
      "INSERT INTO hero_slides (image, title, highlight, subtitle, sort_order, status) VALUES (?, ?, ?, ?, ?, ?)",
      [image, title, highlight, subtitle, sort_order, status]
    );
    return NextResponse.json({ success: true, message: "Slide added", id: res.insertId }, { status: 201 });
  } catch (error) {
    await deleteUpload(image);
    console.error("POST Admin Hero Slide Error:", error);
    return NextResponse.json({ success: false, error: error.message || "Could not save slide" }, { status: 500 });
  }
}
