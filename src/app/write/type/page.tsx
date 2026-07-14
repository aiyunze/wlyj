"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

interface LetterType {
  key: string;
  label: string;
  desc: string;
  icon: JSX.Element;
}

const letterTypes: LetterType[] = [
  {
    key: "text",
    label: "纯文本",
    desc: "用文字记录此刻的心情",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
  },
  {
    key: "image",
    label: "纯图片",
    desc: "用画面讲述故事",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
      </svg>
    ),
  },
  {
    key: "voice",
    label: "纯语音",
    desc: "用声音传递温度",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
        <path d="M19 10v2a7 7 0 01-14 0v-2" />
        <line x1="12" y1="19" x2="12" y2="23" />
        <line x1="8" y1="23" x2="16" y2="23" />
      </svg>
    ),
  },
  {
    key: "text_image",
    label: "文本 + 图片",
    desc: "文字与画面交织的温柔",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
      </svg>
    ),
  },
  {
    key: "text_voice",
    label: "文本 + 语音",
    desc: "让声音陪伴文字抵达",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
        <path d="M19 10v2a7 7 0 01-14 0v-2" />
        <line x1="12" y1="19" x2="12" y2="23" />
        <line x1="8" y1="23" x2="16" y2="23" />
      </svg>
    ),
  },
  {
    key: "voice_image",
    label: "语音 + 图片",
    desc: "不用文字，也能表达心意",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
        <path d="M19 10v2a7 7 0 01-14 0v-2" />
        <rect x="14" y="3" width="6" height="6" rx="1" />
        <circle cx="17" cy="6" r="1" />
      </svg>
    ),
  },
  {
    key: "text_voice_image",
    label: "文本 + 语音 + 图片",
    desc: "完整记录，声色俱全",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
        <path d="M15 3v4" />
        <path d="M13 5h4" />
      </svg>
    ),
  },
];

export default function TypeSelectPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-cream py-8 px-4">
      <div className="absolute inset-0 bg-paper-texture pointer-events-none" />

      <div className="relative z-10 max-w-lg mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sepia/60 text-sm mb-6 hover:text-sepia transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          返回
        </Link>

        <div className="paper-card p-6 md:p-8">
          <h2 className="font-serif text-2xl text-bark text-center mb-1">
            选择信件格式
          </h2>
          <p className="text-sepia/50 text-sm text-center mb-8">
            每一种表达都有它的温度
          </p>

          <div className="space-y-3">
            {letterTypes.map((type) => (
              <button
                key={type.key}
                onClick={() => router.push(`/write?type=${type.key}`)}
                className="w-full flex items-center gap-4 p-4 rounded-sm border border-gold/20 bg-paper/50 hover:border-gold/60 hover:bg-paper transition-all text-left group"
              >
                <div className="text-sepia/50 group-hover:text-bark transition-colors">
                  {type.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-bark font-medium">{type.label}</div>
                  <div className="text-xs text-sepia/50 mt-0.5">{type.desc}</div>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-sepia/30 group-hover:text-bark transition-colors">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
