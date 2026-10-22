import { NextResponse } from "next/server";
import { getSettings, getFooter } from "@/lib/settings";

// ==========================================
// GET: Public site settings (default call / WhatsApp numbers) and footer content
// ==========================================
export async function GET() {
  try {
    const [settings, footer] = await Promise.all([getSettings(), getFooter()]);
    return NextResponse.json({ success: true, data: { ...settings, footer } });
  } catch (error) {
    console.error("GET Settings Error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
