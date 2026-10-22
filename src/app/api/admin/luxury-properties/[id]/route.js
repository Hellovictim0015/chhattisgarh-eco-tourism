import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function DELETE(req, { params }) {
  try {
    const { id } = await params;
    await db.query("DELETE FROM luxury_properties WHERE id = ?", [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    const { id } = await params;
    const { sort_order, status } = await req.json();
    await db.query("UPDATE luxury_properties SET sort_order = ?, status = ? WHERE id = ?", [sort_order, status, id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}