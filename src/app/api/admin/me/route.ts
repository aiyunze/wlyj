import { NextRequest, NextResponse } from "next/server";
import { isValidToken, getCurrentUsername, getCurrentPassword } from "../../../../lib/auth";
import { getDb } from "../../../../lib/db";

function getAdminTokenFromRequest(request: NextRequest): string | null {
  const cookieToken = request.cookies.get("admin_token")?.value;
  if (cookieToken) return cookieToken;

  const authHeader = request.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }
  return null;
}

export async function GET(request: NextRequest) {
  try {
    const token = getAdminTokenFromRequest(request);

    if (!token || !isValidToken(token)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getDb();
    const row = await db
      .prepare("SELECT value FROM settings WHERE key = 'admin_password_changed_at'")
      .get() as { value: string } | undefined;

    const isDefaultPassword = getCurrentPassword() === "admin123";

    return NextResponse.json({
      admin: {
        username: getCurrentUsername(),
        role: "superadmin",
        authMethod: isDefaultPassword ? "default" : "custom",
        passwordLastChangedAt: row?.value || null,
        isDefaultPassword,
        currentLoginAt: new Date().toISOString(),
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "服务器错误" }, { status: 500 });
  }
}
