import { NextResponse } from "next/server";
import { getDb } from "../../../../../../lib/db";
import { sendLetterEmail } from "../../../../../../lib/mailer";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const db = await getDb();

    const letter = await db.prepare("SELECT * FROM letters WHERE id = ?").get(id) as any;
    if (!letter) {
      return NextResponse.json({ error: "信件不存在" }, { status: 404 });
    }

    if (letter.status !== "pending" && letter.status !== "failed") {
      return NextResponse.json({ error: "只有待发送或发送失败的信件才能发送" }, { status: 400 });
    }

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

      return NextResponse.json({
        success: true,
        recipient: letter.recipient_email,
        configName: result.configName,
      });
    } else {
      await db.prepare(
        "UPDATE letters SET status = 'failed', error_msg = ?, email_config_id = ? WHERE id = ?"
      ).run(result.error || "未知错误", result.configId, letter.id);

      return NextResponse.json({
        success: false,
        error: result.error,
        recipient: letter.recipient_email,
      }, { status: 500 });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "服务器错误" }, { status: 500 });
  }
}
