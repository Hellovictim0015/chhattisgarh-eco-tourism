import db from "@/lib/db";

// Settings the admin can edit, with the label shown in Admin -> Settings
export const SETTING_FIELDS = {
  contact_phone: "Call number",
  whatsapp_number: "WhatsApp number",
};

// { key: value } for every editable setting (missing ones come back as "")
export async function getSettings() {
  const [rows] = await db.query("SELECT setting_key, value FROM site_settings WHERE setting_key IN (?)", [Object.keys(SETTING_FIELDS)]);
  const out = Object.fromEntries(Object.keys(SETTING_FIELDS).map((k) => [k, ""]));
  for (const r of rows) out[r.setting_key] = r.value || "";
  return out;
}

// Keeps a phone number's digits and a leading "+"; "" when it has too few digits to dial
export function cleanPhone(value) {
  const s = String(value || "").trim();
  const digits = s.replace(/\D/g, "");
  if (digits.length < 10 || digits.length > 15) return "";
  return (s.startsWith("+") ? "+" : "") + digits;
}
