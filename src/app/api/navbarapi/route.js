import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET(req) {
  try {
    // Top 5 categories fetch करने के लिए क्वेरी
    // हम केवल वही कॉलम चुन रहे हैं जिनकी आपने मांग की है
    const query = `
      SELECT id, name, slug 
      FROM project_categories 
      WHERE status = 'ACTIVE' 
      ORDER BY id ASC 
      LIMIT 5
    `;

    const [categories] = await db.query(query);

    return NextResponse.json({
      success: true,
      data: categories,
    }, { status: 200 });

  } catch (error) {
    console.error("Error fetching top 5 project categories:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" }, 
      { status: 500 }
    );
  }
}