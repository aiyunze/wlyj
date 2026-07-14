import type { StorageConfig, StorageDriver, UploadResult } from "./types";

export function createKodoDriver(config: StorageConfig): StorageDriver {
  const qiniu = require("qiniu");

  const mac = new qiniu.auth.digest.Mac(config.accessKeyId, config.secretAccessKey);

  const putPolicy = new qiniu.rs.PutPolicy({
    scope: config.bucket,
    expires: 7200,
  });

  const config_obj = new qiniu.conf.Config();
  config_obj.regionsProvider = qiniu.region[config.region as keyof typeof qiniu.region] || qiniu.region.z2;

  const formUploader = new qiniu.form_up.FormUploader(config_obj);
  const bucketManager = new qiniu.rs.BucketManager(mac, config_obj);

  const domain = config.customDomain || `http://${config.bucket}.${config.region}.qiniucs.com`;

  return {
    name: "kodo",

    async upload(fileName: string, buffer: Buffer, contentType: string): Promise<UploadResult> {
      const key = `attachments/${Date.now()}-${fileName}`;
      const uploadToken = putPolicy.uploadToken(mac);
      return new Promise((resolve, reject) => {
        formUploader.put(
          uploadToken,
          key,
          buffer,
          { mimeType: contentType },
          (err: any, body: any) => {
            if (err) return reject(err);
            resolve({
              key,
              url: `${domain}/${body.key}`,
              provider: "kodo",
            });
          }
        );
      });
    },

    async delete(key: string): Promise<void> {
      return new Promise((resolve, reject) => {
        bucketManager.delete(config.bucket, key, (err: any) => {
          if (err) return reject(err);
          resolve();
        });
      });
    },

    async getUrl(key: string): Promise<string> {
      return `${domain}/${key}`;
    },

    async validate(): Promise<boolean> {
      try {
        return new Promise((resolve) => {
          bucketManager.getBucketInfo(config.bucket, (err: any) => resolve(!err));
        });
      } catch {
        return false;
      }
    },
  };
}
