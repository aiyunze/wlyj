import { NextRequest, NextResponse } from "next/server";
import { getDb } from "../../../../../lib/db";
import { getStorageDriver } from "../../../../../lib/storage/manager";

export async function PUT(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await _request.json();
    const { status } = body;
    const db = await getDb();

    const validStatuses = ["active", "expiring", "expired", "pending_delete", "deleted"];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json({ error: `无效状态，有效值: ${validStatuses.join(", ")}` }, { status: 400 });
    }

    const existing = await db.prepare("SELECT * FROM attachments WHERE id = ?").get(params.id) as any;
    if (!existing) {
      return NextResponse.json({ error: "附件不存在" }, { status: 404 });
    }

    if (status === "deleted") {
      return NextResponse.json({ error: "删除文件请使用 DELETE 方法" }, { status: 400 });
    }

    const updates: string[] = ["status = ?"];
    const values: string[] = [status];

    if (status === "active") {
      updates.push("expires_at = datetime('now', '+180 days')");
    }
    updates.push("deleted_at = NULL");
    values.push(params.id);

    await db.prepare(`UPDATE attachments SET ${updates.join(", ")} WHERE id = ?`).run(...values);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = await getDb();
    const existing = await db.prepare("SELECT * FROM attachments WHERE id = ?").get(params.id) as any;
    if (!existing) {
      return NextResponse.json({ error: "附件不存在" }, { status: 404 });
    }

    const driver = await getStorageDriver();
    if (driver) {
      try {
        await driver.delete(existing.storage_key);
      } catch (_e) {
        // 文件可能已不存在
      }
    }

    await db.prepare(
      "UPDATE attachments SET status = 'deleted', deleted_at = datetime('now') WHERE id = ?"
    ).run(params.id);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
