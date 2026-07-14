import fs from "fs";
import path from "path";
import type { StorageDriver, UploadResult } from "./types";

const UPLOAD_DIR = path.join(process.cwd(), "data", "uploads");

function ensureDir(): void {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
}

export function createLocalDriver(): StorageDriver {
  ensureDir();

  return {
    name: "local",

    async upload(fileName: string, buffer: Buffer, _contentType: string): Promise<UploadResult> {
      const key = fileName;
      const filePath = path.join(UPLOAD_DIR, fileName);
      fs.writeFileSync(filePath, buffer);
      const url = `/api/files/${fileName}`;
      return { key, url, provider: "local" };
    },

    async delete(key: string): Promise<void> {
      const filePath = path.join(UPLOAD_DIR, key);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    },

    async getUrl(key: string): Promise<string> {
      return `/api/files/${key}`;
    },

    async validate(): Promise<boolean> {
      return true;
    },
  };
}
