import { NextRequest, NextResponse } from "next/server";
import { getDb } from "../../../../lib/db";
import { randomUUID } from "crypto";
import { invalidateCache } from "../../../../lib/kv";

export async function GET() {
  try {
    const db = await getDb();
    const rows = await db.prepare("SELECT * FROM announcements ORDER BY created_at DESC").all() as any[];
    return NextResponse.json({ announcements: rows });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, content } = body;

    if (!title || !content) {
      return NextResponse.json({ error: "缺少必填字段" }, { status: 400 });
    }

    const id = randomUUID();
    const db = await getDb();

    await db.prepare(
      `INSERT INTO announcements (id, title, content) VALUES (?, ?, ?)`
    ).run(id, title, content);

    await invalidateCache("front:active_announcement");

    return NextResponse.json({ success: true, id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, title, content, is_active } = body;

    if (!id) {
      return NextResponse.json({ error: "缺少 id" }, { status: 400 });
    }

    const db = await getDb();
    const existing = await db.prepare("SELECT * FROM announcements WHERE id = ?").get(id) as any;

    if (!existing) {
      return NextResponse.json({ error: "公告不存在" }, { status: 404 });
    }

    const updates: string[] = [];
    const params: any[] = [];

    if (title !== undefined) {
      updates.push("title = ?");
      params.push(title);
    }
    if (content !== undefined) {
      updates.push("content = ?");
      params.push(content);
    }
    if (is_active !== undefined) {
      updates.push("is_active = ?");
      params.push(is_active);
    }

    if (updates.length === 0) {
      return NextResponse.json({ success: true });
    }

    params.push(id);

    await db.prepare(`UPDATE announcements SET ${updates.join(", ")} WHERE id = ?`).run(...params);

    await invalidateCache("front:active_announcement");

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "缺少 id" }, { status: 400 });
    }

    const db = await getDb();
    await db.prepare("DELETE FROM announcements WHERE id = ?").run(id);

    await invalidateCache("front:active_announcement");

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}