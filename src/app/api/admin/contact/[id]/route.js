import { NextResponse } from "next/server";
import db from "@/lib/db";

// ==========================================
// PUT: Update message status (NEW / READ / RESPONDED)
// ==========================================
export async function PUT(req, { params }) {
  try {
    const { id } = await params;
    const { status } = await req.json();

    if (!status) {
      return NextResponse.json({ success: false, error: "Status is required" }, { status: 400 });
    }

    await db.query("UPDATE contact_messages SET status = ? WHERE id = ?", [status, id]);

    return NextResponse.json({ success: true, message: "Status updated" });
  } catch (error) {
    console.error("PUT Contact Message Error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

// ==========================================
// DELETE: Remove a contact message
// ==========================================
export async function DELETE(req, { params }) {
  try {
    const { id } = await params;

    const [result] = await db.query("DELETE FROM contact_messages WHERE id = ?", [id]);

    if (result.affectedRows === 0) {
      return NextResponse.json({ success: false, error: "Message not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Message deleted" });
  } catch (error) {
    console.error("DELETE Contact Message Error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
