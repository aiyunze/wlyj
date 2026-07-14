import nodemailer from "nodemailer";
import { getDb } from "./db";
import { decryptString } from "./storage/crypto";

interface EmailConfig {
  id: string;
  name: string;
  smtp_host: string;
  smtp_port: number;
  smtp_user: string;
  smtp_pass: string;
  from_name: string;
  from_email: string;
  email_type: string;
  yxid: string;
}

function tryDecryptPassword(raw: string): string {
  try {
    return decryptString(raw);
  } catch {
    return raw;
  }
}

interface SendResult {
  success: boolean;
  configId?: string;
  configName?: string;
  error?: string;
}

export const PRESET_TEMPLATES: { key: string; name: string; html: string }[] = [
  {
    key: "1",
    name: "经典信笺",
    html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background-color:#F5E6D3;font-family:Georgia,'Times New Roman',serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F5E6D3;padding:40px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#FFF8F0;border:1px solid #C9A96E;border-radius:4px;box-shadow:0 4px 20px rgba(92,61,46,0.15);">
  <tr>
    <td style="background:linear-gradient(135deg,#5C3D2E,#8B6914);padding:24px 40px;text-align:center;">
      <span style="font-size:14px;color:#C9A96E;letter-spacing:4px;">T I M E &nbsp; P O S T</span>
      <h1 style="color:#FFF8F0;font-size:28px;margin:12px 0 0;font-weight:normal;">{{site_name}}</h1>
    </td>
  </tr>
  <tr>
    <td style="padding:40px;">
      <p style="color:#8B6914;font-size:16px;margin:0 0 8px;">亲爱的 {{recipient_name}}，</p>
      <p style="color:#2C1810;font-size:15px;line-height:1.8;margin:0 0 24px;">
        这是 <strong>{{sender_name}}</strong> 在过去的某个时刻写下的一封信，穿越时光抵达你的信箱。
      </p>
      <div style="border-top:1px dashed #C9A96E;border-bottom:1px dashed #C9A96E;padding:24px 0;margin:0 0 24px;">
        <p style="color:#5C3D2E;font-size:14px;margin:0 0 12px;font-style:italic;">{{subject}}</p>
        <div style="color:#2C1810;font-size:15px;line-height:2;">{{content}}</div>
      </div>
      <p style="color:#8B6914;font-size:14px;margin:0 0 8px;text-align:right;">&mdash; {{sender_name}}</p>
    </td>
  </tr>
  <tr>
    <td style="background-color:#F5E6D3;padding:20px 40px;text-align:center;">
      <p style="color:#8B6914;font-size:12px;margin:0;">由时光邮局投递</p>
    </td>
  </tr>
</table>
</td></tr>
</table>
</body>
</html>`,
  },
  {
    key: "2",
    name: "简约雅致",
    html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background-color:#F9F9F6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F9F9F6;padding:60px 0;">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="background-color:#FFFFFF;border-radius:12px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.06);">
  <tr>
    <td style="padding:36px 48px 24px;text-align:center;border-bottom:1px solid #E8E8E4;">
      <span style="font-size:12px;color:#999;letter-spacing:4px;text-transform:uppercase;">Time Post</span>
      <h1 style="color:#333;font-size:24px;margin:8px 0 0;font-weight:300;letter-spacing:2px;">{{site_name}}</h1>
    </td>
  </tr>
  <tr>
    <td style="padding:36px 48px;">
      <p style="color:#666;font-size:15px;margin:0 0 6px;">{{recipient_name}}，你好</p>
      <p style="color:#999;font-size:14px;line-height:1.8;margin:0 0 28px;">
        {{sender_name}} 在过去的某一天，为你写下了一封信
      </p>
      <div style="background-color:#F9F9F6;border-radius:8px;padding:24px 28px;margin:0 0 28px;">
        <p style="color:#999;font-size:13px;margin:0 0 10px;">{{subject}}</p>
        <div style="color:#444;font-size:14px;line-height:2;">{{content}}</div>
      </div>
      <p style="color:#999;font-size:13px;margin:0;text-align:right;">{{sender_name}}</p>
    </td>
  </tr>
  <tr>
    <td style="padding:20px 48px;text-align:center;background-color:#F9F9F6;border-top:1px solid #E8E8E4;">
      <p style="color:#BBB;font-size:11px;margin:0;">时光邮局 &middot; 穿越时光的信件</p>
    </td>
  </tr>
</table>
</td></tr>
</table>
</body>
</html>`,
  },
  {
    key: "3",
    name: "暗夜星光",
    html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background-color:#1A1A2E;font-family:Georgia,'Times New Roman',serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#1A1A2E;padding:60px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#16213E;border-radius:8px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.4);">
  <tr>
    <td style="background:linear-gradient(135deg,#0F3460,#533483);padding:28px 40px;text-align:center;">
      <span style="font-size:12px;color:rgba(255,255,255,0.4);letter-spacing:6px;">&starf; &nbsp; T I M E &nbsp; P O S T &nbsp; &starf;</span>
      <h1 style="color:#E0E0E0;font-size:26px;margin:10px 0 0;font-weight:300;">{{site_name}}</h1>
    </td>
  </tr>
  <tr>
    <td style="padding:40px;">
      <p style="color:#A0A0B0;font-size:15px;margin:0 0 6px;">致 {{recipient_name}}</p>
      <p style="color:#808090;font-size:14px;line-height:1.8;margin:0 0 28px;">
        穿越漫漫长夜，<strong style="color:#C0C0D0;">{{sender_name}}</strong> 在过去的时光里为你留下了这些话
      </p>
      <div style="border-left:2px solid #533483;padding:0 0 0 20px;margin:0 0 28px;">
        <p style="color:#8888A0;font-size:13px;margin:0 0 10px;">{{subject}}</p>
        <div style="color:#C0C0D0;font-size:15px;line-height:2;">{{content}}</div>
      </div>
      <p style="color:#808090;font-size:14px;margin:0;text-align:right;">&mdash; {{sender_name}}</p>
    </td>
  </tr>
  <tr>
    <td style="padding:16px 40px;text-align:center;background-color:rgba(83,52,131,0.15);">
      <p style="color:rgba(255,255,255,0.25);font-size:11px;margin:0;">时光邮局 &middot; 星光投递</p>
    </td>
  </tr>
</table>
</td></tr>
</table>
</body>
</html>`,
  },
  {
    key: "4",
    name: "花信风",
    html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background-color:#FAF5F0;font-family:Georgia,'Times New Roman',serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#FAF5F0;padding:50px 0;">
<tr><td align="center">
<table width="580" cellpadding="0" cellspacing="0" style="background-color:#FFFFFF;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.04);">
  <tr>
    <td style="background:linear-gradient(135deg,#DB7093,#DDA0DD);padding:32px 40px;text-align:center;">
      <span style="font-size:13px;color:rgba(255,255,255,0.7);letter-spacing:5px;">&#10087; &nbsp; 时 光 邮 局 &nbsp; &#10087;</span>
      <h1 style="color:#FFFFFF;font-size:26px;margin:8px 0 0;font-weight:300;">{{site_name}}</h1>
    </td>
  </tr>
  <tr>
    <td style="padding:36px 44px;">
      <p style="color:#8B6F7A;font-size:15px;margin:0 0 6px;">亲爱的 {{recipient_name}}</p>
      <p style="color:#A08890;font-size:14px;line-height:1.8;margin:0 0 28px;">
        {{sender_name}} 在风起花落的日子里，把思念装进了信封
      </p>
      <div style="background-color:#FFF5F7;border-radius:12px;padding:24px 28px;margin:0 0 28px;border:1px solid #F0D5E0;">
        <p style="color:#C08090;font-size:13px;margin:0 0 10px;">{{subject}}</p>
        <div style="color:#6A5A60;font-size:15px;line-height:2;">{{content}}</div>
      </div>
      <p style="color:#A08890;font-size:14px;margin:0;text-align:right;">{{sender_name}} 寄</p>
    </td>
  </tr>
  <tr>
    <td style="padding:18px 44px;text-align:center;background-color:#FFF5F7;">
      <p style="color:#C0A0B0;font-size:11px;margin:0;">花信如期 &middot; 时光不误</p>
    </td>
  </tr>
</table>
</td></tr>
</table>
</body>
</html>`,
  },
  {
    key: "5",
    name: "墨韵书香",
    html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background-color:#F7F4EF;font-family:'Noto Serif SC',Georgia,serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F7F4EF;padding:50px 0;">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="background-color:#FFFFFF;border:2px solid #2C2C2C;box-shadow:6px 6px 0 rgba(0,0,0,0.05);">
  <tr>
    <td style="padding:40px 48px 0;text-align:center;">
      <span style="font-size:32px;color:#2C2C2C;letter-spacing:8px;font-family:serif;">{{site_name}}</span>
      <div style="width:40px;height:2px;background-color:#2C2C2C;margin:14px auto 0;"></div>
    </td>
  </tr>
  <tr>
    <td style="padding:32px 48px 0;">
      <p style="color:#555;font-size:14px;margin:0 0 4px;font-family:sans-serif;">{{recipient_name}} 亲启</p>
      <p style="color:#999;font-size:13px;line-height:1.8;margin:0 0 0;font-family:sans-serif;">
        {{sender_name}} 致书，见字如晤
      </p>
    </td>
  </tr>
  <tr>
    <td style="padding:20px 48px;">
      <div style="background-color:#FAFAF7;border-left:3px solid #2C2C2C;padding:20px 24px;">
        <p style="color:#888;font-size:12px;margin:0 0 10px;">{{subject}}</p>
        <div style="color:#444;font-size:15px;line-height:2.2;">{{content}}</div>
      </div>
    </td>
  </tr>
  <tr>
    <td style="padding:8px 48px 40px;text-align:right;">
      <p style="color:#888;font-size:13px;margin:0;">{{sender_name}} 顿首</p>
    </td>
  </tr>
  <tr>
    <td style="padding:16px 48px;text-align:center;border-top:1px solid #E8E8E0;">
      <p style="color:#BBB;font-size:11px;margin:0;">纸短情长 &middot; 时光为证</p>
    </td>
  </tr>
</table>
</td></tr>
</table>
</body>
</html>`,
  },
  {
    key: "6",
    name: "秋日私语",
    html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background-color:#FDF6EC;font-family:Georgia,'Times New Roman',serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#FDF6EC;padding:50px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#FFFFFF;border-radius:8px;overflow:hidden;box-shadow:0 6px 24px rgba(180,120,60,0.12);">
  <tr>
    <td style="background:linear-gradient(to right,#D4853A,#C7702E,#B8621A);padding:30px 40px;text-align:center;">
      <span style="font-size:11px;color:rgba(255,255,255,0.5);letter-spacing:4px;">TIME POST OFFICE</span>
      <h1 style="color:#FFFFFF;font-size:26px;margin:8px 0 0;font-weight:300;text-shadow:0 1px 2px rgba(0,0,0,0.15);">{{site_name}}</h1>
    </td>
  </tr>
  <tr>
    <td style="padding:36px 44px;">
      <p style="color:#B8621A;font-size:15px;margin:0 0 4px;font-style:italic;">{{recipient_name}}：</p>
      <p style="color:#9A7A5A;font-size:14px;line-height:1.8;margin:0 0 24px;">
        秋风起时，<strong style="color:#C7702E;">{{sender_name}}</strong> 在落叶纷飞的日子里提笔
      </p>
      <div style="background:linear-gradient(135deg,rgba(212,133,58,0.06),rgba(200,160,100,0.06));border-radius:6px;padding:24px 28px;margin:0 0 24px;">
        <p style="color:#C0A080;font-size:13px;margin:0 0 10px;">{{subject}}</p>
        <div style="color:#6A5040;font-size:15px;line-height:2;">{{content}}</div>
      </div>
      <p style="color:#B09070;font-size:13px;margin:0;text-align:right;">{{sender_name}} &middot; 秋日</p>
    </td>
  </tr>
  <tr>
    <td style="padding:16px 44px;text-align:center;background-color:#FDF6EC;">
      <p style="color:#C0A080;font-size:11px;margin:0;">一叶知秋 &middot; 见信如面</p>
    </td>
  </tr>
</table>
</td></tr>
</table>
</body>
</html>`,
  },
  {
    key: "7",
    name: "碧海潮生",
    html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background-color:#E8F1F6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#E8F1F6;padding:55px 0;">
<tr><td align="center">
<table width="580" cellpadding="0" cellspacing="0" style="background-color:#FFFFFF;border-radius:14px;overflow:hidden;box-shadow:0 4px 20px rgba(30,80,120,0.08);">
  <tr>
    <td style="background:linear-gradient(135deg,#1E5480,#2B7DA0,#38A3C8);padding:30px 40px;text-align:center;">
      <span style="font-size:13px;color:rgba(255,255,255,0.6);letter-spacing:5px;">T I M E &nbsp; P O S T</span>
      <h1 style="color:#FFFFFF;font-size:26px;margin:8px 0 0;font-weight:300;">{{site_name}}</h1>
    </td>
  </tr>
  <tr>
    <td style="padding:36px 44px;">
      <p style="color:#2B7DA0;font-size:15px;margin:0 0 4px;">Hi, {{recipient_name}}</p>
      <p style="color:#6A90A8;font-size:14px;line-height:1.8;margin:0 0 24px;">
        来自 <strong style="color:#1E5480;">{{sender_name}}</strong> 的时光漂流瓶，漂洋过海来看你
      </p>
      <div style="border:1px solid #D0E0EC;border-radius:8px;padding:24px 28px;margin:0 0 24px;">
        <p style="color:#88A8C0;font-size:13px;margin:0 0 8px;text-transform:uppercase;letter-spacing:1px;">{{subject}}</p>
        <div style="color:#4A6A80;font-size:15px;line-height:2;">{{content}}</div>
      </div>
      <p style="color:#80A0B0;font-size:14px;margin:0;text-align:right;">&mdash; {{sender_name}}</p>
    </td>
  </tr>
  <tr>
    <td style="padding:16px 44px;text-align:center;background-color:#F0F6FA;">
      <p style="color:#90B0C0;font-size:11px;margin:0;">潮起潮落 &middot; 信达彼岸</p>
    </td>
  </tr>
</table>
</td></tr>
</table>
</body>
</html>`,
  },
  {
    key: "8",
    name: "极简白",
    html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background-color:#FFFFFF;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#FFFFFF;padding:60px 0;">
<tr><td align="center">
<table width="520" cellpadding="0" cellspacing="0" style="background-color:#FFFFFF;">
  <tr>
    <td style="padding:0 0 32px;text-align:center;">
      <h1 style="color:#111;font-size:20px;margin:0 0 8px;font-weight:400;letter-spacing:4px;">{{site_name}}</h1>
      <div style="width:24px;height:1px;background-color:#CCC;margin:0 auto;"></div>
    </td>
  </tr>
  <tr>
    <td style="padding:0 0 28px;">
      <p style="color:#999;font-size:13px;margin:0 0 4px;">To: {{recipient_name}}</p>
      <p style="color:#CCC;font-size:12px;margin:0;">From: {{sender_name}}</p>
    </td>
  </tr>
  <tr>
    <td style="padding:0 0 28px;">
      <div style="border-top:1px solid #EEE;padding-top:24px;">
        <p style="color:#999;font-size:12px;margin:0 0 8px;letter-spacing:1px;">{{subject}}</p>
        <div style="color:#444;font-size:15px;line-height:2.2;">{{content}}</div>
      </div>
    </td>
  </tr>
  <tr>
    <td style="padding:24px 0 0;text-align:center;border-top:1px solid #F0F0F0;">
      <p style="color:#CCC;font-size:11px;margin:0;">TIME POST</p>
    </td>
  </tr>
</table>
</td></tr>
</table>
</body>
</html>`,
  },
];

