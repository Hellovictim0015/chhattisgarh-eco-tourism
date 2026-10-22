import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function DELETE(req, { params }) {
  try {
    const { id } = await params;
    await db.query("DELETE FROM top_residential_projects WHERE id = ?", [id]);
    return NextResponse.json({ success: true, message: "Removed successfully" });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    const { id } = await params;
    const { sort_order, status } = await req.json();
    
    await db.query(
      "UPDATE top_residential_projects SET sort_order = ?, status = ? WHERE id = ?", 
      [sort_order, status, id]
    );
    
    return NextResponse.json({ success: true, message: "Updated successfully" });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}