import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import type { StorageConfig, StorageDriver, UploadResult } from "./types";

export function createR2Driver(config: StorageConfig): StorageDriver {
  const client = new S3Client({
    region: config.region || "auto",
    endpoint: config.endpoint,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
    forcePathStyle: true,
  });

  return {
    name: "r2",

    async upload(fileName: string, buffer: Buffer, contentType: string): Promise<UploadResult> {
      const key = `attachments/${Date.now()}-${fileName}`;
      await client.send(
        new PutObjectCommand({
          Bucket: config.bucket,
          Key: key,
          Body: buffer,
          ContentType: contentType,
        })
      );
      const url = config.customDomain
        ? `${config.customDomain}/${key}`
        : `${config.endpoint}/${config.bucket}/${key}`;
      return { key, url, provider: "r2" };
    },

    async delete(key: string): Promise<void> {
      await client.send(
        new DeleteObjectCommand({
          Bucket: config.bucket,
          Key: key,
        })
      );
    },

    async getUrl(key: string): Promise<string> {
      if (config.customDomain) return `${config.customDomain}/${key}`;
      return `${config.endpoint}/${config.bucket}/${key}`;
    },

    async validate(): Promise<boolean> {
      try {
        await client.config.credentials();
        return true;
      } catch {
        return false;
      }
    },
  };
}
