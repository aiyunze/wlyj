import { getDb } from "../db";
import { decryptConfig } from "./crypto";
import { createR2Driver } from "./r2";
import { createCOSDriver } from "./cos";
import { createOSSDriver } from "./oss";
import { createKodoDriver } from "./kodo";
import { createLocalDriver } from "./local";
import type { StorageConfig, StorageDriver } from "./types";

interface R2Bucket {
  put(key: string, value: BodyInit, options?: { contentType?: string }): Promise<void>;
  delete(key: string): Promise<void>;
  get(key: string): Promise<{ body: ReadableStream | null } | null>;
}

declare global {
  var R2_BUCKET: R2Bucket | undefined;
}

async function getSetting(key: string, defaultValue: string): Promise<string> {
  const db = await getDb();
  const row = (await db.prepare("SELECT value FROM settings WHERE key = ?").get(key)) as
    | { value: string }
    | undefined;
  return row ? row.value : defaultValue;
}

export async function getStorageConfig(provider: string): Promise<StorageConfig> {
  if (provider === "r2") {
    return {
      endpoint: process.env.R2_ENDPOINT || "",
      accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
      bucket: process.env.R2_BUCKET || "",
      region: process.env.R2_REGION || "auto",
      customDomain: process.env.R2_CUSTOM_DOMAIN || process.env.R2_PUBLIC_URL || "",
    };
  }

  const raw = await getSetting(`storage_${provider}_config`, "{}");
  if (raw === "{}") return raw as unknown as StorageConfig;
  try {
    if (raw.startsWith("{")) {
      return JSON.parse(raw) as StorageConfig;
    }
    return decryptConfig(raw) as unknown as StorageConfig;
  } catch (_e) {
    return {} as StorageConfig;
  }
}

export async function getStorageProvider(): Promise<string> {
  return getSetting("storage_provider", "r2");
}

function createR2BindingDriver(): StorageDriver {
  const bucket = globalThis.R2_BUCKET;
  const customDomain = process.env.R2_CUSTOM_DOMAIN || process.env.R2_PUBLIC_URL || "";

  return {
    name: "r2",

    async upload(fileName: string, buffer: Buffer, contentType: string): Promise<{ key: string; url: string; provider: string }> {
      const key = `attachments/${Date.now()}-${fileName}`;
      await bucket.put(key, buffer, { contentType });
      const url = customDomain ? `${customDomain}/${key}` : key;
      return { key, url, provider: "r2" };
    },

    async delete(key: string): Promise<void> {
      await bucket.delete(key);
    },

    async getUrl(key: string): Promise<string> {
      if (customDomain) return `${customDomain}/${key}`;
      return key;
    },

    async validate(): Promise<boolean> {
      try {
        await bucket.put("test-validate.txt", "test");
        await bucket.delete("test-validate.txt");
        return true;
      } catch {
        return false;
      }
    },
  };
}

export async function getStorageDriver(): Promise<StorageDriver | null> {
  const provider = await getStorageProvider();

  if (provider === "r2" && globalThis.R2_BUCKET) {
    return createR2BindingDriver();
  }

  const config = await getStorageConfig(provider);

  if (!config.accessKeyId || !config.secretAccessKey || !config.bucket) {
    if (provider === "r2") {
      console.warn("[Storage] R2 环境变量未配置，使用本地存储");
      return createLocalDriver();
    }
    return null;
  }

  switch (provider) {
    case "r2":
      return createR2Driver(config);
    case "cos":
      return createCOSDriver(config);
    case "oss":
      return createOSSDriver(config);
    case "kodo":
      return createKodoDriver(config);
    default:
      return createR2Driver(config);
  }
}
