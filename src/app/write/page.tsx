"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import ImageUploader from "../../components/ImageUploader";
import VoiceRecorder from "../../components/VoiceRecorder";

interface AttachmentItem {
  id: string;
  url: string;
  file_name: string;
}

type LetterType = "text" | "image" | "voice" | "text_image" | "text_voice" | "voice_image" | "text_voice_image";

const typeLabels: Record<LetterType, string> = {
  text: "纯文本",
  image: "纯图片",
  voice: "纯语音",
  text_image: "文本 + 图片",
  text_voice: "文本 + 语音",
  voice_image: "语音 + 图片",
  text_voice_image: "文本 + 语音 + 图片",
};

export default function WritePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawType = searchParams.get("type") || "text";
  const letterType: LetterType = (typeLabels[rawType as LetterType] ? rawType : "text") as LetterType;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    recipient_email: "",
    recipient_name: "",
    sender_name: "",
    subject: "",
    content: "",
    send_at: "",
  });

  const [images, setImages] = useState<AttachmentItem[]>([]);
  const [voice, setVoice] = useState<AttachmentItem | null>(null);
  const [attachmentIds, setAttachmentIds] = useState<string[]>([]);

  const showImageUploader = letterType.includes("image");
  const showVoiceRecorder = letterType.includes("voice");
  const showContentField = letterType.includes("text");
  const contentRequired = letterType === "text";

  const uploadFile = async (file: File | Blob, type: string, fileName: string) => {
    const uploadFile = file instanceof File ? file : new File([file], fileName, { type: file.type || "audio/webm" });
    const fd = new FormData();
    fd.append("file", uploadFile, fileName);
    fd.append("type", type);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    if (!res.ok) {
      const data: any = await res.json();
      throw new Error(data.error || "上传失败");
    }
    const data: any = await res.json();
    return data;
  };

  const handleAddImage = useCallback(async (file: File) => {
    const data = await uploadFile(file, "image", file.name);
    setImages((prev) => [...prev, { id: data.id, url: data.url, file_name: data.file_name }]);
    setAttachmentIds((prev) => [...prev, data.id]);
    return data;
  }, []);

  const handleRemoveImage = useCallback((id: string) => {
    setImages((prev) => prev.filter((i) => i.id !== id));
    setAttachmentIds((prev) => prev.filter((iid) => iid !== id));
  }, []);

  const handleAddVoice = useCallback(async (blob: Blob, fileName: string) => {
    const data = await uploadFile(blob, "audio", fileName);
    setVoice({ id: data.id, url: data.url, file_name: data.file_name });
    setAttachmentIds((prev) => [...prev, data.id]);
    return data;
  }, []);

  const handleRemoveVoice = useCallback(() => {
    if (voice) {
      setAttachmentIds((prev) => prev.filter((id) => id !== voice.id));
      setVoice(null);
    }
  }, [voice]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/letters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, attachment_ids: attachmentIds, letter_type: letterType }),
      });

      const data: any = await res.json();
      if (!res.ok) {
        setError(data.error || "提交失败");
        return;
      }

      setSuccess(true);
    } catch {
      setError("网络错误，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 bg-cream">
        <div className="paper-card p-10 max-w-md w-full text-center animate-fade-in-up">
          <div className="animate-stamp-in mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-moss/10">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#6B8E4E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
          </div>
          <h2 className="font-serif text-2xl text-bark mb-3">信件已投递</h2>
          <p className="text-sepia/70 text-sm leading-relaxed mb-6">
            你的信已放入时光邮筒，
            <br />
            将在指定的时间准时发出。
          </p>
          <Link href="/" className="vintage-btn-outline inline-block">
            返回首页
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-cream py-8 px-4">
      <div className="absolute inset-0 bg-paper-texture pointer-events-none" />

      <div className="relative z-10 max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/write/type"
            className="inline-flex items-center gap-1 text-sepia/60 text-sm hover:text-sepia transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            返回
          </Link>
          <span className="text-xs text-sepia/40 px-2 py-1 rounded-sm border border-gold/20 bg-paper/50">
            {typeLabels[letterType]}
          </span>
        </div>

        <div className="paper-card p-6 md:p-8">
          <h2 className="font-serif text-2xl text-bark text-center mb-1">
            写一封信
          </h2>
          <p className="text-sepia/50 text-sm text-center mb-8">
            每个字段都可以用心填写
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm text-bark/70 mb-1.5">
                收件人邮箱 <span className="text-rust">*</span>
              </label>
              <input
                type="email"
                required
                className="vintage-input"
                placeholder="ta@example.com"
                value={form.recipient_email}
                onChange={(e) =>
                  setForm({ ...form, recipient_email: e.target.value })
                }
              />
            </div>

            <div>
              <label className="block text-sm text-bark/70 mb-1.5">
                收件人姓名
              </label>
              <input
                type="text"
                className="vintage-input"
                placeholder="让信件更亲切"
                value={form.recipient_name}
                onChange={(e) =>
                  setForm({ ...form, recipient_name: e.target.value })
                }
              />
            </div>

            <div>
              <label className="block text-sm text-bark/70 mb-1.5">
                你的署名
              </label>
              <input
                type="text"
                className="vintage-input"
                placeholder="留空则匿名发送"
                value={form.sender_name}
                onChange={(e) =>
                  setForm({ ...form, sender_name: e.target.value })
                }
              />
            </div>

            <div>
              <label className="block text-sm text-bark/70 mb-1.5">
                信件主题
              </label>
              <input
                type="text"
                className="vintage-input"
                placeholder="给这封信一个标题"
                value={form.subject}
                onChange={(e) =>
                  setForm({ ...form, subject: e.target.value })
                }
              />
            </div>

            {showContentField && (
              <div>
                <label className="block text-sm text-bark/70 mb-1.5">
                  信件内容 <span className={contentRequired ? "text-rust" : "text-sepia/50"}>{contentRequired ? " *" : " (选填)"}</span>
                </label>
                <textarea
                  required={contentRequired}
                  rows={8}
                  className="vintage-textarea"
                  placeholder="写下你想说的话..."
                  value={form.content}
                  onChange={(e) =>
                    setForm({ ...form, content: e.target.value })
                  }
                />
              </div>
            )}

            <div>
              <label className="block text-sm text-bark/70 mb-1.5">
                发送时间 <span className="text-rust">*</span>
              </label>
              <input
                type="datetime-local"
                required
                className="vintage-input"
                value={form.send_at}
                onChange={(e) =>
                  setForm({ ...form, send_at: e.target.value })
                }
              />
              <p className="text-sepia/40 text-xs mt-1">
                选择一个未来的时间，信件将在那一刻发出
              </p>
            </div>

            {showImageUploader && (
              <ImageUploader images={images} onAdd={handleAddImage} onRemove={handleRemoveImage} />
            )}

            {showVoiceRecorder && (
              <VoiceRecorder audio={voice} onAdd={handleAddVoice} onRemove={handleRemoveVoice} />
            )}

            <p className="text-sepia/30 text-[11px] leading-relaxed">
              上传的图片和语音将在发送后保留 180 天，过期后需管理员确认才会删除
            </p>

            {error && (
              <div className="p-3 bg-rust/10 border border-rust/20 rounded-sm text-rust text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="vintage-btn-primary w-full text-lg disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4" strokeDashoffset="10" />
                  </svg>
                  投递中...
                </span>
              ) : (
                "投入时光邮筒"
              )}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
