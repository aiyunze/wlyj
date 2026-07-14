import cron from "node-cron";
import { getDb } from "../src/lib/db";
import { sendLetterEmail } from "../src/lib/mailer";

getDb();

console.log("[时光邮局] 定时发送服务已启动");
console.log("[时光邮局] 每分钟检查一次待发送信件");

cron.schedule("* * * * *", async () => {
  const db = getDb();
  const now = new Date().toISOString();

  const pending = db
    .prepare(
      "SELECT * FROM letters WHERE status = 'pending' AND send_at <= ? ORDER BY send_at ASC LIMIT 10"
    )
    .all(now) as any[];

  if (pending.length === 0) return;

  console.log(`[${new Date().toLocaleString()}] 发现 ${pending.length} 封待发送信件`);

  for (const letter of pending) {
    const result = await sendLetterEmail(
      letter.recipient_email,
      letter.recipient_name,
      letter.sender_name,
      letter.subject,
      letter.content,
      letter.id
    );

    if (result.success) {
      db.prepare(
        "UPDATE letters SET status = 'sent', sent_at = ?, email_config_id = ? WHERE id = ?"
      ).run(new Date().toISOString(), result.configId, letter.id);
      console.log(`  发送成功: ${letter.recipient_email} (${result.configName})`);
    } else {
      db.prepare(
        "UPDATE letters SET status = 'failed', error_msg = ?, email_config_id = ? WHERE id = ?"
      ).run(result.error || "未知错误", result.configId, letter.id);
      console.log(`  发送失败: ${letter.recipient_email} - ${result.error}`);
    }
  }
});

process.on("SIGINT", () => {
  console.log("\n[时光邮局] 服务已停止");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n[时光邮局] 服务已停止");
  process.exit(0);
});

cron.schedule("0 3 * * *", () => {
  const db = getDb();
  const now = new Date().toISOString();

  const expiringResult = db
    .prepare(
      `UPDATE attachments SET status = 'expiring'
       WHERE status = 'active'
       AND expires_at <= datetime('now', '+7 days')`
    )
    .run();
  if (expiringResult.changes > 0) {
    console.log(`[${new Date().toLocaleString()}] 标记了 ${expiringResult.changes} 个即将过期的附件`);
  }

  const expiredResult = db
    .prepare(
      `UPDATE attachments SET status = 'expired'
       WHERE status IN ('active', 'expiring')
       AND expires_at <= datetime('now')`
    )
    .run();
  if (expiredResult.changes > 0) {
    console.log(`[${new Date().toLocaleString()}] 标记了 ${expiredResult.changes} 个已过期的附件`);
  }
});
