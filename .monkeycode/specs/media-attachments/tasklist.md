# 实施计划: 信件多媒体附件功能

- [ ] 1. 安装云存储 SDK 依赖
   - 安装 `@aws-sdk/client-s3 cos-nodejs-sdk-v5 ali-oss qiniu`
   - 验证安装成功

- [ ] 2. 数据库表迁移
   - 在 `src/lib/db.ts` 的 `initTables` 中新增 `attachments` 表（含索引）
   - 新增 `storage_configs` 默认设置行
   - 重启后验证表创建成功

- [ ] 3. 实现存储抽象层
   - [ ] 3.1 创建 `src/lib/storage/types.ts`：定义 StorageConfig、StorageDriver、UploadResult 接口
   - [ ] 3.2 创建 `src/lib/storage/crypto.ts`：AES-256-GCM 加解密工具函数（encryptConfig/decryptConfig）
   - [ ] 3.3 创建 `src/lib/storage/r2.ts`：CF R2 驱动（基于 @aws-sdk/client-s3 的 PutObjectCommand）
   - [ ] 3.4 创建 `src/lib/storage/cos.ts`：腾讯云 COS 驱动（基于 cos-nodejs-sdk-v5）
   - [ ] 3.5 创建 `src/lib/storage/oss.ts`：阿里云 OSS 驱动（基于 ali-oss）
   - [ ] 3.6 创建 `src/lib/storage/kodo.ts`：七牛云 Kodo 驱动（基于 qiniu SDK）
   - [ ] 3.7 创建 `src/lib/storage/manager.ts`：StorageManager 统一入口，根据配置选择驱动

- [ ] 4. 创建上传 API
   - 创建 `src/app/api/upload/route.ts`：POST 接收 multipart/form-data（file + letter_id），校验大小/格式，调用 StorageManager 上传，写入 attachments 表

- [ ] 5. 更新信件 API
   - 修改 `src/app/api/letters/route.ts`：POST 支持接收 `attachment_ids` 字段，关联已有附件到新信件

- [ ] 6. 创建附件管理 API
   - 创建 `src/app/api/admin/attachments/route.ts`：
     - GET 查询附件列表（分页、按 status 筛选）
     - POST approve 审批删除（从存储和数据库删除）
     - POST extend 延长保留期 30 天

- [ ] 7. 管理后台新增存储配置
   - 修改 `src/app/admin/settings/page.tsx`：增加「存储配置」标签页，支持选择服务类型、填写各云配置字段、保存/验证连通性

- [ ] 8. 存储配置读写 API
   - 修改 `src/app/api/admin/settings/route.ts`：POST 新增 `verify_storage` 验证连通性端点
   - GET settings 返回当前存储配置（密钥字段脱敏）

- [ ] 9. 创建前端上传组件
   - [ ] 9.1 创建 `src/components/ImageUploader.tsx`：网格上传（点击选择/拖拽），缩略图预览，单张删除，最多 9 张/20MB
   - [ ] 9.2 创建 `src/components/VoiceRecorder.tsx`：MediaRecorder 录音（最长 180s），停止后自动上传，播放试听/删除

- [ ] 10. 改造写信页面
   - 修改 `src/app/write/page.tsx`：表单底部集成 ImageUploader 和 VoiceRecorder，收集 attachment_ids 随表单提交

- [ ] 11. 创建管理后台附件页面
   - 创建 `src/app/admin/attachments/page.tsx`：统计卡片 + 筛选列表 + 详情弹窗（预览/试听）+ 审批操作按钮
   - 更新管理后台侧边栏导航（`layout.tsx`）增加「附件管理」入口

- [ ] 12. 更新信件详情页
   - 修改 `src/app/admin/letters/` 详情视图，展示关联附件（图片缩略图/语音播放条）

- [ ] 13. 更新定时任务
   - 修改 `scripts/scheduler.ts`：新增每日凌晨 3 点过期检查（active → expiring → expired 状态流转）

- [ ] 14. 更新邮件发送
   - 修改 `src/lib/mailer.ts`：`sendLetterEmail` 中读取附件，图片以 cid 内嵌邮件正文，语音附加下载链接

- [ ] 15. 构建验证与测试
   - 执行 `npx next build` 确认零错误
   - 重启开发服务器并预览
