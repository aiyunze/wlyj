"use client";

import { useEffect, useState } from "react";

interface CustomTemplate {
  id: string;
  name: string;
}

interface Settings {
  site_name: string;
  site_subtitle: string;
  footer_text: string;
  active_template: string;
}

interface PresetInfo {
  key: string;
  name: string;
  desc: string;
}

const PRESETS: PresetInfo[] = [
  { key: "1", name: "经典信笺", desc: "暖色调复古信纸" },
  { key: "2", name: "简约雅致", desc: "白色极简卡片式" },
  { key: "3", name: "暗夜星光", desc: "深色星空主题" },
  { key: "4", name: "花信风", desc: "粉色柔美花卉" },
  { key: "5", name: "墨韵书香", desc: "中式黑白书法感" },
  { key: "6", name: "秋日私语", desc: "暖橙秋日落叶" },
  { key: "7", name: "碧海潮生", desc: "蓝色海洋主题" },
  { key: "8", name: "极简白", desc: "纯白聚焦内容" },
];

const defaultSettings: Settings = {
  site_name: "时光邮局",
  site_subtitle: "写一封信，让它穿越时光\n在未来的某一天，抵达你念念不忘的人手中",
  footer_text: "时光流转，文字永恒",
  active_template: "1",
};


const DEFAULT_CUSTOM_HTML = [
  '<div style="padding:40px;font-family:sans-serif;max-width:600px;margin:0 auto;">',
  '<h1 style="color:#333;">{{site_name}}</h1>',
  '<p style="color:#666;">{{recipient_name}}，你好</p>',
  '<p style="color:#999;font-size:14px;">{{sender_name}} 给你写了一封信</p>',
  '<hr style="border-color:#eee;margin:20px 0;">',
  '<p style="color:#888;font-size:13px;">{{subject}}</p>',
  '<div style="color:#444;line-height:1.8;font-size:15px;">{{content}}</div>',
  '<hr style="border-color:#eee;margin:20px 0;">',
  '<p style="color:#aaa;font-size:12px;">时光邮局</p>',
  '</div>',
].join('\n');

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [activeTab, setActiveTab] = useState<"site" | "email" | "storage" | "security">("site");
  const [previewKey, setPreviewKey] = useState<string | null>(null);

  const [storageProvider, setStorageProvider] = useState("r2");
  const [storageConfig, setStorageConfig] = useState({
    endpoint: "",
    accessKeyId: "",
    secretAccessKey: "",
    bucket: "",
    region: "",
    customDomain: "",
  });
  const [storageSaving, setStorageSaving] = useState(false);
  const [storageVerifying, setStorageVerifying] = useState(false);
  const [storageMessage, setStorageMessage] = useState("");
  const [storageEditingKey, setStorageEditingKey] = useState(false);

  const [customTemplates, setCustomTemplates] = useState<CustomTemplate[]>([]);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [editingCustomId, setEditingCustomId] = useState<string | null>(null);
  const [customForm, setCustomForm] = useState({ name: "", html: "" });
  const [customSaving, setCustomSaving] = useState(false);

  useEffect(() => {
    loadSettings();
    loadCustomTemplates();
  }, []);

  // --- settings ---
  const loadSettings = async () => {
    try {
      const res = await fetch("/api/admin/settings");
      const data = await res.json();
      if (data.settings) {
        setSettings({ ...defaultSettings, ...data.settings });
      }
    } catch (_e) {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ site_name: settings.site_name, site_subtitle: settings.site_subtitle, footer_text: settings.footer_text }),
      });
      if (res.ok) {
        setMessage("保存成功");
      } else {
        setMessage("保存失败");
      }
    } catch (_e) {
      setMessage("网络错误");
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(""), 2000);
    }
  };

  const selectTemplate = async (key: string) => {
    setSettings((prev) => ({ ...prev, active_template: key }));
    await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active_template: key }),
    });
  };

  const updateField = (key: keyof Settings, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  // --- change account ---
  const [accountForm, setAccountForm] = useState({ currentPassword: "", newUsername: "", newPassword: "", confirmPassword: "" });
  const [accountSaving, setAccountSaving] = useState(false);
  const [accountMessage, setAccountMessage] = useState("");

  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [twoFactorSaving, setTwoFactorSaving] = useState(false);
  const [twoFactorMessage, setTwoFactorMessage] = useState("");
  const [twoFactorPassword, setTwoFactorPassword] = useState("");
  const [twoFactorConfirmPassword, setTwoFactorConfirmPassword] = useState("");

  interface AdminInfo {
    username: string;
    role: string;
    authMethod: string;
    passwordLastChangedAt: string | null;
    isDefaultPassword: boolean;
    currentLoginAt: string;
  }
  const [adminInfo, setAdminInfo] = useState<AdminInfo | null>(null);

  const loadAdminInfo = async () => {
    try {
      const res = await fetch("/api/admin/me");
      if (res.ok) {
        const data = await res.json();
        setAdminInfo(data.admin);
      }
    } catch {
      // ignore
    }
  };

  const loadTwoFactorSettings = async () => {
    try {
      const res = await fetch("/api/admin/twofactor");
      if (res.ok) {
        const data = await res.json();
        setTwoFactorEnabled(data.enabled);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (activeTab === "security") {
      loadAdminInfo();
      loadTwoFactorSettings();
    }
  }, [activeTab]);

  const handleTwoFactorToggle = async () => {
    const nextEnabled = !twoFactorEnabled;
    setTwoFactorSaving(true);
    setTwoFactorMessage("");

    if (nextEnabled) {
      if (!twoFactorPassword) {
        setTwoFactorMessage("请设置二级密码");
        setTwoFactorSaving(false);
        return;
      }
      if (twoFactorPassword !== twoFactorConfirmPassword) {
        setTwoFactorMessage("两次输入的二级密码不一致");
        setTwoFactorSaving(false);
        return;
      }
      if (twoFactorPassword.length < 4) {
        setTwoFactorMessage("二级密码至少需要4位");
        setTwoFactorSaving(false);
        return;
      }
    }

    try {
      const res = await fetch("/api/admin/twofactor", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enabled: nextEnabled,
          newPassword: nextEnabled ? twoFactorPassword : "",
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setTwoFactorPassword("");
        setTwoFactorConfirmPassword("");
        setTwoFactorMessage(nextEnabled ? "二级密码已开启" : "二级密码已关闭");
        await loadTwoFactorSettings();
      } else {
        setTwoFactorMessage(data.error || "操作失败");
      }
    } catch {
      setTwoFactorMessage("网络错误");
    } finally {
      setTwoFactorSaving(false);
      setTimeout(() => setTwoFactorMessage(""), 3000);
    }
  };

  const handleChangeAccount = async () => {
    setAccountSaving(true);
    setAccountMessage("");

    const body: Record<string, string> = { currentPassword: accountForm.currentPassword };

    if (accountForm.newUsername.trim()) {
      if (accountForm.newUsername.trim().length < 3) {
        setAccountMessage("新用户名长度至少为 3 位");
        setAccountSaving(false);
        return;
      }
      body.newUsername = accountForm.newUsername.trim();
    }

    if (accountForm.newPassword) {
      if (accountForm.newPassword.length < 6) {
        setAccountMessage("新密码长度至少为 6 位");
        setAccountSaving(false);
        return;
      }
      if (accountForm.newPassword !== accountForm.confirmPassword) {
        setAccountMessage("两次输入的新密码不一致");
        setAccountSaving(false);
        return;
      }
      body.newPassword = accountForm.newPassword;
    }

    if (!body.newUsername && !body.newPassword) {
      setAccountMessage("请输入新用户名或新密码");
      setAccountSaving(false);
      return;
    }

    try {
      const res = await fetch("/api/admin/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        setAccountMessage("账户信息修改成功，请重新登录");
        setAccountForm({ currentPassword: "", newUsername: "", newPassword: "", confirmPassword: "" });
        loadAdminInfo();
        setTimeout(() => {
          if (confirm("账户信息已修改，是否立即重新登录？")) {
            fetch("/api/admin/login", { method: "DELETE" }).finally(() => {
              window.location.href = "/admin/login";
            });
          }
        }, 500);
      } else {
        setAccountMessage(data.error || "修改失败");
      }
    } catch (_e) {
      setAccountMessage("网络错误");
    } finally {
      setAccountSaving(false);
      setTimeout(() => setAccountMessage(""), 5000);
    }
  };

  // --- custom templates ---
  const loadCustomTemplates = async () => {
    try {
      const res = await fetch("/api/admin/templates");
      const data = await res.json();
      setCustomTemplates(data.templates || []);
    } catch (_e) {
      // ignore
    }
  };

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCustomSaving(true);
    try {
      const url = editingCustomId
        ? `/api/admin/templates?id=${editingCustomId}`
        : "/api/admin/templates";
      const method = editingCustomId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(customForm),
      });

      if (res.ok) {
        setShowCustomForm(false);
        setEditingCustomId(null);
        setCustomForm({ name: "", html: "" });
        loadCustomTemplates();
        if (!editingCustomId) {
          const data = await res.json();
          selectTemplate(data.id);
        }
      }
    } catch (_e) {
      // ignore
    } finally {
      setCustomSaving(false);
    }
  };

  const loadStorageConfig = async () => {
    try {
      const res = await fetch("/api/admin/settings?keys=storage_provider,storage_r2_config,storage_cos_config,storage_oss_config,storage_kodo_config");
      const data = await res.json();
      const settings = data.settings || {};
      const provider = settings.storage_provider || "r2";
      setStorageProvider(provider);
      const configKey = `storage_${provider}_config`;
      try {
        const config = JSON.parse(settings[configKey] || "{}");
        setStorageConfig({
          endpoint: config.endpoint || "",
          accessKeyId: config.accessKeyId || "",
          secretAccessKey: config.secretAccessKey || "",
          bucket: config.bucket || "",
          region: config.region || "",
          customDomain: config.customDomain || "",
        });
      } catch {
        // ignore
      }
    } catch (_e) {
      // ignore
    }
  };

  const saveStorageConfig = async () => {
    setStorageSaving(true);
    setStorageMessage("");
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storage_provider: storageProvider,
          [`storage_${storageProvider}_config`]: JSON.stringify(storageConfig),
        }),
      });
      if (res.ok) {
        setStorageMessage("存储配置已保存");
        setStorageEditingKey(false);
      } else {
        const data = await res.json();
        setStorageMessage(data.error || "保存失败");
      }
    } catch (_e) {
      setStorageMessage("网络错误");
    } finally {
      setStorageSaving(false);
    }
  };

  const verifyStorageConfig = async () => {
    setStorageVerifying(true);
    setStorageMessage("");
    try {
      const res = await fetch("/api/admin/settings/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: storageProvider,
          config: storageConfig,
        }),
      });
      const data = await res.json();
      setStorageMessage(data.success ? "存储服务连接验证通过" : `验证失败: ${data.error || "未知错误"}`);
    } catch (_e) {
      setStorageMessage("验证请求失败");
    } finally {
      setStorageVerifying(false);
    }
  };

  useEffect(() => {
    if (activeTab === "storage") loadStorageConfig();
  }, [activeTab]);

  const handleCustomEdit = async (tpl: CustomTemplate) => {
    const htmlRes = await fetch(`/api/admin/settings/preview?key=${tpl.id}`);
    const html = await htmlRes.text();
    setEditingCustomId(tpl.id);
    setCustomForm({ name: tpl.name, html });
    setShowCustomForm(true);
  };

  const handleCustomDelete = async (id: string) => {
    if (!confirm("确定要删除这个模板吗？")) return;
    await fetch(`/api/admin/templates?id=${id}`, { method: "DELETE" });
    loadCustomTemplates();
    if (settings.active_template === id) {
      selectTemplate("1");
    }
  };

  const getTemplateName = (key: string) => {
    const preset = PRESETS.find((p) => p.key === key);
    if (preset) return preset.name;
    const custom = customTemplates.find((c) => c.id === key);
    return custom ? custom.name : key;
  };

  const isActive = (key: string) => settings.active_template === key;

  if (loading) {
    return <div className="text-center py-12 text-sepia/50">加载中...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("site")}
            className={`vintage-btn-sm rounded-sm transition-colors ${activeTab === "site" ? "bg-bark text-paper" : "bg-paper text-sepia/60 hover:text-bark border border-gold/20"}`}
          >
            站点信息
          </button>
          <button
            onClick={() => setActiveTab("email")}
            className={`vintage-btn-sm rounded-sm transition-colors ${activeTab === "email" ? "bg-bark text-paper" : "bg-paper text-sepia/60 hover:text-bark border border-gold/20"}`}
          >
            邮件模板
          </button>
          <button
            onClick={() => setActiveTab("storage")}
            className={`vintage-btn-sm rounded-sm transition-colors ${activeTab === "storage" ? "bg-bark text-paper" : "bg-paper text-sepia/60 hover:text-bark border border-gold/20"}`}
          >
            存储配置
          </button>
          <button
            onClick={() => setActiveTab("security")}
            className={`vintage-btn-sm rounded-sm transition-colors ${activeTab === "security" ? "bg-bark text-paper" : "bg-paper text-sepia/60 hover:text-bark border border-gold/20"}`}
          >
            安全设置
          </button>
        </div>
        {activeTab === "site" && (
          <button onClick={handleSave} disabled={saving} className="vintage-btn-primary vintage-btn-sm disabled:opacity-50">
            {saving ? "保存中..." : "保存设置"}
          </button>
        )}
      </div>

      {message && (
        <div className="mb-4 p-2 bg-moss/10 border border-moss/20 rounded-sm text-moss text-sm text-center">{message}</div>
      )}

      {activeTab === "site" && (
        <div className="paper-card p-5">
          <h3 className="font-medium text-bark mb-4 flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5C3D2E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            站点信息
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-bark/70 mb-1.5">站点名称</label>
              <input type="text" className="vintage-input" value={settings.site_name} onChange={(e) => updateField("site_name", e.target.value)} />
            </div>
            <div>
              <label className="block text-sm text-bark/70 mb-1.5">首页副标题</label>
              <textarea rows={2} className="vintage-textarea" value={settings.site_subtitle} onChange={(e) => updateField("site_subtitle", e.target.value)} />
            </div>
            <div>
              <label className="block text-sm text-bark/70 mb-1.5">页脚文字</label>
              <input type="text" className="vintage-input" value={settings.footer_text} onChange={(e) => updateField("footer_text", e.target.value)} />
            </div>
          </div>
        </div>
      )}

      {activeTab === "email" && (
        <div>
          {/* preset templates */}
          <div className="paper-card p-5 mb-4">
            <h3 className="font-medium text-bark mb-1 flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5C3D2E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
              预设模板
            </h3>
            <p className="text-xs text-sepia/50 mb-4">点击卡片选中模板，即时生效</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {PRESETS.map((p) => {
                const active = isActive(p.key);
                return (
                  <div
                    key={p.key}
                    onClick={() => selectTemplate(p.key)}
                    className={`paper-card p-3 cursor-pointer transition-all text-center ${active ? "border-gold ring-1 ring-gold/50" : "border-gold/10 hover:border-gold/30"}`}
                  >
                    <div className={`text-xs font-medium mb-1 ${active ? "text-bark" : "text-bark/70"}`}>{p.name}</div>
                    <div className="text-xs text-sepia/40 mb-2">{p.desc}</div>
                    <div className="flex gap-1.5">
                      <button
                        onClick={(e) => { e.stopPropagation(); setPreviewKey(p.key); }}
                        className="vintage-btn-outline vintage-btn-sm flex-1 text-xs px-2"
                      >
                        预览
                      </button>
                    </div>
                    {active && (
                      <div className="mt-2 text-xs px-1.5 py-0.5 rounded-sm bg-moss/20 text-moss inline-block">使用中</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* custom templates */}
          <div className="paper-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-bark flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5C3D2E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
                </svg>
                自定义模板
              </h3>
              <button
                onClick={() => { setEditingCustomId(null); setCustomForm({ name: "", html: DEFAULT_CUSTOM_HTML }); setShowCustomForm(true); }}
                className="vintage-btn-primary vintage-btn-sm"
              >
                添加模板
              </button>
            </div>

            {customTemplates.length === 0 ? (
              <p className="text-xs text-sepia/40 text-center py-4">暂无自定义模板</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {customTemplates.map((tpl) => {
                  const active = isActive(tpl.id);
                  return (
                    <div
                      key={tpl.id}
                      onClick={() => selectTemplate(tpl.id)}
                      className={`paper-card p-3 cursor-pointer transition-all text-center ${active ? "border-gold ring-1 ring-gold/50" : "border-gold/10 hover:border-gold/30"}`}
                    >
                      <div className={`text-xs font-medium mb-1 ${active ? "text-bark" : "text-bark/70"}`}>{tpl.name}</div>
                      <div className="flex gap-1.5 justify-center mt-2">
                        <button onClick={(e) => { e.stopPropagation(); setPreviewKey(tpl.id); }} className="vintage-btn-outline vintage-btn-sm text-xs px-2">预览</button>
                        <button onClick={(e) => { e.stopPropagation(); handleCustomEdit(tpl); }} className="vintage-btn-outline vintage-btn-sm text-xs px-2">编辑</button>
                        <button onClick={(e) => { e.stopPropagation(); handleCustomDelete(tpl.id); }} className="text-xs text-rust/50 hover:text-rust px-1">删</button>
                      </div>
                      {active && (
                        <div className="mt-2 text-xs px-1.5 py-0.5 rounded-sm bg-moss/20 text-moss inline-block">使用中</div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* custom template form modal */}
          {showCustomForm && (
            <div className="fixed inset-0 bg-ink/40 z-50 flex items-center justify-center p-4" onClick={() => setShowCustomForm(false)}>
              <div className="paper-card p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <h4 className="font-serif text-lg text-bark mb-4">
                  {editingCustomId ? "编辑模板" : "新建模板"}
                </h4>
                <form onSubmit={handleCustomSubmit} className="space-y-3">
                  <div>
                    <label className="block text-xs text-bark/70 mb-1">模板名称</label>
                    <input
                      type="text"
                      required
                      className="vintage-input text-sm py-2"
                      value={customForm.name}
                      onChange={(e) => setCustomForm({ ...customForm, name: e.target.value })}
                      placeholder="给模板起个名字"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-bark/70 mb-1">HTML 模板</label>
                    <div className="mb-1.5 flex flex-wrap gap-1">
                      <span className="text-xs text-sepia/40">变量：</span>
                      {["{{site_name}}","{{sender_name}}","{{recipient_name}}","{{subject}}","{{content}}"].map((v) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => {
                            const ta = document.getElementById("custom-html-editor") as HTMLTextAreaElement;
                            if (ta) {
                              const s = ta.selectionStart;
                              ta.value = ta.value.substring(0, s) + v + ta.value.substring(ta.selectionEnd);
                              setCustomForm((prev) => ({ ...prev, html: ta.value }));
                              ta.focus();
                              ta.setSelectionRange(s + v.length, s + v.length);
                            }
                          }}
                          className="text-xs px-1.5 py-0.5 rounded-sm bg-bark/10 text-bark/70 hover:bg-bark/20 font-mono"
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                    <textarea
                      id="custom-html-editor"
                      required
                      rows={18}
                      className="vintage-textarea font-mono text-xs"
                      value={customForm.html}
                      onChange={(e) => setCustomForm({ ...customForm, html: e.target.value })}
                      spellCheck={false}
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button type="submit" disabled={customSaving} className="vintage-btn-primary vintage-btn-sm flex-1 disabled:opacity-50">
                      {customSaving ? "保存中..." : "保存"}
                    </button>
                    <button type="button" onClick={() => setShowCustomForm(false)} className="vintage-btn-outline vintage-btn-sm">
                      取消
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* preview modal */}
          {previewKey && (
            <div className="fixed inset-0 bg-ink/60 z-50 flex items-center justify-center p-4" onClick={() => setPreviewKey(null)}>
              <div className="bg-white w-full max-w-[640px] max-h-[90vh] rounded-sm overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between px-4 py-2 bg-bark text-paper/90">
                  <span className="text-sm">预览 — {getTemplateName(previewKey)}</span>
                  <button onClick={() => setPreviewKey(null)} className="text-paper/50 hover:text-paper/80">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
                <iframe
                  src={`/api/admin/settings/preview?key=${previewKey}`}
                  className="w-full h-[75vh] border-0"
                  title="邮件模板预览"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "storage" && (
        <div>
          {storageMessage && (
            <div className={`mb-4 p-2 rounded-sm text-sm text-center ${storageMessage.includes("失败") ? "bg-rust/10 border border-rust/20 text-rust" : "bg-moss/10 border border-moss/20 text-moss"}`}>
              {storageMessage}
            </div>
          )}

          <div className="paper-card p-6">
            <h3 className="font-serif text-lg text-bark mb-4">对象存储配置</h3>

            <div className="mb-4">
              <label className="block text-sm text-bark/70 mb-2">存储服务</label>
              <div className="flex gap-2 flex-wrap">
                {[
                  { key: "r2", label: "Cloudflare R2" },
                  { key: "cos", label: "腾讯云 COS" },
                  { key: "oss", label: "阿里云 OSS" },
                  { key: "kodo", label: "七牛云 Kodo" },
                ].map((p) => (
                  <button
                    key={p.key}
                    onClick={() => setStorageProvider(p.key)}
                    className={`px-3 py-1.5 text-sm rounded-sm border transition-colors ${
                      storageProvider === p.key
                        ? "bg-bark text-paper border-bark"
                        : "bg-paper text-sepia/60 border-gold/20 hover:border-gold/40"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {storageProvider === "r2" ? (
              <div className="p-4 bg-cream/50 border border-sepia/10 rounded-sm text-sm text-sepia/60 leading-relaxed mt-4">
                <p className="mb-2"><strong className="text-bark">R2 通过环境变量配置</strong>，无需在后台填写：</p>
                <code className="block bg-paper p-3 rounded-sm text-xs mt-2 font-mono text-sepia/70">
                  R2_ENDPOINT=https://xxx.r2.cloudflarestorage.com<br/>
                  R2_ACCESS_KEY_ID=your_access_key<br/>
                  R2_SECRET_ACCESS_KEY=your_secret_key<br/>
                  R2_BUCKET=my-bucket<br/>
                  R2_REGION=auto<br/>
                  R2_CUSTOM_DOMAIN=https://cdn.example.com
                </code>
              </div>
            ) : (
              <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-bark/70 mb-1">
                  {storageProvider === "r2" ? "Endpoint" : "Endpoint / 地域节点"}
                </label>
                <input
                  type="text"
                  className="vintage-input"
                  placeholder={
                    storageProvider === "r2"
                      ? "https://xxx.r2.cloudflarestorage.com"
                      : storageProvider === "cos"
                      ? "https://cos.ap-guangzhou.myqcloud.com"
                      : storageProvider === "oss"
                      ? "https://oss-cn-hangzhou.aliyuncs.com"
                      : "https://up-z2.qiniup.com"
                  }
                  value={storageConfig.endpoint}
                  onChange={(e) => setStorageConfig({ ...storageConfig, endpoint: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm text-bark/70 mb-1">Bucket</label>
                <input
                  type="text"
                  className="vintage-input"
                  placeholder="my-bucket"
                  value={storageConfig.bucket}
                  onChange={(e) => setStorageConfig({ ...storageConfig, bucket: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm text-bark/70 mb-1">Region</label>
                <input
                  type="text"
                  className="vintage-input"
                  placeholder={storageProvider === "r2" ? "auto" : "ap-guangzhou"}
                  value={storageConfig.region}
                  onChange={(e) => setStorageConfig({ ...storageConfig, region: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm text-bark/70 mb-1">自定义域名 (可选)</label>
                <input
                  type="text"
                  className="vintage-input"
                  placeholder="https://cdn.example.com"
                  value={storageConfig.customDomain}
                  onChange={(e) => setStorageConfig({ ...storageConfig, customDomain: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm text-bark/70 mb-1">AccessKey ID</label>
                {storageEditingKey ? (
                  <input
                    type="text"
                    className="vintage-input"
                    value={storageConfig.accessKeyId}
                    onChange={(e) => setStorageConfig({ ...storageConfig, accessKeyId: e.target.value })}
                  />
                ) : (
                  <div className="vintage-input text-sepia/50">
                    {storageConfig.accessKeyId ? "****" + storageConfig.accessKeyId.slice(-4) : "未设置"}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm text-bark/70 mb-1">SecretAccessKey</label>
                {storageEditingKey ? (
                  <input
                    type="password"
                    className="vintage-input"
                    value={storageConfig.secretAccessKey}
                    placeholder={storageConfig.secretAccessKey ? "输入新密钥覆盖" : "输入密钥"}
                    onChange={(e) => setStorageConfig({ ...storageConfig, secretAccessKey: e.target.value })}
                  />
                ) : (
                  <div className="vintage-input text-sepia/50">
                    {storageConfig.secretAccessKey ? "********" : "未设置"}
                  </div>
                )}
              </div>
            </div>
              </>
            )}

            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={saveStorageConfig}
                disabled={storageSaving}
                className="vintage-btn-primary vintage-btn-sm disabled:opacity-50"
              >
                {storageSaving ? "保存中..." : "保存配置"}
              </button>
              <button
                onClick={verifyStorageConfig}
                disabled={storageVerifying}
                className="vintage-btn-outline vintage-btn-sm disabled:opacity-50"
              >
                {storageVerifying ? "验证中..." : "验证连接"}
              </button>
              <button
                onClick={() => setStorageEditingKey(!storageEditingKey)}
                className="text-sm text-sepia/50 hover:text-sepia"
              >
                {storageEditingKey ? "取消编辑密钥" : "编辑密钥"}
              </button>
            </div>

            <div className="mt-4 p-3 bg-cream/50 border border-sepia/10 rounded-sm text-xs text-sepia/50 leading-relaxed">
              密钥在保存时使用 AES-256-GCM 加密存储。R2 使用环境变量配置（R2_ENDPOINT/R2_ACCESS_KEY_ID/R2_SECRET_ACCESS_KEY/R2_BUCKET/R2_CUSTOM_DOMAIN），无需在后台填写。其他存储服务（COS/OSS/Kodo）在此页面配置。所有上传的文件将保留 180 天，过期后需管理员在附件管理页面审批删除。
            </div>
          </div>
        </div>
      )}

      {activeTab === "security" && (
        <div>
          {accountMessage && (
            <div className={`mb-4 p-2 rounded-sm text-sm text-center ${accountMessage.includes("成功") ? "bg-moss/10 border border-moss/20 text-moss" : "bg-rust/10 border border-rust/20 text-rust"}`}>
              {accountMessage}
            </div>
          )}

          <div className="paper-card p-6 max-w-xl mb-4">
            <h3 className="font-serif text-lg text-bark mb-1 flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5C3D2E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              当前管理员信息
            </h3>
            <p className="text-xs text-sepia/50 mb-5">当前登录会话的账户信息</p>

            {adminInfo ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-gold/10">
                  <span className="text-sm text-sepia/60">用户名</span>
                  <span className="text-sm text-bark font-mono">{adminInfo.username}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gold/10">
                  <span className="text-sm text-sepia/60">角色</span>
                  <span className="text-xs px-2 py-0.5 rounded-sm bg-bark/10 text-bark">{adminInfo.role === "superadmin" ? "超级管理员" : adminInfo.role}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gold/10">
                  <span className="text-sm text-sepia/60">认证方式</span>
                  <span className={`text-xs px-2 py-0.5 rounded-sm ${adminInfo.authMethod === "default" ? "bg-rust/10 text-rust" : "bg-moss/10 text-moss"}`}>
                    {adminInfo.authMethod === "default" ? "默认密码" : "自定义密码"}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gold/10">
                  <span className="text-sm text-sepia/60">密码最后修改</span>
                  <span className="text-sm text-bark">{adminInfo.passwordLastChangedAt ? new Date(adminInfo.passwordLastChangedAt).toLocaleString("zh-CN") : "从未修改"}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-sepia/60">当前登录时间</span>
                  <span className="text-sm text-bark">{new Date(adminInfo.currentLoginAt).toLocaleString("zh-CN")}</span>
                </div>

                {adminInfo.isDefaultPassword && (
                  <div className="mt-4 p-3 bg-rust/10 border border-rust/20 rounded-sm text-xs text-rust leading-relaxed">
                    ⚠️ 您正在使用默认密码 <code className="px-1 py-0.5 bg-rust/20 rounded font-mono">admin123</code>，存在安全风险，请尽快修改。
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-sepia/40 text-center py-4">加载中...</p>
            )}
          </div>

          <div className="paper-card p-6 max-w-xl mb-4">
            <h3 className="font-serif text-lg text-bark mb-1 flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5C3D2E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <polyline points="12,22 12,12 9,8" />
              </svg>
              二级密码
            </h3>
            <p className="text-xs text-sepia/50 mb-5">开启后，登录时需要额外验证二级密码</p>

            {twoFactorMessage && (
              <div className={`mb-4 p-2 rounded-sm text-sm text-center ${twoFactorMessage.includes("失败") ? "bg-rust/10 border border-rust/20 text-rust" : "bg-moss/10 border border-moss/20 text-moss"}`}>
                {twoFactorMessage}
              </div>
            )}

            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-sm text-bark">二级密码保护</div>
                <div className="text-xs text-sepia/50 mt-0.5">
                  {twoFactorEnabled ? "已开启，登录时需要输入二级密码" : "未开启"}
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={twoFactorEnabled}
                  onChange={handleTwoFactorToggle}
                  disabled={twoFactorSaving}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-sepia/20 peer-focus:outline-none peer-focus:ring-1 peer-focus:ring-bark/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-bark"></div>
              </label>
            </div>

            {!twoFactorEnabled && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-bark/70 mb-1.5">设置二级密码 <span className="text-rust">*</span></label>
                  <input
                    type="password"
                    className="vintage-input"
                    value={twoFactorPassword}
                    onChange={(e) => setTwoFactorPassword(e.target.value)}
                    placeholder="至少4位"
                  />
                </div>
                <div>
                  <label className="block text-sm text-bark/70 mb-1.5">确认二级密码 <span className="text-rust">*</span></label>
                  <input
                    type="password"
                    className="vintage-input"
                    value={twoFactorConfirmPassword}
                    onChange={(e) => setTwoFactorConfirmPassword(e.target.value)}
                    placeholder="再次输入二级密码"
                  />
                </div>
              </div>
            )}

            <div className="mt-4 p-3 bg-cream/50 border border-sepia/10 rounded-sm text-xs text-sepia/50 leading-relaxed">
              ⚠️ 请妥善保管二级密码，忘记后需通过数据库重置。
            </div>
          </div>

          <div className="paper-card p-6 max-w-xl">
            <h3 className="font-serif text-lg text-bark mb-1 flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5C3D2E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0110 0v4" />
              </svg>
              修改管理员账户
            </h3>
            <p className="text-xs text-sepia/50 mb-5">可单独修改用户名或密码，修改后将立即生效</p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-bark/70 mb-1.5">当前密码 <span className="text-rust">*</span></label>
                <input
                  type="password"
                  className="vintage-input"
                  value={accountForm.currentPassword}
                  onChange={(e) => setAccountForm({ ...accountForm, currentPassword: e.target.value })}
                  placeholder="请输入当前密码以验证身份"
                />
              </div>
              <div className="border-t border-gold/10 pt-4">
                <label className="block text-sm text-bark/70 mb-1.5">新用户名（选填）</label>
                <input
                  type="text"
                  className="vintage-input"
                  value={accountForm.newUsername}
                  onChange={(e) => setAccountForm({ ...accountForm, newUsername: e.target.value })}
                  placeholder={`当前：${adminInfo?.username || "admin"}，留空则不修改`}
                />
              </div>
              <div>
                <label className="block text-sm text-bark/70 mb-1.5">新密码（选填）</label>
                <input
                  type="password"
                  className="vintage-input"
                  value={accountForm.newPassword}
                  onChange={(e) => setAccountForm({ ...accountForm, newPassword: e.target.value })}
                  placeholder="至少 6 位，留空则不修改"
                />
              </div>
              {accountForm.newPassword && (
                <div>
                  <label className="block text-sm text-bark/70 mb-1.5">确认新密码</label>
                  <input
                    type="password"
                    className="vintage-input"
                    value={accountForm.confirmPassword}
                    onChange={(e) => setAccountForm({ ...accountForm, confirmPassword: e.target.value })}
                    placeholder="再次输入新密码"
                  />
                </div>
              )}
              <button
                onClick={handleChangeAccount}
                disabled={accountSaving}
                className="vintage-btn-primary vintage-btn-sm disabled:opacity-50"
              >
                {accountSaving ? "保存中..." : "保存修改"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
