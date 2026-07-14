"use client";

import { useEffect, useState } from "react";

interface Announcement {
  id: string;
  title: string;
  content: string;
  is_active: number;
  created_at: string;
}

const defaultForm = {
  title: "",
  content: "",
};

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadAnnouncements = async () => {
    try {
      const res = await fetch("/api/admin/announcements");
      const data: any = await res.json();
      setAnnouncements(data.announcements || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const openNew = () => {
    setForm(defaultForm);
    setEditingId(null);
    setShowForm(true);
    setError("");
  };

  const openEdit = (announcement: Announcement) => {
    setForm({
      title: announcement.title,
      content: announcement.content,
    });
    setEditingId(announcement.id);
    setShowForm(true);
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      const url = editingId
        ? `/api/admin/announcements`
        : `/api/admin/announcements`;
      const method = editingId ? "PUT" : "POST";

      const payload = editingId ? { id: editingId, ...form } : form;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data: any = await res.json();
        setError(data.error || "保存失败");
        return;
      }

      setShowForm(false);
      loadAnnouncements();
    } catch {
      setError("网络错误");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除这个公告吗？")) return;
    await fetch(`/api/admin/announcements?id=${id}`, { method: "DELETE" });
    loadAnnouncements();
  };

  const handleToggle = async (id: string, isActive: number) => {
    await fetch("/api/admin/announcements", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, is_active: isActive ? 0 : 1 }),
    });
    loadAnnouncements();
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
          <h2 className="font-serif text-2xl text-bark">公告管理</h2>
          <p className="text-xs text-sepia/50 mt-1">
            发布公告，前台用户访问时会弹窗显示
          </p>
        </div>
        <button onClick={openNew} className="vintage-btn-primary vintage-btn-sm">
          发布公告
        </button>
      </div>

      {announcements.length === 0 && !showForm ? (
        <div className="paper-card p-8 text-center text-sepia/50">
          <p className="mb-3">还没有发布任何公告</p>
          <button onClick={openNew} className="vintage-btn-outline vintage-btn-sm">
            发布第一个公告
          </button>
        </div>
      ) : (
        <div className="grid gap-3">
          {announcements.map((announcement) => (
            <div key={announcement.id} className="paper-card p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-bark">{announcement.title}</h3>
                    <button
                      onClick={() => handleToggle(announcement.id, announcement.is_active)}
                      className={`text-xs px-2 py-0.5 rounded-sm cursor-pointer transition-colors ${
                        announcement.is_active
                          ? "bg-moss/20 text-moss"
                          : "bg-rust/20 text-rust"
                      }`}
                    >
                      {announcement.is_active ? "启用" : "禁用"}
                    </button>
                  </div>
                  <div className="text-xs text-sepia/60 line-clamp-2">
                    {announcement.content}
                  </div>
                  <div className="text-xs text-sepia/40 mt-1">
                    创建时间: {new Date(announcement.created_at).toLocaleString("zh-CN")}
                  </div>
                </div>
                <div className="flex gap-1 ml-4">
                  <button
                    onClick={() => openEdit(announcement)}
                    className="text-xs text-sepia/50 hover:text-bark transition-colors px-2 py-1"
                  >
                    编辑
                  </button>
                  <button
                    onClick={() => handleDelete(announcement.id)}
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
          <div className="paper-card p-6 max-w-md w-full">
            <h3 className="font-serif text-lg text-bark mb-4">
              {editingId ? "编辑公告" : "发布公告"}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs text-bark/70 mb-1">
                  公告标题 <span className="text-rust">*</span>
                </label>
                <input
                  type="text"
                  required
                  className="vintage-input text-sm py-2"
                  placeholder="输入公告标题"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs text-bark/70 mb-1">
                  公告内容 <span className="text-rust">*</span>
                </label>
                <textarea
                  required
                  rows={6}
                  className="vintage-input text-sm py-2 resize-none"
                  placeholder="输入公告内容，前台用户访问时会弹窗显示"
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
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