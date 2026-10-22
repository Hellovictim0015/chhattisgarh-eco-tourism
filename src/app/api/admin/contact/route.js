import { NextResponse } from "next/server";
import db from "@/lib/db";

// ==========================================
// GET: List all contact messages (newest first)
// ==========================================
export async function GET() {
  try {
    const [messages] = await db.query(
      "SELECT * FROM contact_messages ORDER BY created_at DESC"
    );
    return NextResponse.json({ success: true, data: messages });
  } catch (error) {
    console.error("GET Contact Messages Error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
