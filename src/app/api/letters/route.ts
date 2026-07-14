import { NextRequest, NextResponse } from "next/server";
import { getDb } from "../../../lib/db";
import { randomUUID } from "crypto";
import { checkRateLimit } from "../../../lib/kv";

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("cf-connecting-ip") || "unknown";
    const rateCheck = await checkRateLimit(`letters:${ip}`, 10, 3600);
    if (!rateCheck.allowed) {
      return NextResponse.json({ error: "写信过于频繁，请一小时后再试" }, { status: 429 });
    }

    const body = await request.json();
    const { recipient_email, recipient_name, sender_name, subject, content, send_at, attachment_ids } = body;

    if (!recipient_email || !send_at) {
      return NextResponse.json(
        { error: "缺少必填字段：收件人邮箱和发送时间" },
        { status: 400 }
      );
    }

    if (!content && (!attachment_ids || attachment_ids.length === 0)) {
      return NextResponse.json(
        { error: "请填写信件内容或上传附件" },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipient_email)) {
      return NextResponse.json({ error: "收件人邮箱格式不正确" }, { status: 400 });
    }

    const sendDate = new Date(send_at);
    if (isNaN(sendDate.getTime())) {
      return NextResponse.json({ error: "发送时间格式不正确" }, { status: 400 });
    }

    if (sendDate <= new Date()) {
      return NextResponse.json({ error: "发送时间必须在未来" }, { status: 400 });
    }

    const id = randomUUID();
    const db = await getDb();

    const seq = (await db.prepare("SELECT COUNT(*) as c FROM letters WHERE letter_no != ''").get()) as { c: number };
    const letterNo = `G${String(seq.c + 1).padStart(6, "0")}`;

    await db.prepare(
      `INSERT INTO letters (id, letter_no, recipient_email, recipient_name, sender_name, subject, content, send_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(id, letterNo, recipient_email, recipient_name || "", sender_name || "", subject || "", content || "", send_at);

    if (attachment_ids && Array.isArray(attachment_ids) && attachment_ids.length > 0) {
      const updateStmt = db.prepare(
        `UPDATE attachments SET letter_id = ? WHERE id = ? AND letter_id = ''`
      );
      const getAttachmentStmt = db.prepare(
        `SELECT file_name, file_type FROM attachments WHERE id = ?`
      );
      const updateNameStmt = db.prepare(
        `UPDATE attachments SET file_name = ? WHERE id = ?`
      );
      for (const attachmentId of attachment_ids) {
        if (typeof attachmentId === "string") {
          await updateStmt.run(id, attachmentId);
          const att = (await getAttachmentStmt.get(attachmentId)) as { file_name: string; file_type: string };
          if (att && att.file_type === "audio") {
            const ext = att.file_name.split(".").pop() || "webm";
            await updateNameStmt.run(`${letterNo}.${ext}`, attachmentId);
          }
        }
      }
    }

    return NextResponse.json({ success: true, id, letter_no: letterNo, send_at });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "服务器错误" }, { status: 500 });
  }
}
