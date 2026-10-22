import { NextResponse } from "next/server";
import db from "@/lib/db";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

// Helper function to save files locally
async function saveFileLocally(file) {
  if (!file || typeof file === "string") return null;
  const buffer = Buffer.from(await file.arrayBuffer());
  const filename = `${Date.now()}_${file.name.replace(/\s+/g, "_")}`;
  const uploadDir = path.join(process.cwd(), "uploads");
  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, filename), buffer);
  return `/uploads/${filename}`;
}

export async function GET(req) {
  try {
    // Optional: Get URL parameters for filtering (e.g., ?status=ACTIVE)
    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get("status");

    // Fetch specific columns and grab EXACTLY ONE image from the property_images table
    let query = `
      SELECT 
        p.id,
        p.title,
        p.city,
        p.location,
        p.price,
        p.status,
        (SELECT image FROM property_images WHERE property_id = p.id LIMIT 1) as image
      FROM properties p
    `;
    
    let values = [];

    // Add filtering if a status is provided
    if (statusFilter) {
      query += " WHERE p.status = ?";
      values.push(statusFilter);
    }

    // Order by newest first
    query += " ORDER BY p.created_at DESC";

    const [properties] = await db.query(query, values);

    return NextResponse.json({
      success: true,
      data: properties,
    }, { status: 200 });

  } catch (error) {
    console.error("Failed to fetch properties:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" }, 
      { status: 500 }
    );
  }
}

export async function POST(req) {
  let connection;
  try {
    const formData = await req.formData();

    // ==========================================
    // STEP 1: Extract Main Property Details
    // ==========================================
    const main_category_id = formData.get("main_category_id");
    const project_category_id = formData.get("project_category_id");
    const property_type = formData.get("property_type");
    const listing_type = formData.get("listing_type");
    const property_sub_type = formData.get("property_sub_type");
    const title = formData.get("title");
    
    const slug = formData.get("slug") || null;
    const description = formData.get("description") || null;
    const city = formData.get("city") || null;
    const location = formData.get("location") || null;
    const price = formData.get("price") || null;
    
    let security_deposit = formData.get("security_deposit") || null;
    let maintenance_charge = formData.get("maintenance_charge") || null;
    let lease_duration = formData.get("lease_duration") || null;
    let available_from = formData.get("available_from") || null;
    
    const furnishing = formData.get("furnishing") || null;
    const ownership = formData.get("ownership") || null;
    const facing = formData.get("facing") || null;
    let bedrooms = formData.get("bedrooms") || null;
    const bathrooms = formData.get("bathrooms") || 0;
    const parking = formData.get("parking") || null;
    const area_sqft = formData.get("area_sqft") || null;
    const status = formData.get("status") || 'PENDING';
    const user_id = formData.get("user_id") || null;

    // ==========================================
    // STEP 2: Validations
    // ==========================================
    if (!main_category_id || !project_category_id || !property_type || !listing_type || !property_sub_type || !title) {
      return NextResponse.json(
        { error: "main_category_id, project_category_id, property_type, listing_type, property_sub_type, and title are required" }, 
        { status: 400 }
      );
    }

    if (listing_type === "RENT") {
      if (!price || !security_deposit || !available_from) {
        return NextResponse.json(
          { error: "price, security_deposit, and available_from are required for RENT listings" }, 
          { status: 400 }
        );
      }
    } else if (listing_type === "SELL") {
      security_deposit = null;
      maintenance_charge = null;
      lease_duration = null;
      available_from = null;
    }

    if (property_type === "COMMERCIAL") {
      bedrooms = bedrooms || 0;
    } else {
      bedrooms = bedrooms || 0;
    }

    // ==========================================
    // STEP 3: Database Transaction
    // ==========================================
    connection = await db.getConnection();
    await connection.beginTransaction();

    const propertyQuery = `
      INSERT INTO properties 
      (
        main_category_id, project_category_id, property_type, listing_type, property_sub_type, 
        title, slug, description, city, location, price, security_deposit, maintenance_charge, 
        lease_duration, available_from, furnishing, ownership, facing, bedrooms, bathrooms, 
        parking, area_sqft, status, user_id
      ) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const propertyValues = [
      main_category_id, project_category_id, property_type, listing_type, property_sub_type, 
      title, slug, description, city, location, price, security_deposit, maintenance_charge, 
      lease_duration, available_from, furnishing, ownership, facing, bedrooms, bathrooms, 
      parking, area_sqft, status, user_id
    ];
    
    const [propertyResult] = await connection.query(propertyQuery, propertyValues);
    const newPropertyId = propertyResult.insertId; 

    // ==========================================
    // STEP 4: Handle Amenities
    // ==========================================
    const amenitiesStr = formData.get("amenities");
    if (amenitiesStr) {
      const amenityIds = amenitiesStr.split(",");
      for (const a_id of amenityIds) {
        if (a_id.trim()) {
          await connection.query(
            "INSERT INTO property_amenities (property_id, amenity_id) VALUES (?, ?)", 
            [newPropertyId, a_id.trim()]
          );
        }
      }
    }

    // ==========================================
    // STEP 5: Helper to process and insert files
    // ==========================================
    const processFiles = async (fileKey, table, imageType = null) => {
      const files = formData.getAll(fileKey);
      const titles = formData.getAll(`${fileKey}_titles`); 

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file && typeof file !== "string") {
          const fileUrl = await saveFileLocally(file);
          const fileTitle = titles[i] || null; 

          if (table === "property_images") {
            await connection.query("INSERT INTO property_images (property_id, image, image_type) VALUES (?, ?, ?)", [newPropertyId, fileUrl, imageType]);
          } else if (table === "property_brochures") {
            await connection.query("INSERT INTO property_brochures (property_id, title, pdf_file) VALUES (?, ?, ?)", [newPropertyId, fileTitle, fileUrl]);
          } else if (table === "property_floor_plans") {
            await connection.query("INSERT INTO property_floor_plans (property_id, title, image) VALUES (?, ?, ?)", [newPropertyId, fileTitle, fileUrl]);
          } else if (table === "property_master_plans") {
            await connection.query("INSERT INTO property_master_plans (property_id, image) VALUES (?, ?)", [newPropertyId, fileUrl]);
          }
        }
      }
    };

    // ==========================================
    // STEP 6: Process All Assets Concurrently
    // ==========================================
    await Promise.all([
      processFiles("gallery_images", "property_images", "GALLERY"),
      processFiles("outdoor_images", "property_images", "OUTDOOR"),
      processFiles("indoor_images", "property_images", "INDOOR"),
      processFiles("master_plans", "property_master_plans"),
      processFiles("floor_plans", "property_floor_plans"),
      processFiles("brochures", "property_brochures")
    ]);

    await connection.commit();

    return NextResponse.json({ 
      success: true, 
      message: "Property created successfully",
      property_id: newPropertyId 
    }, { status: 201 });

  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error("Bulk Creation Error:", error);
    return NextResponse.json({ 
      success: false, 
      message: "Property creation failed.", 
      error: error.message 
    }, { status: 500 });
  } finally {
    if (connection) {
      connection.release();
    }
  }
}