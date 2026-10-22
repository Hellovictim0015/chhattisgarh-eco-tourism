import { NextResponse } from "next/server";
import db from "@/lib/db";

// GET SINGLE
export async function GET(req, { params }) {
  try {
    const { id } = await params;

    const [rows] = await db.query(
      "SELECT * FROM project_categories WHERE id=?",
      [id]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Category not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: rows[0],
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error.message,
      },
      { status: 500 }
    );
  }
}

// UPDATE
export async function PUT(req, { params }) {
  try {
    const { id } = await params;

    const { name, slug, status } = await req.json();

    await db.query(
      `UPDATE project_categories
       SET
       name=?,
       slug=?,
       status=?
       WHERE id=?`,
      [name, slug, status, id]
    );

    return NextResponse.json({
      success: true,
      message: "Project Category updated successfully",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error.message,
      },
      { status: 500 }
    );
  }
}

// DELETE
export async function DELETE(req, { params }) {
  try {
    const { id } = await params;

    await db.query(
      "DELETE FROM project_categories WHERE id=?",
      [id]
    );

    return NextResponse.json({
      success: true,
      message: "Project Category deleted successfully",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error.message,
      },
      { status: 500 }
    );
  }
}