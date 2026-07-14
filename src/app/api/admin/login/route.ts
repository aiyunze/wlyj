import { NextRequest, NextResponse } from "next/server";
import { getCurrentUsername, getCurrentPassword } from "../../../../lib/auth";
import { getDb } from "../../../../lib/db";
import { decryptString } from "../../../../lib/storage/crypto";
import { createSession, checkRateLimit } from "../../../../lib/kv";

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("cf-connecting-ip") || "unknown";
    const rateCheck = await checkRateLimit(`login:${ip}`, 5, 300);
    if (!rateCheck.allowed) {
      return NextResponse.json({ error: "登录尝试过于频繁，请5分钟后再试" }, { status: 429 });
    }

    const { username, password, twoFactorPassword } = await request.json();
    const adminUsername = getCurrentUsername();
    const adminPassword = getCurrentPassword();

    if (username !== adminUsername || password !== adminPassword) {
      return NextResponse.json({ error: "用户名或密码错误" }, { status: 401 });
    }

    const db = await getDb();
    const enabledRow = await db.prepare("SELECT value FROM settings WHERE key = 'two_factor_enabled'").get() as { value: string } | undefined;
    const passwordRow = await db.prepare("SELECT value FROM settings WHERE key = 'two_factor_password'").get() as { value: string } | undefined;

    if (enabledRow && enabledRow.value === "true" && passwordRow && passwordRow.value) {
      const decrypted = decryptString(passwordRow.value);
      if (!twoFactorPassword || twoFactorPassword !== decrypted) {
        return NextResponse.json({ error: "二级密码错误", twoFactorRequired: true }, { status: 401 });
      }
    }

    const token = await createSession(adminUsername);
    const response = NextResponse.json({ success: true });

    response.cookies.set("admin_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24,
    });

    return response;
  } catch {
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.set("admin_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
