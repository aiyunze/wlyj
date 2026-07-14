import { NextRequest, NextResponse } from "next/server";
import { PRESET_TEMPLATES } from "../../../../../lib/mailer";
import { getCustomTemplateHtml } from "../../../../../lib/mailer";
import { getDb } from "../../../../../lib/db";

const SAMPLE_CONTENT =
  "嘿，当你读到这封信的时候，已经是十年之后了吧。<br><br>" +
  "不知道那时候的你是不是还像现在一样，每天忙碌却不知道自己在忙什么。" +
  "今天窗外的梧桐叶又落了一地，我想起了我们一起在树下捡叶子的那个秋天。" +
  "<br><br>无论怎样，希望十年后的你，依然保有一点点今天的单纯和热情。";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key") || "1";

  const db = await getDb();
  const siteNameRow = await db
    .prepare("SELECT value FROM settings WHERE key = 'site_name'")
    .get() as { value: string } | undefined;
  const siteName = siteNameRow?.value || "时光邮局";

  let templateHtml: string;
  const preset = PRESET_TEMPLATES.find((t) => t.key === key);
  if (preset) {
    templateHtml = preset.html;
  } else {
    const customHtml = getCustomTemplateHtml(key);
    templateHtml = customHtml || PRESET_TEMPLATES[0].html;
  }

  const html = templateHtml
    .replace(/\{\{site_name\}\}/g, siteName)
    .replace(/\{\{sender_name\}\}/g, "张小凡")
    .replace(/\{\{recipient_name\}\}/g, "李小萌")
    .replace(/\{\{subject\}\}/g, "十年后的你，还好吗")
    .replace(/\{\{content\}\}/g, SAMPLE_CONTENT)
    .replace(/\{\{from_name\}\}/g, "时光邮局");

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