export interface CustomTemplate {
  id: string;
  name: string;
}

export async function getCustomTemplates(): Promise<CustomTemplate[]> {
  const db = await getDb();
  const row = (await db.prepare("SELECT value FROM settings WHERE key = 'custom_template_list'").get()) as { value: string } | undefined;
  if (!row) return [];
  try {
    return JSON.parse(row.value);
  } catch {
    return [];
  }
}

export async function getCustomTemplateHtml(id: string): Promise<string | null> {
  const db = await getDb();
  const row = (await db.prepare("SELECT value FROM settings WHERE key = ?").get(`custom_template_html_${id}`)) as { value: string } | undefined;
  return row ? row.value : null;
}

async function getRandomConfig(): Promise<EmailConfig | null> {
  const db = await getDb();
  const rows = (await db
    .prepare("SELECT * FROM email_configs WHERE is_active = 1")
    .all()) as EmailConfig[];

  if (rows.length === 0) return null;

  const configs = rows.map((c) => ({
    ...c,
    smtp_pass: tryDecryptPassword(c.smtp_pass),
  }));

  const idx = Math.floor(Math.random() * configs.length);
  return configs[idx];
}

async function getSetting(key: string, defaultValue: string): Promise<string> {
  const db = await getDb();
  const row = (await db.prepare("SELECT value FROM settings WHERE key = ?").get(key)) as
    | { value: string }
    | undefined;
  return row ? row.value : defaultValue;
}

