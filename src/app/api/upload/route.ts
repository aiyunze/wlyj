import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getDb } from "../../../lib/db";
import { getStorageDriver, getStorageProvider } from "../../../lib/storage/manager";
import { checkRateLimit, invalidateCache } from "../../../lib/kv";

const MAX_IMAGE_SIZE = 20 * 1024 * 1024;
const MAX_AUDIO_SIZE = 30 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const ALLOWED_AUDIO_PREFIXES = ["audio/"];
const RETENTION_DAYS = 180;

function getExt(fileName: string, contentType: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase();
  if (ext && ext.length <= 5) return ext;
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/gif": "gif",
    "image/webp": "webp",
    "audio/webm": "webm",
    "audio/mp3": "mp3",
    "audio/mpeg": "mp3",
    "audio/wav": "wav",
    "audio/ogg": "ogg",
    "audio/mp4": "m4a",
    "audio/x-m4a": "m4a",
  };
  return map[contentType] || "bin";
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("cf-connecting-ip") || "unknown";
    const rateCheck = await checkRateLimit(`upload:${ip}`, 20, 60);
    if (!rateCheck.allowed) {
      return NextResponse.json({ error: "上传过于频繁，请稍后再试" }, { status: 429 });
    }

    const driver = await getStorageDriver();
    if (!driver) {
      const provider = await getStorageProvider();
      return NextResponse.json(
        { error: `存储服务 (${provider}) 未配置，请在管理后台「存储配置」中填写` },
        { status: 503 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const fileType = formData.get("type") as string | null;

    if (!file) {
      return NextResponse.json({ error: "缺少文件" }, { status: 400 });
    }

    if (!fileType || !["image", "audio"].includes(fileType)) {
      return NextResponse.json({ error: "文件类型无效" }, { status: 400 });
    }

    const contentType = file.type || "application/octet-stream";

    if (fileType === "image") {
      if (!ALLOWED_IMAGE_TYPES.includes(contentType)) {
        return NextResponse.json({ error: "不支持的图片格式，仅支持 jpg/png/gif/webp" }, { status: 400 });
      }
      if (file.size > MAX_IMAGE_SIZE) {
        return NextResponse.json({ error: "图片大小不能超过 20MB" }, { status: 413 });
      }
    }

    if (fileType === "audio") {
      if (file.size > MAX_AUDIO_SIZE) {
        return NextResponse.json({ error: "音频大小不能超过 30MB" }, { status: 413 });
      }
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = getExt(file.name, contentType);
    const fileName = `${randomUUID()}.${ext}`;

    const result = await driver.upload(fileName, buffer, contentType);

    const db = await getDb();
    const id = randomUUID();
    const expiresAt = new Date(Date.now() + RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString();

    await db.prepare(
      `INSERT INTO attachments (id, letter_id, file_type, file_name, file_size, url, storage_provider, storage_key, mime_type, expires_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(id, "", fileType, file.name, file.size, result.url, result.provider, result.key, contentType, expiresAt);

    return NextResponse.json({
      success: true,
      id,
      url: result.url,
      type: fileType,
      file_name: file.name,
      file_size: file.size,
    });
  } catch (err: any) {
    console.error("[Upload] Error:", err.message);
    console.error("[Upload] Stack:", err.stack);
    return NextResponse.json({ error: err.message || "上传失败" }, { status: 500 });
  }
}
