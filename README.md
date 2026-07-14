# 时光邮局 (Time Post Office)

> 写一封信，让它穿越时光，在未来的某一天，抵达你念念不忘的人手中。

## 项目简介

时光邮局是一个全栈 Web 应用，允许用户撰写信件并设置未来发送时间，系统将在指定时间通过邮件自动投递。支持多邮箱随机发送、图片和语音附件上传、多种邮件模板、四种云存储后端，以及管理后台的全方位管理功能。

- **H5 用户端**：温暖复古打字机风格，用户可写信、上传图片和语音留言，设置未来时间投递
- **管理后台**：密码保护的完整管理系统，包含概览统计、信件管理、附件管理、邮箱配置、系统设置
- **后端 API**：基于 Next.js 14 App Router，SQLite 数据库，支持 CF Workers 部署

## 技术栈

### 前端

| 技术 | 版本 | 用途 |
|------|------|------|
| React | 18.3 | UI 框架 |
| Next.js | 14.2 (App Router) | 全栈框架 / SSR / API 路由 |
| TypeScript | 5.9 | 类型安全 |
| Tailwind CSS | 3.4 | 原子化 CSS 框架 |
| PostCSS | 8.5 | CSS 后处理 |
| Autoprefixer | 10.5 | CSS 浏览器前缀 |
| MediaRecorder API | (浏览器原生) | 语音录制 |
| Web Audio API | (浏览器原生) | 音频播放 |

### 后端

| 技术 | 版本 | 用途 |
|------|------|------|
| Next.js API Routes | 14.2 | RESTful API |
| better-sqlite3 | 12.11 | 本地 SQLite 数据库 |
| Drizzle ORM | 0.45 (已安装) | 备用 ORM |
| nodemailer | 9.0 | 邮件发送服务 |
| node-cron | 4.6 | 定时任务调度 |
| crypto (Node.js) | 内置 | AES-256-GCM 加密 |

### 云存储 SDK (多后端支持)

| 存储服务 | SDK 包 | 用途 |
|----------|--------|------|
| Cloudflare R2 | @aws-sdk/client-s3 | R2 对象存储 (S3 兼容 API) |
| 腾讯云 COS | cos-nodejs-sdk-v5 | 腾讯云对象存储 |
| 阿里云 OSS | ali-oss | 阿里云对象存储 |
| 七牛云 Kodo | qiniu | 七牛云对象存储 |

### 部署与工具

| 工具 | 用途 |
|------|------|
| Cloudflare Workers | 目标部署平台 |
| Cloudflare D1 | 目标数据库服务 (生产) |
| Wrangler | CF Workers CLI |
| tsx | TypeScript 脚本执行器 |

### UI 设计风格

