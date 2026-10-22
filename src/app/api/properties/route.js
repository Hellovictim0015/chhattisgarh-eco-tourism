import { NextResponse } from "next/server";
import db from "@/lib/db";

// ==========================================
// GET: Public property search/listing (ACTIVE only)
// ==========================================
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);

    const q = searchParams.get("q");
    const city = searchParams.get("city");
    const listingType = searchParams.get("listing_type");
    const propertyType = searchParams.get("property_type");
    const mainCategoryId = searchParams.get("main_category_id");
    const projectCategoryId = searchParams.get("project_category_id");
    const minPrice = searchParams.get("min_price");
    const maxPrice = searchParams.get("max_price");
    const bedrooms = searchParams.get("bedrooms");
    const bathrooms = searchParams.get("bathrooms");
    const sort = searchParams.get("sort") || "newest";

    const page = Math.max(1, parseInt(searchParams.get("page"), 10) || 1);
    const limit = Math.min(48, Math.max(1, parseInt(searchParams.get("limit"), 10) || 12));
    const offset = (page - 1) * limit;

    const where = ["p.status = 'ACTIVE'"];
    const values = [];

    if (q) {
      where.push("(p.title LIKE ? OR p.location LIKE ? OR p.city LIKE ?)");
      values.push(`%${q}%`, `%${q}%`, `%${q}%`);
    }
    if (city) {
      where.push("p.city LIKE ?");
      values.push(`%${city}%`);
    }
    if (listingType) {
      where.push("p.listing_type = ?");
      values.push(listingType);
    }
    if (propertyType) {
      where.push("p.property_type = ?");
      values.push(propertyType);
    }
    if (mainCategoryId) {
      where.push("p.main_category_id = ?");
      values.push(mainCategoryId);
    }
    if (projectCategoryId) {
      where.push("p.project_category_id = ?");
      values.push(projectCategoryId);
    }
    if (minPrice) {
      where.push("p.price >= ?");
      values.push(minPrice);
    }
    if (maxPrice) {
      where.push("p.price <= ?");
      values.push(maxPrice);
    }
    if (bedrooms) {
      where.push("p.bedrooms >= ?");
      values.push(bedrooms);
    }
    if (bathrooms) {
      where.push("p.bathrooms >= ?");
      values.push(bathrooms);
    }

    const whereSql = where.join(" AND ");

    let orderBy = "p.created_at DESC";
    if (sort === "price_asc") orderBy = "p.price ASC";
    else if (sort === "price_desc") orderBy = "p.price DESC";

    const [countRows] = await db.query(
      `SELECT COUNT(*) AS total FROM properties p WHERE ${whereSql}`,
      values
    );
    const total = countRows[0].total;

    const [properties] = await db.query(
      `SELECT
        p.id, p.title, p.city, p.location, p.price, p.listing_type, p.property_type,
        p.property_sub_type, p.bedrooms, p.bathrooms, p.area_sqft, p.status, p.created_at,
        (SELECT image FROM property_images WHERE property_id = p.id LIMIT 1) as image
      FROM properties p
      WHERE ${whereSql}
      ORDER BY ${orderBy}
      LIMIT ? OFFSET ?`,
      [...values, limit, offset]
    );

    return NextResponse.json({
      success: true,
      data: properties,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  } catch (error) {
    console.error("GET Properties Search Error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
