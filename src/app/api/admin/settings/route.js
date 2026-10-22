import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getAdminFromRequest } from "@/lib/hotels";
import { SETTING_FIELDS, getSettings, getFooter, saveFooter, cleanPhone } from "@/lib/settings";

const unauthorized = () => NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

export async function GET(req) {
  try {
    if (!getAdminFromRequest(req)) return unauthorized();
    const [settings, footer] = await Promise.all([getSettings(), getFooter()]);
    return NextResponse.json({ success: true, data: { ...settings, footer } });
  } catch (error) {
    console.error("GET Admin Settings Error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

// ==========================================
// PUT: Save settings  { contact_phone, whatsapp_number, footer }  — any subset; an empty number clears it
// ==========================================
export async function PUT(req) {
  try {
    if (!getAdminFromRequest(req)) return unauthorized();
    const body = await req.json();

    const rows = [];
    for (const [key, label] of Object.entries(SETTING_FIELDS)) {
      if (body[key] === undefined) continue;
      const raw = String(body[key] || "").trim();
      const value = raw ? cleanPhone(raw) : "";
      if (raw && !value) return NextResponse.json({ success: false, error: `${label} must be a valid phone number (10–15 digits)` }, { status: 400 });
      rows.push([key, value || null]);
    }
    if (rows.length) {
      await db.query("INSERT INTO site_settings (setting_key, value) VALUES ? ON DUPLICATE KEY UPDATE value = VALUES(value)", [rows]);
    }
    if (body.footer !== undefined) {
      const email = String(body.footer?.email || "").trim();
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return NextResponse.json({ success: false, error: "Footer email is not a valid email address" }, { status: 400 });
      }
      await saveFooter(body.footer);
    }
    const [settings, footer] = await Promise.all([getSettings(), getFooter()]);
    return NextResponse.json({ success: true, message: "Settings saved", data: { ...settings, footer } });
  } catch (error) {
    console.error("PUT Admin Settings Error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
