import { NextRequest, NextResponse } from "next/server";
import { getDb } from "../../../../lib/db";
import { getStorageDriver } from "../../../../lib/storage/manager";

export async function GET(request: NextRequest) {
  const db = await getDb();
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || "";
  const letterId = searchParams.get("letter_id") || "";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const pageSize = 20;
  const offset = (page - 1) * pageSize;

  let whereClause = "WHERE 1=1";
  const params: string[] = [];

  if (status) {
    whereClause += " AND a.status = ?";
    params.push(status);
  }

  if (letterId) {
    whereClause += " AND a.letter_id = ?";
    params.push(letterId);
  }

  const countRow = await db
    .prepare(`SELECT COUNT(*) as total FROM attachments a ${whereClause}`)
    .get(...params) as { total: number };

  const rows = await db
    .prepare(
      `SELECT a.*, l.recipient_email, l.recipient_name, l.sender_name, l.subject
       FROM attachments a
       LEFT JOIN letters l ON a.letter_id = l.id
       ${whereClause}
       ORDER BY a.uploaded_at DESC
       LIMIT ? OFFSET ?`
    )
    .all(...params, pageSize, offset);

  const stats = await db
    .prepare(
      `SELECT
        (SELECT COUNT(*) FROM attachments WHERE status = 'active') as active,
        (SELECT COUNT(*) FROM attachments WHERE status = 'expiring') as expiring,
        (SELECT COUNT(*) FROM attachments WHERE status = 'expired') as expired,
        (SELECT COUNT(*) FROM attachments WHERE status = 'pending_delete') as pending_delete,
        (SELECT COUNT(*) FROM attachments WHERE status = 'deleted') as deleted,
        (SELECT COUNT(*) FROM attachments) as total`
    )
    .get() as Record<string, number>;

  const mappedAttachments = rows.map((row: any) => ({
    ...row,
    type: row.file_type || row.type,
    storage_url: row.url || row.storage_url,
  }));

  return NextResponse.json({
    stats,
    attachments: mappedAttachments,
    page,
    pageSize,
    total: countRow.total,
  });
}

export async function POST(request: NextRequest) {
  const db = await getDb();
  try {
    const body = await request.json();
    const { action, ids } = body;

    if (!action || !ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "参数错误" }, { status: 400 });
    }

    if (action === "approve") {
      const driver = await getStorageDriver();
      const rows = await db
        .prepare(`SELECT * FROM attachments WHERE id IN (${ids.map(() => "?").join(",")})`)
        .all(...ids) as any[];

      for (const row of rows) {
        try {
          if (driver) {
            await driver.delete(row.storage_key);
          }
        } catch {
          // 文件可能已不存在，忽略
        }
        await db.prepare(
          `UPDATE attachments SET status = 'deleted', deleted_at = datetime('now') WHERE id = ?`
        ).run(row.id);
      }

      return NextResponse.json({ success: true, deleted: rows.length });
    }

    if (action === "extend") {
      await db.prepare(
        `UPDATE attachments SET status = 'active', expires_at = datetime(expires_at, '+30 days') WHERE id IN (${ids.map(() => "?").join(",")})`
      ).run(...ids);

      return NextResponse.json({ success: true, extended: ids.length });
    }

    return NextResponse.json({ error: "不支持的操作" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
