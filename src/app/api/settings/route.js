import { NextResponse } from "next/server";
import { getSettings } from "@/lib/settings";

// ==========================================
// GET: Public site settings (default call / WhatsApp numbers)
// ==========================================
export async function GET() {
  try {
    return NextResponse.json({ success: true, data: await getSettings() });
  } catch (error) {
    console.error("GET Settings Error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
