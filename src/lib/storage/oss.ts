import type { StorageConfig, StorageDriver, UploadResult } from "./types";

export function createOSSDriver(config: StorageConfig): StorageDriver {
  const OSS = require("ali-oss");

  const client = new OSS({
    region: config.region,
    accessKeyId: config.accessKeyId,
    accessKeySecret: config.secretAccessKey,
    bucket: config.bucket,
    endpoint: config.endpoint,
  });

  return {
    name: "oss",

    async upload(fileName: string, buffer: Buffer, contentType: string): Promise<UploadResult> {
      const key = `attachments/${Date.now()}-${fileName}`;
      const result = await client.put(key, buffer, {
        mime: contentType,
      });
      const url = config.customDomain
        ? `${config.customDomain}/${key}`
        : result.url;
      return { key, url, provider: "oss" };
    },

    async delete(key: string): Promise<void> {
      await client.delete(key);
    },

    async getUrl(key: string): Promise<string> {
      if (config.customDomain) return `${config.customDomain}/${key}`;
      return (await client.signatureUrl(key)).split("?")[0];
    },

    async validate(): Promise<boolean> {
      try {
        await client.getBucketInfo(config.bucket);
        return true;
      } catch {
        return false;
      }
    },
  };
}
