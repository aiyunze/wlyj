"use client";

import { useEffect, useState } from "react";

interface EmailConfig {
  id: string;
  name: string;
  smtp_host: string;
  smtp_port: number;
  smtp_user: string;
  smtp_pass: string;
  from_name: string;
  from_email: string;
  is_active: number;
  created_at: string;
  email_type: string;
  yxid: string;
}

const defaultForm = {
  name: "",
  smtp_host: "",
  smtp_port: "587",
  smtp_user: "",
  smtp_pass: "",
  from_name: "",
  from_email: "",
  email_type: "smtp",
  api_key: "",
};

const smtpPresets = [
  { name: "QQ邮箱", host: "smtp.qq.com", port: "587", fromName: "时光邮局" },
  { name: "163邮箱", host: "smtp.163.com", port: "465", fromName: "时光邮局" },
  { name: "Gmail", host: "smtp.gmail.com", port: "587", fromName: "Time Post Office" },
  { name: "Outlook", host: "smtp.office365.com", port: "587", fromName: "Time Post Office" },
  { name: "阿里云邮箱", host: "smtp.aliyun.com", port: "465", fromName: "时光邮局" },
  { name: "腾讯企业邮", host: "smtp.exmail.qq.com", port: "465", fromName: "时光邮局" },
];

