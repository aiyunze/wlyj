import { NextRequest, NextResponse } from "next/server";
import { createR2Driver } from "../../../../../lib/storage/r2";
import { createCOSDriver } from "../../../../../lib/storage/cos";
import { createOSSDriver } from "../../../../../lib/storage/oss";
import { createKodoDriver } from "../../../../../lib/storage/kodo";
import type { StorageConfig } from "../../../../../lib/storage/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { provider, config } = body;

    if (!provider || !config) {
      return NextResponse.json({ error: "缺少参数" }, { status: 400 });
    }

    const storageConfig: StorageConfig = {
      endpoint: config.endpoint || "",
      accessKeyId: config.accessKeyId || "",
      secretAccessKey: config.secretAccessKey || "",
      bucket: config.bucket || "",
      region: config.region || "",
      customDomain: config.customDomain || "",
    };

    let driver;
    switch (provider) {
      case "r2":
        driver = createR2Driver(storageConfig);
        break;
      case "cos":
        driver = createCOSDriver(storageConfig);
        break;
      case "oss":
        driver = createOSSDriver(storageConfig);
        break;
      case "kodo":
        driver = createKodoDriver(storageConfig);
        break;
      default:
        return NextResponse.json({ error: "不支持的存储服务" }, { status: 400 });
    }

    const valid = await driver.validate();
    if (valid) {
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ error: "无法连接到存储服务，请检查配置" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "验证失败" }, { status: 500 });
  }
}
