import { NextRequest, NextResponse } from "next/server";
import { getDb } from "../../../../lib/db";
import { randomUUID } from "crypto";
import { encryptString } from "../../../../lib/storage/crypto";

export async function GET() {
  try {
    const db = await getDb();
    const rows = await db.prepare("SELECT * FROM email_configs ORDER BY created_at DESC").all() as any[];
    const configs = rows.map((c) => {
      const { smtp_pass, ...rest } = c;
      return rest;
    });
    return NextResponse.json({ configs });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

async function generateYXID(db: any): Promise<string> {
  let yxid: string;
  do {
    yxid = Math.floor(100000 + Math.random() * 900000).toString();
  } while (await db.prepare("SELECT id FROM email_configs WHERE yxid = ?").get(yxid));
  return yxid;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, smtp_host, smtp_port, smtp_user, smtp_pass, from_name, from_email, email_type } = body;
    const type = email_type || "smtp";

    if (!name || !from_email) {
      return NextResponse.json(
        { error: "缺少必填字段" },
        { status: 400 }
      );
    }

    if (type === "resend") {
      if (!smtp_pass) {
        return NextResponse.json(
          { error: "缺少 API Key" },
          { status: 400 }
        );
      }
    } else {
      if (!smtp_host || !smtp_user || !smtp_pass) {
        return NextResponse.json(
          { error: "缺少必填字段" },
          { status: 400 }
        );
      }
    }

    const id = randomUUID();
    const db = await getDb();
    const encryptedPass = encryptString(smtp_pass);
    const yxid = await generateYXID(db);

    await db.prepare(
      `INSERT INTO email_configs (id, name, smtp_host, smtp_port, smtp_user, smtp_pass, from_name, from_email, email_type, yxid)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(id, name, smtp_host || "", smtp_port || 587, smtp_user || "", encryptedPass, from_name || "", from_email, type, yxid);

    return NextResponse.json({ success: true, id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, smtp_host, smtp_port, smtp_user, smtp_pass, from_name, from_email, is_active, email_type } = body;

    if (!id) {
      return NextResponse.json({ error: "缺少 id" }, { status: 400 });
    }

    const db = await getDb();
    const existing = await db.prepare("SELECT * FROM email_configs WHERE id = ?").get(id) as any;

    if (!existing) {
      return NextResponse.json({ error: "配置不存在" }, { status: 404 });
    }

    const updates: string[] = [];
    const params: any[] = [];

    if (name !== undefined) {
      updates.push("name = ?");
      params.push(name);
    }
    if (smtp_host !== undefined) {
      updates.push("smtp_host = ?");
      params.push(smtp_host);
    }
    if (smtp_port !== undefined) {
      updates.push("smtp_port = ?");
      params.push(smtp_port);
    }
    if (smtp_user !== undefined) {
      updates.push("smtp_user = ?");
      params.push(smtp_user);
    }
    if (smtp_pass !== undefined && smtp_pass !== "") {
      updates.push("smtp_pass = ?");
      params.push(encryptString(smtp_pass));
    }
    if (from_name !== undefined) {
      updates.push("from_name = ?");
      params.push(from_name);
    }
    if (from_email !== undefined) {
      updates.push("from_email = ?");
      params.push(from_email);
    }
    if (is_active !== undefined) {
      updates.push("is_active = ?");
      params.push(is_active);
    }
    if (email_type !== undefined) {
      updates.push("email_type = ?");
      params.push(email_type);
    }

    if (updates.length === 0) {
      return NextResponse.json({ success: true });
    }

    params.push(id);

    await db.prepare(`UPDATE email_configs SET ${updates.join(", ")} WHERE id = ?`).run(...params);

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
    await db.prepare("DELETE FROM email_configs WHERE id = ?").run(id);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}