export async function getTemplateHtml(): Promise<string> {
  const activeKey = await getSetting("active_template", "1");
  const preset = PRESET_TEMPLATES.find((t) => t.key === activeKey);
  if (preset) return preset.html;

  const customHtml = await getCustomTemplateHtml(activeKey);
  if (customHtml) return customHtml;

  return PRESET_TEMPLATES[0].html;
}

async function sendEmailWithResend(
  config: EmailConfig,
  recipientEmail: string,
  senderName: string,
  subject: string,
  htmlContent: string
): Promise<boolean> {
  const apiKey = tryDecryptPassword(config.smtp_pass);
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from: `"${config.from_name || "时光邮局"}" <${config.from_email}>`,
      to: recipientEmail,
      subject: `【时光邮局】${senderName ? senderName + " 寄来的一封信" : "你有一封来自过去的信"}`,
      html: htmlContent,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Resend API 调用失败");
  }

  return true;
}

export async function sendLetterEmail(
  recipientEmail: string,
  recipientName: string,
  senderName: string,
  subject: string,
  content: string,
  letterId?: string
): Promise<SendResult> {
  const config = await getRandomConfig();
  if (!config) {
    return { success: false, error: "没有可用的邮箱配置" };
  }

  try {
    const htmlContent = await buildEmailHtml(
      senderName,
      recipientName,
      subject,
      content
    );

    let finalHtml = htmlContent;

    if (letterId) {
      const db = await getDb();
      const atts = (await db
        .prepare("SELECT * FROM attachments WHERE letter_id = ? AND status != 'deleted'")
        .all(letterId)) as any[];

      const images = atts.filter((a: any) => a.file_type === "image");
      const audios = atts.filter((a: any) => a.file_type === "audio");

      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || "";
      const toFullUrl = (url: string) => {
        if (url.startsWith("http")) return url;
        if (url.startsWith("/") && siteUrl) {
          return siteUrl.replace(/\/$/, "") + url;
        }
        return url;
      };

      let imageHtml = "";

      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        const fullUrl = toFullUrl(img.url || img.storage_url);
        imageHtml += `<p style="text-align:center;margin:16px 0;"><img src="${fullUrl}" style="max-width:100%;border-radius:4px;display:block;margin:0 auto;" alt="${escapeHtml(img.file_name)}" /></p>`;
      }

      if (imageHtml) {
        finalHtml = finalHtml.replace("{{content}}", "{{content}}" + imageHtml);
      }

      let audioHtml = "";
      for (const audio of audios) {
        const fullUrl = toFullUrl(audio.url || audio.storage_url);
        audioHtml +=
          `<div style="text-align:center;margin:16px 0;padding:16px;background:#f5f5f0;border-radius:8px;">` +
          `<div style="font-size:14px;color:#8B6914;margin-bottom:10px;font-weight:500;">🎵 语音留言</div>` +
          `<audio controls style="width:100%;max-width:400px;" src="${fullUrl}">` +
          `您的浏览器不支持音频播放，<a href="${fullUrl}" style="color:#5C3D2E;">点击下载收听</a>` +
          `</audio>` +
          `<div style="font-size:12px;color:#999;margin-top:8px;">${escapeHtml(audio.file_name)}</div>` +
          `</div>`;
      }

      if (audioHtml) {
        finalHtml = finalHtml.replace("{{from_name}}", audioHtml);
      }
    }

    if (config.email_type === "resend") {
      await sendEmailWithResend(config, recipientEmail, senderName, subject, finalHtml);
    } else {
      const transporter = nodemailer.createTransport({
        host: config.smtp_host,
        port: config.smtp_port,
        secure: config.smtp_port === 465,
        auth: {
          user: config.smtp_user,
          pass: config.smtp_pass,
        },
      });

      await transporter.sendMail({
        from: `"${config.from_name}" <${config.from_email}>`,
        to: recipientEmail,
        subject: `【时光邮局】${senderName ? senderName + " 寄来的一封信" : "你有一封来自过去的信"}`,
        html: finalHtml,
      });
    }

    return {
      success: true,
      configId: config.id,
      configName: config.name,
    };
  } catch (err: any) {
    return {
      success: false,
      configId: config.id,
      configName: config.name,
      error: err.message || "发送失败",
    };
  }
}

export async function buildEmailHtml(
  senderName: string,
  recipientName: string,
  subject: string,
  content: string
): Promise<string> {
  const safeContent = content.replace(/\n/g, "<br>");
  const displaySender = senderName || "一位神秘的朋友";
  const displayRecipient = recipientName || "收信人";
  const displaySubject = subject || "无标题";
  const siteName = await getSetting("site_name", "时光邮局");

  const template = await getTemplateHtml();

  return template
    .replace(/\{\{site_name\}\}/g, escapeHtml(siteName))
    .replace(/\{\{sender_name\}\}/g, escapeHtml(displaySender))
    .replace(/\{\{recipient_name\}\}/g, escapeHtml(displayRecipient))
    .replace(/\{\{subject\}\}/g, escapeHtml(displaySubject))
    .replace(/\{\{content\}\}/g, safeContent)
    .replace(/\{\{from_name\}\}/g, "");
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
