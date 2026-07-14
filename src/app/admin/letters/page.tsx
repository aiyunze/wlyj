"use client";

import { useEffect, useState } from "react";

interface Letter {
  id: string;
  letter_no: string;
  recipient_email: string;
  recipient_name: string;
  sender_name: string;
  subject: string;
  content: string;
  send_at: string;
  status: string;
  sent_at: string | null;
  error_msg: string | null;
  config_name: string | null;
  created_at: string;
}

interface Attachment {
  id: string;
  type: string;
  file_name: string;
  file_size: number;
  storage_url: string;
  status: string;
}

const statusLabels: Record<string, string> = {
  pending: "待发送",
  sent: "已发送",
  failed: "发送失败",
};

const statusColors: Record<string, string> = {
  pending: "bg-gold/20 text-sepia",
  sent: "bg-moss/20 text-moss",
  failed: "bg-rust/20 text-rust",
};

export default function LettersPage() {
  const [letters, setLetters] = useState<Letter[]>([]);
  const [selected, setSelected] = useState<Letter | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loadingAttachments, setLoadingAttachments] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const loadLetters = async () => {
    try {
      const res = await fetch("/api/admin/letters");
      const data: any = await res.json();
      setLetters(data.letters || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLetters();
  }, []);

  const filtered = filter === "all" ? letters : letters.filter((l) => l.status === filter);

  const formatDate = (d: string) => {
    if (!d) return "-";
    return new Date(d).toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const loadAttachments = async (letterId: string) => {
    setLoadingAttachments(true);
    try {
      const res = await fetch(`/api/admin/attachments?status=active&page=1&letter_id=${letterId}`);
      const data: any = await res.json();
      const all = (data.attachments || []) as Attachment[];
      setAttachments(all.filter((a: Attachment) => a.status !== "deleted"));
    } catch {
      // ignore
    } finally {
      setLoadingAttachments(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除这封信件吗？")) return;
    await fetch(`/api/admin/letters/${id}`, { method: "DELETE" });
    setSelected(null);
    loadLetters();
  };

  const handleResend = async (id: string) => {
    if (!confirm("确定要重新发送这封信件吗？")) return;
    try {
      const res = await fetch(`/api/admin/letters/${id}/send`, { method: "POST" });
      const data: any = await res.json();
      if (res.ok) {
        alert("重新发送成功！");
        setSelected(null);
        loadLetters();
      } else {
        alert(`发送失败：${data.error || "未知错误"}`);
        loadLetters();
      }
    } catch {
      alert("发送失败，请稍后重试");
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12 text-sepia/50">加载中...</div>
    );
  }

  return (
    <div>
      <h2 className="font-serif text-2xl text-bark mb-4">信件管理</h2>

      <div className="flex gap-2 mb-4">
        {["all", "pending", "sent", "failed"].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`vintage-btn-sm rounded-sm text-sm transition-colors ${
              filter === s
                ? "bg-bark text-paper"
                : "bg-paper text-sepia/60 hover:text-bark border border-gold/20"
            }`}
          >
            {s === "all" ? "全部" : statusLabels[s]}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="paper-card p-8 text-center text-sepia/50">
          暂无信件
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((letter) => (
            <div
              key={letter.id}
              onClick={() => { setSelected(letter); setAttachments([]); loadAttachments(letter.id); }}
              className="paper-card p-4 cursor-pointer hover:border-gold/60 transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-sm ${statusColors[letter.status]}`}
                    >
                      {statusLabels[letter.status]}
                    </span>
                    {letter.letter_no && (
                      <span className="text-xs px-2 py-0.5 rounded-sm bg-bark/10 text-bark font-mono">
                        {letter.letter_no}
                      </span>
                    )}
                    <span className="text-sm text-bark font-medium truncate">
                      {letter.subject || "(无主题)"}
                    </span>
                  </div>
                  <div className="text-xs text-sepia/60">
                    收件: {letter.recipient_email}
                    {letter.sender_name && ` · 寄件: ${letter.sender_name}`}
                  </div>
                  <div className="text-xs text-sepia/40 mt-0.5">
                    投递时间: {formatDate(letter.send_at)}
                    {letter.config_name && ` · 发送邮箱: ${letter.config_name}`}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <div
          className="fixed inset-0 bg-ink/40 z-50 flex items-center justify-center p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="paper-card p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <h3 className="font-serif text-lg text-bark">信件详情</h3>
              <button
                onClick={() => setSelected(null)}
                className="text-sepia/40 hover:text-sepia"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="space-y-3 text-sm">
              {selected.letter_no && (
                <div>
                  <span className="text-sepia/50">信件编号：</span>
                  <span className="text-bark font-mono font-medium">{selected.letter_no}</span>
                </div>
              )}
              <div>
                <span className="text-sepia/50">状态：</span>
                <span className={`px-2 py-0.5 rounded-sm text-xs ${statusColors[selected.status]}`}>
                  {statusLabels[selected.status]}
                </span>
              </div>
              <div>
                <span className="text-sepia/50">收件人：</span>
                <span className="text-bark">{selected.recipient_email}</span>
                {selected.recipient_name && ` (${selected.recipient_name})`}
              </div>
              <div>
                <span className="text-sepia/50">寄件人：</span>
                <span className="text-bark">{selected.sender_name || "匿名"}</span>
              </div>
              <div>
                <span className="text-sepia/50">主题：</span>
                <span className="text-bark">{selected.subject || "(无)"}</span>
              </div>
              <div>
                <span className="text-sepia/50">预约发送：</span>
                <span className="text-bark">{formatDate(selected.send_at)}</span>
              </div>
              {selected.sent_at && (
                <div>
                  <span className="text-sepia/50">实际发送：</span>
                  <span className="text-bark">{formatDate(selected.sent_at)}</span>
                </div>
              )}
              {selected.config_name && (
                <div>
                  <span className="text-sepia/50">使用邮箱：</span>
                  <span className="text-bark">{selected.config_name}</span>
                </div>
              )}
              {selected.error_msg && (
                <div>
                  <span className="text-sepia/50">错误信息：</span>
                  <span className="text-rust">{selected.error_msg}</span>
                </div>
              )}
              <div>
                <span className="text-sepia/50">信件内容：</span>
                <div className="mt-1 p-3 bg-cream/50 border border-gold/10 rounded-sm font-serif text-bark/80 whitespace-pre-wrap leading-relaxed">
                  {selected.content}
                </div>
              </div>
              <div className="text-xs text-sepia/30 mb-3">
                创建时间: {formatDate(selected.created_at)}
              </div>

              {loadingAttachments ? (
                <div className="text-xs text-sepia/50 py-2">加载附件中...</div>
              ) : attachments.length > 0 ? (
                <div className="border-t border-gold/10 pt-3">
                  <span className="text-sm text-sepia/60 mb-2 block">附件</span>
                  <div className="space-y-2">
                    {attachments.map((att) => (
                      <div key={att.id}>
                        {att.type === "image" ? (
                          <img
                            src={att.storage_url}
                            alt={att.file_name}
                            className="w-full rounded-sm border border-sepia/10"
                          />
                        ) : (
                          <div className="p-2 bg-cream/50 rounded-sm border border-sepia/10">
                            <audio src={att.storage_url} controls className="w-full h-8" />
                            <p className="text-xs text-sepia/50 mt-1">{att.file_name}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="mt-4 pt-3 border-t border-gold/20 flex justify-between">
              {selected.status === "failed" && (
                <button
                  onClick={() => handleResend(selected.id)}
                  className="vintage-btn-primary vintage-btn-sm"
                >
                  重新发送
                </button>
              )}
              <div className="flex-1" />
              <button
                onClick={() => handleDelete(selected.id)}
                className="vintage-btn-danger vintage-btn-sm"
              >
                删除信件
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
