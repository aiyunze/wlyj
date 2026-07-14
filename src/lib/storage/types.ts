export interface StorageConfig {
  endpoint: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  region: string;
  customDomain?: string;
}

export interface UploadResult {
  key: string;
  url: string;
  provider: string;
}

export interface StorageDriver {
  name: string;
  upload(fileName: string, buffer: Buffer, contentType: string): Promise<UploadResult>;
  delete(key: string): Promise<void>;
  getUrl(key: string): Promise<string>;
  validate(): Promise<boolean>;
}
