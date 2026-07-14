import { NextRequest, NextResponse } from "next/server";
import { getDb } from "../../../lib/db";
import { sendLetterEmail } from "../../../lib/mailer";
import { isValidToken } from "../../../lib/auth";
import { getCronLock, releaseCronLock } from "../../../lib/kv";

function validateCronKey(request: NextRequest): boolean {
  const cronKey = process.env.CRON_API_KEY;
  if (!cronKey) {
    return true;
  }

  const headerKey = request.headers.get("X-Cron-Key");
  const queryKey = new URL(request.url).searchParams.get("key");

  if (headerKey === cronKey || queryKey === cronKey) {
    return true;
  }

  const adminToken = request.cookies.get("admin_token")?.value;
  if (adminToken && isValidToken(adminToken)) {
    return true;
  }

  const cfTrigger = request.headers.get("cf-scheduled");
  if (cfTrigger === "true") {
    return true;
  }

  return false;
}

export async function GET(request: NextRequest) {
  if (!validateCronKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const acquired = await getCronLock();
  if (!acquired) {
    return NextResponse.json({ message: "Cron 任务正在执行中，跳过重复触发" });
  }

  try {
    const db = await getDb();

    const now = new Date().toISOString();
    const pendingLetters = (await db
      .prepare(
        "SELECT * FROM letters WHERE status = 'pending' AND send_at <= ? ORDER BY send_at ASC LIMIT 20"
      )
      .all(now)) as any[];

    const results: any[] = [];

    for (const letter of pendingLetters) {
      const result = await sendLetterEmail(
        letter.recipient_email,
        letter.recipient_name,
        letter.sender_name,
        letter.subject,
        letter.content,
        letter.id
      );

      if (result.success) {
        await db.prepare(
          "UPDATE letters SET status = 'sent', sent_at = ?, email_config_id = ? WHERE id = ?"
        ).run(new Date().toISOString(), result.configId, letter.id);
      } else {
        await db.prepare(
          "UPDATE letters SET status = 'failed', error_msg = ?, email_config_id = ? WHERE id = ?"
        ).run(result.error || "未知错误", result.configId, letter.id);
      }

      results.push({
        id: letter.id,
        recipient: letter.recipient_email,
        success: result.success,
        error: result.error,
        configName: result.configName,
      });
    }

    return NextResponse.json({
      processed: results.length,
      results,
    });
  } finally {
    await releaseCronLock();
  }
}
