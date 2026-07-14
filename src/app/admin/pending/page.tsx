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
  created_at: string;
}

export default function PendingPage() {
  const [letters, setLetters] = useState<Letter[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const loadLetters = async () => {
    try {
      const res = await fetch("/api/admin/letters");
      const data = await res.json();
      const all = (data.letters || []) as Letter[];
      setLetters(all.filter((l) => l.status === "pending").sort((a, b) => new Date(a.send_at).getTime() - new Date(b.send_at).getTime()));
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLetters();
  }, []);

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

  const sendLetter = async (id: string) => {
    setSendingId(id);
    setMessage("");
    try {
      const res = await fetch(`/api/admin/letters/${id}/send`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setMessage(`信件发送成功：${data.recipient}`);
        loadLetters();
      } else {
        setMessage(data.error || "发送失败");
      }
    } catch {
      setMessage("网络错误");
    } finally {
      setSendingId(null);
      setTimeout(() => setMessage(""), 3000);
    }
  };

  const isPastDue = (sendAt: string) => {
    return new Date(sendAt) <= new Date();
  };

  if (loading) {
    return (
      <div className="text-center py-12 text-sepia/50">加载中...</div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-serif text-2xl text-bark">待发送信件</h2>
        <span className="text-xs text-sepia/50">共 {letters.length} 封待发送</span>
      </div>

      {message && (
        <div className={`mb-4 p-2 rounded-sm text-sm text-center ${message.includes("成功") ? "bg-moss/10 border border-moss/20 text-moss" : "bg-rust/10 border border-rust/20 text-rust"}`}>
          {message}
        </div>
      )}

      {letters.length === 0 ? (
        <div className="paper-card p-8 text-center text-sepia/50">
          暂无待发送信件
        </div>
      ) : (
        <div className="grid gap-3">
          {letters.map((letter) => (
            <div
              key={letter.id}
              className="paper-card p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs px-2 py-0.5 rounded-sm ${isPastDue(letter.send_at) ? "bg-rust/20 text-rust" : "bg-gold/20 text-sepia"}`}>
                      {isPastDue(letter.send_at) ? "已过期" : "待发送"}
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
                    {letter.recipient_name && ` (${letter.recipient_name})`}
                    {letter.sender_name && ` · 寄件: ${letter.sender_name}`}
                  </div>
                  <div className="text-xs text-sepia/40 mt-0.5">
                    预约时间: {formatDate(letter.send_at)}
                    {isPastDue(letter.send_at) && (
                      <span className="text-rust ml-1">*</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => sendLetter(letter.id)}
                  disabled={sendingId === letter.id}
                  className={`vintage-btn-sm ${isPastDue(letter.send_at) ? "vintage-btn-primary" : "vintage-btn-outline"} disabled:opacity-50`}
                >
                  {sendingId === letter.id ? "发送中..." : "立即发送"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {letters.length > 0 && (
        <div className="mt-4 p-3 bg-gold/10 border border-gold/20 rounded-sm text-xs text-sepia/60">
          <span className="text-rust">*</span> 标记为"已过期"的信件预约时间已到，可手动触发发送
        </div>
      )}
    </div>
  );
}
