import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getCurrentUsername, getCurrentPassword } from "../../../../lib/auth";
import { getDb } from "../../../../lib/db";

const DEFAULT_PASSWORD = "admin123";

/** 将 ADMIN_USERNAME / ADMIN_PASSWORD 写入 .env.local，保留文件中其它变量。 */
function updateEnvFile(updates: Record<string, string>) {
  const envPath = path.join(process.cwd(), ".env.local");
  let lines: string[] = [];
  if (fs.existsSync(envPath)) {
    lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  }
  for (const [key, value] of Object.entries(updates)) {
    const prefix = `${key}=`;
    const exists = lines.some((l) => l.startsWith(prefix));
    if (exists) {
      lines = lines.map((l) => (l.startsWith(prefix) ? `${prefix}${value}` : l));
    } else {
      lines.push(`${prefix}${value}`);
    }
  }
  fs.writeFileSync(envPath, lines.join("\n") + "\n", "utf8");
}

export async function PUT(request: NextRequest) {
  try {
    const { currentPassword, newPassword, newUsername } = await request.json();

    const current = getCurrentPassword();
    if (!currentPassword || currentPassword !== current) {
      return NextResponse.json({ error: "当前密码错误" }, { status: 401 });
    }

    const envUpdates: Record<string, string> = {};

    // 修改用户名
    if (newUsername !== undefined) {
      if (!newUsername || typeof newUsername !== "string" || newUsername.length < 3) {
        return NextResponse.json({ error: "用户名长度至少为 3 位" }, { status: 400 });
      }
      envUpdates["ADMIN_USERNAME"] = newUsername;
    }

    // 修改密码
    if (newPassword !== undefined) {
      if (!newPassword || typeof newPassword !== "string" || newPassword.length < 6) {
        return NextResponse.json({ error: "新密码长度至少为 6 位" }, { status: 400 });
      }
      envUpdates["ADMIN_PASSWORD"] = newPassword;
    }

    if (Object.keys(envUpdates).length === 0) {
      return NextResponse.json({ error: "未提供任何修改项" }, { status: 400 });
    }

    // 1) 写入 .env.local 并刷新当前进程环境变量，使本进程登录立即生效
    updateEnvFile(envUpdates);
    if (envUpdates["ADMIN_USERNAME"]) {
      process.env.ADMIN_USERNAME = envUpdates["ADMIN_USERNAME"];
    }
    if (envUpdates["ADMIN_PASSWORD"]) {
      process.env.ADMIN_PASSWORD = envUpdates["ADMIN_PASSWORD"];
    }

    // 2) 记录修改时间
    try {
      const db = await getDb();
      await db.prepare(
        "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value"
      ).run("admin_password_changed_at", new Date().toISOString());
    } catch {
      // ignore db errors
    }

    return NextResponse.json({ success: true, reloadRequired: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "服务器错误" }, { status: 500 });
  }
}
