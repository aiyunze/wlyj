import { NextRequest, NextResponse } from "next/server";
import { getDb } from "../../../../../lib/db";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const db = await getDb();

    const letter = await db.prepare("SELECT * FROM letters WHERE id = ?").get(id) as any;
    if (!letter) {
      return NextResponse.json({ error: "信件不存在" }, { status: 404 });
    }

    if (body.status) {
      await db.prepare("UPDATE letters SET status = ? WHERE id = ?").run(body.status, id);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const db = await getDb();

    const letter = await db.prepare("SELECT * FROM letters WHERE id = ?").get(id) as any;
    if (!letter) {
      return NextResponse.json({ error: "信件不存在" }, { status: 404 });
    }

    await db.prepare("DELETE FROM letters WHERE id = ?").run(id);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
