import { NextResponse } from "next/server";
import { setUserActive } from "@/lib/usersSchema";

// ==========================================
// PUT: Activate / deactivate a user account
// ==========================================
export async function PUT(req, { params }) {
  try {
    const { id } = await params;
    const { is_active } = await req.json();

    if (typeof is_active !== "boolean" && is_active !== 0 && is_active !== 1) {
      return NextResponse.json({ success: false, error: "is_active (boolean) is required" }, { status: 400 });
    }

    const affected = await setUserActive(id, !!is_active);

    if (affected === 0) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "User status updated" });
  } catch (error) {
    console.error("PUT Admin User Error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
