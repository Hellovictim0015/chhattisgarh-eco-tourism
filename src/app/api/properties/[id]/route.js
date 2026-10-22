import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

// ==========================================
// GET: Public property detail (only ACTIVE listings)
// ==========================================
export async function GET(req, { params }) {
  try {
    const { id } = await params;

    const [properties] = await db.query(
      `SELECT
        p.*,
        mc.name AS main_category_name,
        pc.name AS project_category_name
      FROM properties p
      LEFT JOIN main_categories mc ON p.main_category_id = mc.id
      LEFT JOIN project_categories pc ON p.project_category_id = pc.id
      WHERE p.id = ? AND p.status = 'ACTIVE'`,
      [id]
    );

    if (properties.length === 0) {
      return NextResponse.json({ success: false, error: "Property not found" }, { status: 404 });
    }

    const property = properties[0];

    // Count this as a view of the public listing (fire-and-forget alongside the related-data fetch)
    db.query("UPDATE properties SET views = views + 1 WHERE id = ?", [id]).catch((err) =>
      console.error("Failed to increment property views:", err)
    );
    property.views = (property.views || 0) + 1;

    // If the viewer is logged in, record it as a lead for the admin Leads section.
    const user = getUserFromRequest(req);
    if (user) {
      db.query(
        `INSERT INTO property_leads (user_id, property_id, view_count, last_viewed_at)
         VALUES (?, ?, 1, NOW())
         ON DUPLICATE KEY UPDATE view_count = view_count + 1, last_viewed_at = NOW()`,
        [user.id, id]
      ).catch((err) => console.error("Failed to record lead:", err));
    }

    const [[images], [amenities], [floorPlans], [masterPlans], [brochures], [favorites]] = await Promise.all([
      db.query("SELECT id, image, image_type FROM property_images WHERE property_id = ?", [id]),
      db.query(
        `SELECT a.id, a.name, a.icon
         FROM property_amenities pa
         JOIN amenities a ON pa.amenity_id = a.id
         WHERE pa.property_id = ?`,
        [id]
      ),
      db.query("SELECT id, title, image FROM property_floor_plans WHERE property_id = ?", [id]),
      db.query("SELECT id, image FROM property_master_plans WHERE property_id = ?", [id]),
      db.query("SELECT id, title, pdf_file FROM property_brochures WHERE property_id = ?", [id]),
      user
        ? db.query("SELECT id FROM favorites WHERE user_id = ? AND property_id = ?", [user.id, id])
        : Promise.resolve([[]]),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        ...property,
        images,
        amenities,
        floor_plans: floorPlans,
        master_plans: masterPlans,
        brochures,
        is_favorited: favorites.length > 0,
      },
    });
  } catch (error) {
    console.error("GET Property Detail Error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