| 设计元素 | 规格 |
|----------|------|
| 主色调 | 奶油纸色 (#FFF8F0) / 暖棕 (#5C3D2E) / 金棕 (#C9A96E) |
| 强调色 | 暗红棕 (#A0522D) / 墨绿 (#6B8E4E) |
| 字体 | Georgia / Times New Roman (衬线) + 系统无衬线 |
| 风格 | 温暖复古 / 纸质纹理 / 打字机审美 |

## 项目结构

```
time-post-office/
├── src/
│   ├── app/
│   │   ├── page.tsx                          # H5 首页
│   │   ├── layout.tsx                        # 根布局
│   │   ├── globals.css                       # 全局样式 + Tailwind
│   │   ├── write/
│   │   │   └── page.tsx                      # H5 写信页 (含附件上传)
│   │   ├── admin/
│   │   │   ├── layout.tsx                    # 管理后台布局 + 导航
│   │   │   ├── page.tsx                      # 概览统计
│   │   │   ├── login/
│   │   │   │   └── page.tsx                  # 后台登录页
│   │   │   ├── letters/
│   │   │   │   └── page.tsx                  # 信件管理 (列表/详情/附件展示)
│   │   │   ├── attachments/
│   │   │   │   └── page.tsx                  # 附件管理 (统计/筛选/状态修改/审批删除)
│   │   │   ├── emails/
│   │   │   │   └── page.tsx                  # 邮箱配置管理
│   │   │   └── settings/
│   │   │       └── page.tsx                  # 系统设置 (站点信息/邮件模板/存储配置)
│   │   └── api/
│   │       ├── letters/
│   │       │   └── route.ts                  # 信件提交 API
│   │       ├── upload/
│   │       │   └── route.ts                  # 文件上传 API
│   │       ├── files/
│   │       │   └── [name]/
│   │       │       └── route.ts              # 本地文件静态服务
│   │       ├── cron/
│   │       │   └── route.ts                  # Cron 触发端点
│   │       └── admin/
│   │           ├── login/
│   │           │   └── route.ts              # 登录/登出 API
│   │           ├── letters/
│   │           │   ├── route.ts              # 信件列表 API
│   │           │   └── [id]/
│   │           │       └── route.ts          # 信件详情/删除 API
│   │           ├── attachments/
│   │           │   ├── route.ts              # 附件列表/批量操作 API
│   │           │   └── [id]/
│   │           │       └── route.ts          # 附件单项 (状态修改/删除) API
│   │           ├── emails/
│   │           │   ├── route.ts              # 邮箱列表/创建 API
│   │           │   └── [id]/
│   │           │       └── route.ts          # 邮箱修改/删除 API
│   │           ├── settings/
│   │           │   ├── route.ts              # 设置读写 API
│   │           │   ├── preview/
│   │           │   │   └── route.ts          # 邮件模板预览 API
│   │           │   └── verify/
│   │           │       └── route.ts          # 存储连通性验证 API
│   │           └── templates/
│   │               └── route.ts              # 自定义模板 CRUD API
│   ├── components/
│   │   ├── ImageUploader.tsx                 # 图片上传组件 (网格缩略图/预览/删除)
│   │   └── VoiceRecorder.tsx                 # 语音录制组件 (录音/波形/播放)
│   ├── lib/
│   │   ├── db.ts                             # SQLite 数据库初始化 + 表迁移
│   │   ├── mailer.ts                         # 邮件发送 + 8 预设模板 + 自定义模板
│   │   └── storage/
│   │       ├── types.ts                      # StorageConfig / StorageDriver / UploadResult 接口
│   │       ├── crypto.ts                     # AES-256-GCM 加解密 (存储凭据加密)
│   │       ├── manager.ts                    # StorageManager (驱动选择/本地降级)
│   │       ├── local.ts                      # 本地文件系统存储驱动
│   │       ├── r2.ts                         # Cloudflare R2 驱动
│   │       ├── cos.ts                        # 腾讯云 COS 驱动
│   │       ├── oss.ts                        # 阿里云 OSS 驱动
│   │       └── kodo.ts                       # 七牛云 Kodo 驱动
│   └── middleware.ts                         # 管理后台登录鉴权 (admin_token cookie)
├── scripts/
│   ├── scheduler.ts                          # 定时任务 (邮件发送 + 附件过期检查)
│   └── init-db.ts                            # 数据库初始化脚本
├── data/
│   ├── timepost.db                           # SQLite 数据库文件
│   └── uploads/                              # 本地文件存储目录
├── .env.local                                # 环境变量 (ADMIN_PASSWORD / R2_*)
├── .env.example                              # 环境变量模板
├── package.json
├── tsconfig.json
├── next.config.mjs
├── tailwind.config.ts
├── postcss.config.mjs
├── wrangler.toml                             # CF Workers 部署配置
└── .monkeycode/
    └── specs/
        └── media-attachments/
            ├── requirements.md               # 附件功能需求文档
            ├── design.md                     # 附件功能设计文档
            └── tasklist.md                   # 附件功能实施计划
```

## 数据库设计

### letters 表 (信件)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT PK | UUID |
| recipient_email | TEXT NOT NULL | 收件人邮箱 |
| recipient_name | TEXT | 收件人姓名 |
| sender_name | TEXT | 寄件人署名 |
| subject | TEXT | 信件主题 |
| content | TEXT | 信件正文 |
| send_at | TEXT NOT NULL | 预约发送时间 (ISO 8601) |
| status | TEXT DEFAULT 'pending' | 状态: pending/sent/failed |
| sent_at | TEXT | 实际发送时间 |
| error_msg | TEXT | 发送失败原因 |
| email_config_id | TEXT | 使用的邮箱配置 ID |
| created_at | TEXT | 创建时间 |

### email_configs 表 (邮箱配置)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT PK | UUID |
| name | TEXT | 配置名称 |
| smtp_host | TEXT | SMTP 服务器地址 |
| smtp_port | INTEGER | SMTP 端口 |
| smtp_user | TEXT | SMTP 用户名 |
| smtp_pass | TEXT | SMTP 密码 |
| from_name | TEXT | 发件人显示名称 |
| from_email | TEXT | 发件人邮箱 |
| is_active | INTEGER | 是否启用 (1/0) |
| created_at | TEXT | 创建时间 |

### attachments 表 (附件)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT PK | UUID |
| letter_id | TEXT FK | 关联信件 ID |
| type | TEXT CHECK | 类型: image/audio |
| file_name | TEXT | 原始文件名 |
| file_size | INTEGER | 文件大小 (bytes) |
| mime_type | TEXT | MIME 类型 |
| storage_provider | TEXT | 存储服务: r2/cos/oss/kodo/local |
| storage_key | TEXT | 存储中的 key |
| storage_url | TEXT | 可访问 URL |
| status | TEXT CHECK | 状态: active/expiring/expired/pending_delete/deleted |
| expires_at | TEXT | 过期时间 (上传时间 + 180 天) |
| uploaded_at | TEXT | 上传时间 |
| deleted_at | TEXT | 删除时间 |

### settings 表 (系统设置)

| 常用 Key | 说明 |
|----------|------|
| site_name | 站点名称 |
| site_subtitle | 副标题 |
| footer_text | 页脚文字 |
| active_template | 当前邮件模板 ID |
| custom_template_list | 自定义模板列表 (JSON) |
| custom_template_html_{id} | 自定义模板 HTML |
| storage_provider | 当前存储服务: r2/cos/oss/kodo |
| storage_{provider}_config | 各服务配置 (JSON/AES 加密) |

## 功能清单

### H5 用户端 (前台)

- [x] 首页：暖色调复古设计，引导进入写信页
- [x] 写信页：表单填写收件人/寄件人/主题/正文/发送时间
- [x] 图片附件：最多 9 张，单张 ≤ 20MB，缩略图网格展示，大图预览
- [x] 语音留言：浏览器录音，最长 180 秒，播放预览
- [x] 时间验证：发送时间必须为未来时间
- [x] 邮箱验证：基础格式校验
- [x] 提交反馈：成功/失败状态提示
- [x] 灵活组合：纯文本 / 文本+图片 / 文本+语音 / 文本+图片+语音 / 图片+语音 / 图片 / 语音

### 管理后台

- [x] 登录鉴权：密码登录，middleware 保护所有 /admin/* 路由
- [x] 概览统计：总信件 / 待发送 / 已发送 / 失败 / 附件统计 / 邮箱数量
- [x] 信件管理：列表/筛选/详情弹窗/附件展示/删除
- [x] 附件管理：统计卡片/筛选列表/详情预览/状态修改/审批删除/手动删除
- [x] 邮箱配置：SMTP 增删改/启用禁用/多邮箱随机发送
- [x] 系统设置：站点信息 (名称/副标题/页脚)
- [x] 邮件模板：8 个预设模板 + 自定义模板 CRUD + 预览
- [x] 存储配置：CF R2 (环境变量) / COS / OSS / Kodo 四选一 + 连通性验证

### 邮件模板预设 (8 个)

| 编号 | 名称 | 风格 |
|------|------|------|
| 1 | 经典信笺 | 暖棕信封 / 烫金标题 |
| 2 | 简约雅致 | 白底灰字 / 极简卡片 |
| 3 | 暗夜星光 | 深色星空主题 |
| 4 | 花信风 | 粉色柔美花卉 |
| 5 | 墨韵书香 | 中式黑白书法感 |
| 6 | 秋日私语 | 暖橙秋日落叶 |
| 7 | 碧海潮生 | 蓝色海洋主题 |
| 8 | 极简白 | 纯白专注内容 |

### 存储后端 (4 种支持)

| 服务 | 配置方式 | 说明 |
|------|----------|------|
| Cloudflare R2 | 环境变量 | `R2_ENDPOINT` / `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` / `R2_BUCKET` / `R2_REGION` / `R2_CUSTOM_DOMAIN` |
| 腾讯云 COS | 管理后台 | 密钥 AES-256-GCM 加密存储 |
| 阿里云 OSS | 管理后台 | 密钥 AES-256-GCM 加密存储 |
| 七牛云 Kodo | 管理后台 | 密钥 AES-256-GCM 加密存储 |
| 本地文件 | 自动降级 | 当云存储未配置时自动使用 `data/uploads/` 目录 |

### 定时任务

| 任务 | 频率 | 说明 |
|------|------|------|
| 邮件发送 | 每分钟 | 检查并发送所有 `send_at <= now` 的 pending 信件 |
| 附件过期标记 | 每天凌晨 3:00 | 距过期 ≤ 7 天标记 `expiring`，已过期标记 `expired` |

## 附件生命周期

```
上传 (status=active, expires_at=+180天)
  │
  ├── 距过期 ≤ 7 天 → status=expiring
  │
  └── 已过期 → status=expired
       │
       ├── 管理员审批"同意删除" → 从存储删除 → status=deleted
       ├── 管理员审批"暂不删除" → expires_at+30天 → status=active
       ├── 管理员手动改状态 → 任意状态（下拉切换）
       └── 管理员手动删除 → 从存储删除 → status=deleted
```

## 环境变量

```bash
# 管理后台密码 (不设置默认为 admin123)
ADMIN_PASSWORD=your-password-here

# Cloudflare R2 存储 (可选，未配置时使用本地存储)
R2_ENDPOINT=https://xxx.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
R2_BUCKET=my-bucket
R2_REGION=auto
R2_CUSTOM_DOMAIN=https://cdn.example.com

# AES 加密密钥 (可选，不设置使用默认密钥)
STORAGE_ENCRYPTION_KEY=your-32-char-encryption-key
```

## 启动说明

### 开发环境

```bash
# 安装依赖
npm install

# 初始化数据库
npm run db:init

# 启动开发服务器
npm run dev

# 启动定时发送服务 (另一个终端)
npm run scheduler
```

### 构建部署

```bash
# 构建
npm run build

# 生产启动
npm run start
```

### Cloudflare Workers 部署

```bash
# 创建 D1 数据库
npx wrangler d1 create timepost-db

# 将 database_id 填入 wrangler.toml

# 部署
npx wrangler deploy
```

## 开发进度

### 已完成 (v1.0)

| 功能模块 | 状态 | 说明 |
|----------|------|------|
| 项目初始化 | 已完成 | Next.js 14 + TypeScript + Tailwind |
| 数据库设计 | 已完成 | SQLite 4 表 (letters/email_configs/attachments/settings) |
| H5 首页 | 已完成 | 复古打字机风格 |
| 写信页面 | 已完成 | 表单 + 图片上传 + 语音录制 |
| 管理后台登录 | 已完成 | middleware 鉴权 + cookie |
| 管理后台概览 | 已完成 | 统计数据卡片 |
| 信件管理 | 已完成 | 列表/筛选/详情/附件/删除 |
| 附件管理 | 已完成 | 统计/筛选/状态修改/审批/删除 |
| 邮箱配置管理 | 已完成 | SMTP 增删改/启用禁用 |
| 系统设置 | 已完成 | 站点信息/邮件模板/存储配置 |
| 邮件模板 | 已完成 | 8 预设 + 自定义 CRUD + 预览 |
| 邮件发送 | 已完成 | nodemailer + 多邮箱随机 + 附件内嵌 |
| 存储抽象层 | 已完成 | R2/COS/OSS/Kodo 四驱 + 本地降级 |
| 定时任务 | 已完成 | 邮件发送 + 附件过期检查 |
| 附件生命周期 | 已完成 | 180 天保留 + 审批删除/延长/手动管理 |

### 待完成

| 功能模块 | 状态 | 说明 |
|----------|------|------|
| CF Workers 适配 | 未开始 | D1 数据库迁移 / 边缘函数适配 |
| 邮件队列重试 | 未开始 | 发送失败自动重试机制 |
| 收件人取消订阅 | 未开始 | 退订链接 |
| 信件预览 (H5) | 未开始 | 写信前预览最终邮件样式 |
| 邮件发送日志 | 未开始 | 详细日志查询 |
| 数据导出 | 未开始 | CSV/JSON 导出 |
| 单元测试 | 未开始 | Vitest 测试套件 |
| E2E 测试 | 未开始 | Playwright 端到端测试 |

## API 路由一览

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/letters | 提交信件 (支持 attachment_ids) |
| POST | /api/upload | 上传图片/语音 |
| GET | /api/files/[name] | 获取本地存储文件 |
| POST | /api/admin/login | 管理后台登录 |
| DELETE | /api/admin/login | 管理后台登出 |
| GET | /api/admin/letters | 信件列表 |
| GET/PUT/DELETE | /api/admin/letters/[id] | 信件详情/修改/删除 |
| GET/POST | /api/admin/attachments | 附件列表/批量操作 (approve/extend) |
| PUT/DELETE | /api/admin/attachments/[id] | 附件单项 (状态修改/删除) |
| GET/POST | /api/admin/emails | 邮箱列表/创建 |
| PUT/DELETE | /api/admin/emails/[id] | 邮箱修改/删除 |
| GET/PUT | /api/admin/settings | 系统设置读写 |
| GET | /api/admin/settings/preview | 邮件模板预览 |
| POST | /api/admin/settings/verify | 存储连通性验证 |
| GET/POST/PUT/DELETE | /api/admin/templates | 自定义模板 CRUD |
| GET | /api/cron | Cron 触发器 |

## 关键实现细节

### 存储凭据加密

非 R2 的云存储凭据 (COS/OSS/Kodo) 在管理后台填写后，使用 AES-256-GCM 加密存入 `settings` 表。加密密钥从环境变量 `STORAGE_ENCRYPTION_KEY` 读取，未设置时使用内置默认密钥。

### 邮件附件处理

发送邮件时读取关联的 attachments 记录：
- 图片附件通过 HTTP 获取后以 `cid` 内嵌方式嵌入邮件正文
- 语音附件在邮件底部以下载链接形式提供

### 附件上传限制

| 类型 | 最大单文件 | 最大数量 | 允许格式 |
|------|-----------|---------|---------|
| 图片 | 20MB | 9 张 | jpg/png/gif/webp |
| 语音 | 30MB | 1 条 | webm/mp3/wav/ogg/m4a |

### 管理后台默认密码

`admin123` (在 `.env.local` 中通过 `ADMIN_PASSWORD` 修改)
