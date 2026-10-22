import { NextResponse } from "next/server";
import db from "@/lib/db";
import { userSelectColumns } from "@/lib/usersSchema";

// ==========================================
// GET: List all registered users (excludes password)
// ==========================================
export async function GET() {
  try {
    const [users] = await db.query(
      `SELECT ${await userSelectColumns()}
       FROM users
       ORDER BY created_at DESC`
    );

    const [[{ total }]] = await db.query("SELECT COUNT(*) AS total FROM users");
    const [[{ totalUsers }]] = await db.query("SELECT COUNT(*) AS totalUsers FROM users WHERE role <> 'ADMIN'");
    const [[{ totalAdmins }]] = await db.query("SELECT COUNT(*) AS totalAdmins FROM users WHERE role = 'ADMIN'");

    return NextResponse.json({
      success: true,
      data: users,
      stats: { total, totalUsers, totalAdmins },
    });
  } catch (error) {
    console.error("GET Admin Users Error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
