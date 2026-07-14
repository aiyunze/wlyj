import { NextRequest, NextResponse } from "next/server";
import { getDb } from "../../../../../lib/db";
import { encryptString } from "../../../../../lib/storage/crypto";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const db = await getDb();

    const config = await db.prepare("SELECT * FROM email_configs WHERE id = ?").get(id) as any;
    if (!config) {
      return NextResponse.json({ error: "配置不存在" }, { status: 404 });
    }

    const fields: string[] = [];
    const values: any[] = [];

    for (const key of ["name", "smtp_host", "smtp_port", "smtp_user", "smtp_pass", "from_name", "from_email", "is_active"]) {
      if (body[key] !== undefined) {
        fields.push(`${key} = ?`);
        if (key === "smtp_pass") {
          values.push(encryptString(body[key]));
        } else {
          values.push(body[key]);
        }
      }
    }

    if (fields.length > 0) {
      values.push(id);
      await db.prepare(`UPDATE email_configs SET ${fields.join(", ")} WHERE id = ?`).run(...values);
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

    const config = await db.prepare("SELECT * FROM email_configs WHERE id = ?").get(id) as any;
    if (!config) {
      return NextResponse.json({ error: "配置不存在" }, { status: 404 });
    }

    await db.prepare("DELETE FROM email_configs WHERE id = ?").run(id);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
