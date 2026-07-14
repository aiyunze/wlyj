import { NextRequest, NextResponse } from "next/server";
import { getDb } from "../../../../lib/db";
import { randomUUID } from "crypto";
import { getCustomTemplates, getCustomTemplateHtml } from "../../../../lib/mailer";

export async function GET() {
  try {
    const templates = getCustomTemplates();
    return NextResponse.json({ templates });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, html } = body;

    if (!name || !html) {
      return NextResponse.json({ error: "名称和HTML内容不能为空" }, { status: 400 });
    }

    const db = await getDb();
    const id = randomUUID().slice(0, 8);

    const templates = getCustomTemplates();
    templates.push({ id, name });
    await db.prepare(
      "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value"
    ).run("custom_template_list", JSON.stringify(templates));
    await db.prepare(
      "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value"
    ).run(`custom_template_html_${id}`, html);

    return NextResponse.json({ success: true, id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const body = await request.json();

    if (!id) {
      return NextResponse.json({ error: "缺少模板ID" }, { status: 400 });
    }

    const db = await getDb();
    const templates = getCustomTemplates();
    const idx = templates.findIndex((t) => t.id === id);

    if (idx === -1) {
      return NextResponse.json({ error: "模板不存在" }, { status: 404 });
    }

    if (body.name) {
      templates[idx].name = body.name;
      await db.prepare(
        "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value"
      ).run("custom_template_list", JSON.stringify(templates));
    }

    if (body.html) {
      await db.prepare(
        "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value"
      ).run(`custom_template_html_${id}`, body.html);
    }

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
      return NextResponse.json({ error: "缺少模板ID" }, { status: 400 });
    }

    const db = await getDb();
    const templates = getCustomTemplates();
    const filtered = templates.filter((t) => t.id !== id);

    await db.prepare(
      "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value"
    ).run("custom_template_list", JSON.stringify(filtered));
    await db.prepare("DELETE FROM settings WHERE key = ?").run(`custom_template_html_${id}`);

    const activeTemplate = (
      await db.prepare("SELECT value FROM settings WHERE key = 'active_template'").get() as { value: string } | undefined
    );
    if (activeTemplate && activeTemplate.value === id) {
      await db.prepare(
        "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value"
      ).run("active_template", "1");
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
