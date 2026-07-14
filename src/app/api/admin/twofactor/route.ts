import { NextRequest, NextResponse } from "next/server";
import { getDb } from "../../../../lib/db";
import { encryptString, decryptString } from "../../../../lib/storage/crypto";

export async function GET() {
  try {
    const db = await getDb();
    const row = await db.prepare("SELECT value FROM settings WHERE key = 'two_factor_enabled'").get() as { value: string } | undefined;
    const enabled = row ? row.value === "true" : false;
    return NextResponse.json({ enabled });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { enabled, newPassword } = body;
    const db = await getDb();

    const stmt = db.prepare(
      "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value"
    );

    await stmt.run("two_factor_enabled", enabled ? "true" : "false");

    if (enabled && newPassword) {
      const encrypted = encryptString(newPassword);
      await stmt.run("two_factor_password", encrypted);
    }

    if (!enabled) {
      await stmt.run("two_factor_password", "");
    }

    return NextResponse.json({ success: true, enabled });
  } catch (err: any) {
    console.error("[TwoFactor] PUT error:", err);
    return NextResponse.json({ error: err.message || "操作失败" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password } = body;
    const db = await getDb();

    const enabledRow = await db.prepare("SELECT value FROM settings WHERE key = 'two_factor_enabled'").get() as { value: string } | undefined;
    const passwordRow = await db.prepare("SELECT value FROM settings WHERE key = 'two_factor_password'").get() as { value: string } | undefined;

    if (!enabledRow || enabledRow.value !== "true") {
      return NextResponse.json({ success: true, required: false });
    }

    if (!passwordRow || !passwordRow.value) {
      return NextResponse.json({ success: true, required: false });
    }

    const decrypted = decryptString(passwordRow.value);
    if (password !== decrypted) {
      return NextResponse.json({ success: false, required: true, error: "二级密码错误" }, { status: 401 });
    }

    return NextResponse.json({ success: true, required: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