export default function EmailsPage() {
  const [configs, setConfigs] = useState<EmailConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadConfigs = async () => {
    try {
      const res = await fetch("/api/admin/emails");
      const data = await res.json();
      setConfigs(data.configs || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfigs();
  }, []);

  const openNew = () => {
    setForm(defaultForm);
    setEditingId(null);
    setShowForm(true);
    setError("");
  };

  const openEdit = (config: EmailConfig) => {
    setForm({
      name: config.name,
      smtp_host: config.smtp_host,
      smtp_port: String(config.smtp_port),
      smtp_user: config.smtp_user,
      smtp_pass: config.smtp_pass,
      from_name: config.from_name,
      from_email: config.from_email,
      email_type: config.email_type || "smtp",
      api_key: config.email_type === "resend" ? config.smtp_pass : "",
    });
    setEditingId(config.id);
    setShowForm(true);
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      const payload = {
        ...form,
        smtp_port: parseInt(form.smtp_port) || 587,
        smtp_pass: form.email_type === "resend" ? form.api_key : form.smtp_pass,
      };

      const url = editingId
        ? `/api/admin/emails/${editingId}`
        : "/api/admin/emails";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "保存失败");
        return;
      }

      setShowForm(false);
      loadConfigs();
    } catch {
      setError("网络错误");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除这个邮箱配置吗？")) return;
    await fetch(`/api/admin/emails/${id}`, { method: "DELETE" });
    loadConfigs();
  };

  const handleToggle = async (config: EmailConfig) => {
    await fetch(`/api/admin/emails/${config.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: config.is_active ? 0 : 1 }),
    });
    loadConfigs();
  };

  if (loading) {
    return (
      <div className="text-center py-12 text-sepia/50">加载中...</div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-serif text-2xl text-bark">邮箱配置</h2>
          <p className="text-xs text-sepia/50 mt-1">
            配置多个邮箱，发送信件时会随机选择其中一个
          </p>
        </div>
        <button onClick={openNew} className="vintage-btn-primary vintage-btn-sm">
          添加邮箱
        </button>
      </div>

      {configs.length === 0 && !showForm ? (
        <div className="paper-card p-8 text-center text-sepia/50">
          <p className="mb-3">还没有配置任何邮箱</p>
          <button onClick={openNew} className="vintage-btn-outline vintage-btn-sm">
            添加第一个邮箱
          </button>
        </div>
      ) : (
        <div className="grid gap-3">
          {configs.map((config) => (
            <div key={config.id} className="paper-card p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-bark">
                      {config.yxid && (
                        <span className="text-xs text-sepia/50 mr-1">YX{config.yxid}</span>
                      )}
                      {config.name}
                    </h3>
                    <button
                      onClick={() => handleToggle(config)}
                      className={`text-xs px-2 py-0.5 rounded-sm cursor-pointer transition-colors ${
                        config.is_active
                          ? "bg-moss/20 text-moss"
                          : "bg-rust/20 text-rust"
                      }`}
                    >
                      {config.is_active ? "启用" : "禁用"}
                    </button>
                    <span className="text-xs px-2 py-0.5 rounded-sm bg-sepia/10 text-sepia/60">
                      {config.email_type === "resend" ? "Resend" : "SMTP"}
                    </span>
                  </div>
                  <div className="text-xs text-sepia/60 space-y-0.5">
                    {config.email_type === "resend" ? (
                      <div>
                        发件: {config.from_email}
                        {config.from_name && ` (${config.from_name})`}
                      </div>
                    ) : (
                      <>
                        <div>
                          SMTP: {config.smtp_host}:{config.smtp_port}
                        </div>
                        <div>
                          账号: {config.smtp_user}
                        </div>
                        <div>
                          发件: {config.from_email}
                          {config.from_name && ` (${config.from_name})`}
                        </div>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex gap-1 ml-4">
                  <button
                    onClick={() => openEdit(config)}
                    className="text-xs text-sepia/50 hover:text-bark transition-colors px-2 py-1"
                  >
                    编辑
                  </button>
                  <button
                    onClick={() => handleDelete(config.id)}
                    className="text-xs text-rust/50 hover:text-rust transition-colors px-2 py-1"
                  >
                    删除
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-ink/40 z-50 flex items-center justify-center p-4">
          <div className="paper-card p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h3 className="font-serif text-lg text-bark mb-4">
              {editingId ? "编辑邮箱" : "添加邮箱"}
            </h3>

            <div className="mb-4">
              <label className="block text-xs text-bark/70 mb-2">邮箱类型</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, email_type: "smtp" })}
                  className={`text-xs px-4 py-2 rounded-sm border transition-colors ${
                    form.email_type === "smtp"
                      ? "border-moss bg-moss/10 text-moss"
                      : "border-sepia/30 text-sepia/60 hover:border-bark/50 hover:text-bark"
                  }`}
                >
                  SMTP 邮箱
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, email_type: "resend" })}
                  className={`text-xs px-4 py-2 rounded-sm border transition-colors ${
                    form.email_type === "resend"
                      ? "border-moss bg-moss/10 text-moss"
                      : "border-sepia/30 text-sepia/60 hover:border-bark/50 hover:text-bark"
                  }`}
                >
                  Resend
                </button>
              </div>
            </div>

            {form.email_type === "smtp" && !editingId && (
              <div className="mb-4">
                <label className="block text-xs text-bark/70 mb-2">快速选择邮箱平台</label>
                <div className="flex flex-wrap gap-2">
                  {smtpPresets.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() =>
                        setForm({
                          ...form,
                          name: preset.name,
                          smtp_host: preset.host,
                          smtp_port: preset.port,
                          from_name: preset.fromName,
                        })
                      }
                      className={`text-xs px-3 py-1 rounded-sm border transition-colors ${
                        form.smtp_host === preset.host
                          ? "border-moss bg-moss/10 text-moss"
                          : "border-sepia/30 text-sepia/60 hover:border-bark/50 hover:text-bark"
                      }`}
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs text-bark/70 mb-1">
                  配置名称 <span className="text-rust">*</span>
                </label>
                <input
                  type="text"
                  required
                  className="vintage-input text-sm py-2"
                  placeholder={form.email_type === "resend" ? "例如：Resend 配置" : "例如：公司邮箱"}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>

              {form.email_type === "smtp" && (
                <>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <label className="block text-xs text-bark/70 mb-1">
                        SMTP 服务器 <span className="text-rust">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        className="vintage-input text-sm py-2"
                        placeholder="smtp.example.com"
                        value={form.smtp_host}
                        onChange={(e) =>
                          setForm({ ...form, smtp_host: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-bark/70 mb-1">端口</label>
                      <input
                        type="number"
                        className="vintage-input text-sm py-2"
                        value={form.smtp_port}
                        onChange={(e) =>
                          setForm({ ...form, smtp_port: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-bark/70 mb-1">
                      SMTP 账号 <span className="text-rust">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      className="vintage-input text-sm py-2"
                      placeholder="user@example.com"
                      value={form.smtp_user}
                      onChange={(e) =>
                        setForm({ ...form, smtp_user: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-bark/70 mb-1">
                      SMTP 密码 <span className="text-rust">*</span>
                    </label>
                    <input
                      type="password"
                      required
                      className="vintage-input text-sm py-2"
                      placeholder="授权码或密码"
                      value={form.smtp_pass}
                      onChange={(e) =>
                        setForm({ ...form, smtp_pass: e.target.value })
                      }
                    />
                  </div>
                </>
              )}

              {form.email_type === "resend" && (
                <div>
                  <label className="block text-xs text-bark/70 mb-1">
                    API Key <span className="text-rust">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    className="vintage-input text-sm py-2"
                    placeholder="re_xxxxxxxxxxxxxxxxxxxxxxxx"
                    value={form.api_key}
                    onChange={(e) =>
                      setForm({ ...form, api_key: e.target.value })
                    }
                  />
                </div>
              )}

              <div>
                <label className="block text-xs text-bark/70 mb-1">
                  发件邮箱 <span className="text-rust">*</span>
                </label>
                <input
                  type="email"
                  required
                  className="vintage-input text-sm py-2"
                  placeholder="from@example.com"
                  value={form.from_email}
                  onChange={(e) =>
                    setForm({ ...form, from_email: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-xs text-bark/70 mb-1">
                  发件人名称
                </label>
                <input
                  type="text"
                  className="vintage-input text-sm py-2"
                  placeholder="时光邮局"
                  value={form.from_name}
                  onChange={(e) =>
                    setForm({ ...form, from_name: e.target.value })
                  }
                />
              </div>

              {error && (
                <div className="p-2 bg-rust/10 border border-rust/20 rounded-sm text-rust text-xs">
                  {error}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="vintage-btn-primary vintage-btn-sm flex-1 disabled:opacity-50"
                >
                  {saving ? "保存中..." : "保存"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="vintage-btn-outline vintage-btn-sm"
                >
                  取消
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}