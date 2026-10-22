import { NextResponse } from 'next/server';
import db from '@/lib/db'; // Adjust this import based on your DB connection file

export async function GET() {
  try {
    // Fetch all amenities, ordered by the newest first
    const [amenities] = await db.query(
      "SELECT id, name, icon, status, created_at, updated_at FROM amenities ORDER BY created_at DESC"
    );

    return NextResponse.json({
      success: true,
      data: amenities,
    });
  } catch (error) {
    console.error("Failed to fetch amenities:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch amenities" },
      { status: 500 }
    );
  }
}