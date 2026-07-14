import type { StorageConfig, StorageDriver, UploadResult } from "./types";

export function createCOSDriver(config: StorageConfig): StorageDriver {
  const COS = require("cos-nodejs-sdk-v5");
  const cos = new COS({
    SecretId: config.accessKeyId,
    SecretKey: config.secretAccessKey,
  });

  return {
    name: "cos",

    async upload(fileName: string, buffer: Buffer, contentType: string): Promise<UploadResult> {
      const key = `attachments/${Date.now()}-${fileName}`;
      return new Promise((resolve, reject) => {
        cos.putObject(
          {
            Bucket: config.bucket,
            Region: config.region,
            Key: key,
            Body: buffer,
            ContentType: contentType,
          },
          (err: any) => {
            if (err) return reject(err);
            const url = config.customDomain
              ? `${config.customDomain}/${key}`
              : `https://${config.bucket}.cos.${config.region}.myqcloud.com/${key}`;
            resolve({ key, url, provider: "cos" });
          }
        );
      });
    },

    async delete(key: string): Promise<void> {
      return new Promise((resolve, reject) => {
        cos.deleteObject(
          {
            Bucket: config.bucket,
            Region: config.region,
            Key: key,
          },
          (err: any) => {
            if (err) return reject(err);
            resolve();
          }
        );
      });
    },

    async getUrl(key: string): Promise<string> {
      if (config.customDomain) return `${config.customDomain}/${key}`;
      return `https://${config.bucket}.cos.${config.region}.myqcloud.com/${key}`;
    },

    async validate(): Promise<boolean> {
      try {
        return new Promise((resolve) => {
          cos.headBucket(
            { Bucket: config.bucket, Region: config.region },
            (err: any) => resolve(!err)
          );
        });
      } catch {
        return false;
      }
    },
  };
}
