"use client";

import { useEffect, useState, useCallback } from "react";

interface Attachment {
  id: string;
  letter_id: string;
  type: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  storage_provider: string;
  storage_url: string;
  status: string;
  uploaded_at: string;
  expires_at: string;
  recipient_email?: string;
  recipient_name?: string;
  sender_name?: string;
  subject?: string;
}

interface Stats {
  active: number;
  expiring: number;
  expired: number;
  pending_delete: number;
  deleted: number;
  total: number;
}

export default function AttachmentsPage() {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [stats, setStats] = useState<Stats>({ active: 0, expiring: 0, expired: 0, pending_delete: 0, deleted: 0, total: 0 });
  const [filter, setFilter] = useState("pending_delete");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<Attachment | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/attachments?status=${filter}&page=${page}`);
    const data: any = await res.json();
    setAttachments(data.attachments || []);
    setStats(data.stats || { active: 0, expiring: 0, expired: 0, pending_delete: 0, deleted: 0, total: 0 });
    setTotal(data.total || 0);
    setLoading(false);
    setSelected(new Set());
  }, [filter, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAction = async (action: string, ids?: string[]) => {
    const targetIds = ids || Array.from(selected);
    if (targetIds.length === 0) return;
    await fetch("/api/admin/attachments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ids: targetIds }),
    });
    fetchData();
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    await fetch(`/api/admin/attachments/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    fetchData();
  };

  const handleDeleteSingle = async (id: string) => {
    if (!confirm("确定要删除此附件吗？文件将从存储中移除。")) return;
    await fetch(`/api/admin/attachments/${id}`, { method: "DELETE" });
    fetchData();
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === attachments.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(attachments.map((a) => a.id)));
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const statusLabel: Record<string, { text: string; color: string }> = {
    active: { text: "正常", color: "bg-green-100 text-green-700" },
    expiring: { text: "即将过期", color: "bg-yellow-100 text-yellow-700" },
    expired: { text: "已过期", color: "bg-red-100 text-red-700" },
    pending_delete: { text: "待审批", color: "bg-orange-100 text-orange-700" },
    deleted: { text: "已删除", color: "bg-gray-100 text-gray-500" },
  };

  const tabs = [
    { key: "pending_delete", label: "待审批" },
    { key: "expired", label: "已过期" },
    { key: "expiring", label: "即将过期" },
    { key: "active", label: "正常" },
  ];

  return (
    <div>
      <h2 className="font-serif text-xl text-bark mb-6">附件管理</h2>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-cream/50 border border-sepia/20 rounded-sm p-4">
          <div className="text-2xl font-bold text-bark">{stats.total}</div>
          <div className="text-xs text-sepia/60">总附件</div>
        </div>
        <div className="bg-yellow-50/50 border border-yellow-200 rounded-sm p-4">
          <div className="text-2xl font-bold text-yellow-700">{stats.expiring}</div>
          <div className="text-xs text-yellow-600">即将过期</div>
        </div>
        <div className="bg-red-50/50 border border-red-200 rounded-sm p-4">
          <div className="text-2xl font-bold text-red-700">{stats.expired}</div>
          <div className="text-xs text-red-600">已过期</div>
        </div>
        <div className="bg-gray-50/50 border border-gray-200 rounded-sm p-4">
          <div className="text-2xl font-bold text-gray-500">{stats.deleted}</div>
          <div className="text-xs text-gray-400">已清理</div>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => { setFilter(tab.key); setPage(1); }}
            className={`px-3 py-1.5 text-sm rounded-sm transition-colors ${
              filter === tab.key
                ? "bg-bark text-cream"
                : "bg-cream/50 text-sepia/70 hover:bg-cream"
            }`}
          >
            {tab.label}
          </button>
        ))}
        <button onClick={fetchData} className="ml-auto text-xs text-sepia/50 hover:text-sepia">
          刷新
        </button>
      </div>

      {selected.size > 0 && (filter === "expired" || filter === "expiring") && (
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => handleAction("approve")}
            className="vintage-btn-primary vintage-btn-sm bg-rust text-xs"
          >
            同意删除 ({selected.size})
          </button>
          <button
            onClick={() => handleAction("extend")}
            className="vintage-btn-outline vintage-btn-sm text-xs"
          >
            延长 30 天 ({selected.size})
          </button>
        </div>
      )}

      <div className="paper-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-sepia/10">
              <tr>
                <th className="p-3 text-left w-8">
                  <input type="checkbox" onChange={toggleAll} checked={selected.size === attachments.length && attachments.length > 0} />
                </th>
                <th className="p-3 text-left text-sepia/60 font-normal">类型</th>
                <th className="p-3 text-left text-sepia/60 font-normal">文件名</th>
                <th className="p-3 text-left text-sepia/60 font-normal">大小</th>
                <th className="p-3 text-left text-sepia/60 font-normal">关联信件</th>
                <th className="p-3 text-left text-sepia/60 font-normal">状态</th>
                <th className="p-3 text-left text-sepia/60 font-normal">过期时间</th>
                <th className="p-3 text-left text-sepia/60 font-normal">操作</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-sepia/50">加载中...</td>
                </tr>
              ) : attachments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-sepia/50">暂无数据</td>
                </tr>
              ) : (
                attachments.map((att) => {
                  const s = statusLabel[att.status] || statusLabel.active;
                  return (
                    <tr key={att.id} className="border-b border-sepia/5 hover:bg-cream/30">
                      <td className="p-3">
                        <input
                          type="checkbox"
                          checked={selected.has(att.id)}
                          onChange={() => toggleSelect(att.id)}
                        />
                      </td>
                      <td className="p-3">
                        {att.type === "image" ? (
                          <span className="text-moss/70">图片</span>
                        ) : (
                          <span className="text-rust/70">语音</span>
                        )}
                      </td>
                      <td className="p-3 text-sepia/80 max-w-[200px] truncate">
                        {att.file_name}
                      </td>
                      <td className="p-3 text-sepia/50">{formatSize(att.file_size)}</td>
                      <td className="p-3 text-sepia/60 max-w-[120px] truncate">
                        {att.subject || att.recipient_email || "-"}
                      </td>
                      <td className="p-3">
                        <span className={`px-1.5 py-0.5 rounded-sm text-xs ${s.color}`}>
                          {s.text}
                        </span>
                      </td>
                      <td className="p-3 text-sepia/50 text-xs">
                        {new Date(att.expires_at).toLocaleDateString("zh-CN")}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1 flex-wrap">
                          <select
                            value={att.status}
                            onChange={(e) => handleStatusChange(att.id, e.target.value)}
                            className="text-xs border border-sepia/20 rounded-sm px-1 py-0.5 bg-paper text-sepia/70 max-w-[80px]"
                          >
                            {Object.entries(statusLabel).map(([k, v]) => (
                              <option key={k} value={k}>{v.text}</option>
                            ))}
                          </select>
                          <button
                            onClick={() => setDetail(att)}
                            className="text-xs text-moss hover:text-moss/70"
                          >
                            详情
                          </button>
                          {(att.status === "expired" || att.status === "expiring") && (
                            <>
                              <button
                                onClick={() => handleAction("approve", [att.id])}
                                className="text-xs text-rust hover:text-rust/70"
                              >
                                批量删
                              </button>
                              <button
                                onClick={() => handleAction("extend", [att.id])}
                                className="text-xs text-sepia/60 hover:text-sepia"
                              >
                                延长
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleDeleteSingle(att.id)}
                            className="text-xs text-rust/60 hover:text-rust"
                            title="直接删除此附件"
                          >
                            删
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {total > 20 && (
          <div className="flex justify-center gap-2 p-3 border-t border-sepia/10">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1 text-sm text-sepia/60 hover:text-sepia disabled:opacity-30"
            >
              上一页
            </button>
            <span className="px-3 py-1 text-sm text-sepia/50">
              {page} / {Math.ceil(total / 20)}
            </span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page * 20 >= total}
              className="px-3 py-1 text-sm text-sepia/60 hover:text-sepia disabled:opacity-30"
            >
              下一页
            </button>
          </div>
        )}
      </div>

      {detail && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={() => setDetail(null)}>
          <div className="paper-card p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif text-lg text-bark">附件详情</h3>
              <button onClick={() => setDetail(null)} className="text-sepia/50 hover:text-sepia text-xl">
                x
              </button>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-sepia/60">类型</span>
                <span>{detail.type === "image" ? "图片" : "语音"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sepia/60">文件名</span>
                <span className="text-sepia/80">{detail.file_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sepia/60">文件大小</span>
                <span>{formatSize(detail.file_size)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sepia/60">存储服务</span>
                <span className="uppercase text-xs">{detail.storage_provider}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sepia/60">上传时间</span>
                <span>{new Date(detail.uploaded_at).toLocaleString("zh-CN")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sepia/60">过期时间</span>
                <span className={new Date(detail.expires_at) < new Date() ? "text-rust" : ""}>
                  {new Date(detail.expires_at).toLocaleString("zh-CN")}
                </span>
              </div>
              {detail.recipient_email && (
                <>
                  <div className="flex justify-between">
                    <span className="text-sepia/60">关联信件</span>
                    <span className="text-sepia/80">{detail.subject || "无标题"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sepia/60">收件人</span>
                    <span>{detail.recipient_email}</span>
                  </div>
                </>
              )}
            </div>
            {detail.type === "image" && detail.storage_url && (
              <div className="mt-4">
                <img src={detail.storage_url} alt={detail.file_name} className="w-full rounded-sm" />
              </div>
            )}
            {detail.type === "audio" && detail.storage_url && (
              <div className="mt-4">
                <audio src={detail.storage_url} controls className="w-full" />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
