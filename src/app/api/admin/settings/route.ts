import { NextRequest, NextResponse } from "next/server";
import { getDb } from "../../../../lib/db";
import { getCached, invalidateCache } from "../../../../lib/kv";

const DEFAULTS: Record<string, string> = {
  site_name: "时光邮局",
  site_subtitle: "写一封信，让它穿越时光\n在未来的某一天，抵达你念念不忘的人手中",
  footer_text: "时光流转，文字永恒",
};

export async function GET() {
  try {
    const settings = await getCached<Record<string, string>>("admin:settings", 300, async () => {
      const db = await getDb();
      const rows = await db.prepare("SELECT key, value FROM settings").all() as any[];
      const result: Record<string, string> = { ...DEFAULTS };
      for (const row of rows) {
        result[row.key] = row.value;
      }
      return result;
    });
    return NextResponse.json({ settings });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const db = await getDb();

    const stmt = db.prepare(
      "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value"
    );

    for (const [key, value] of Object.entries(body)) {
      if (typeof value === "string") {
        await stmt.run(key, value);
      }
    }

    await invalidateCache("admin:settings");

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
