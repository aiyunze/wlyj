"use client";

import Link from "next/link";
import AnnouncementModal from "../components/AnnouncementModal";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-16 bg-cream">
      <div className="absolute inset-0 bg-paper-texture pointer-events-none" />

      <div className="relative z-10 w-full max-w-lg mx-auto text-center">
        <div className="animate-fade-in mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-paper border-2 border-gold/50 mb-6">
            <svg
              width="36"
              height="36"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#8B6914"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="M2 7l10 7 10-7" />
              <line x1="12" y1="11" x2="12" y2="18" />
            </svg>
          </div>

          <p className="text-sepia/70 text-xs tracking-[0.3em] uppercase mb-3">
            Time Post Office
          </p>
          <h1 className="font-serif text-4xl md:text-5xl text-bark font-bold tracking-wide">
            时光邮局
          </h1>
          <p className="mt-4 text-sepia/70 text-base leading-relaxed max-w-sm mx-auto">
            写一封信，让它穿越时光
            <br />
            在未来的某一天，抵达你念念不忘的人手中
          </p>
        </div>

        <div className="animate-fade-in-up animate-delay-200">
          <Link
            href="/write/type"
            className="vintage-btn-primary inline-block w-full text-center text-lg"
          >
            写一封信
          </Link>
        </div>

        <div className="animate-fade-in-up animate-delay-400 mt-12 flex items-center justify-center gap-6 text-sepia/40 text-sm">
          <span className="flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            定时投递
          </span>
          <span className="flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            安全加密
          </span>
          <span className="flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            准时送达
          </span>
        </div>

        <p className="animate-fade-in-up animate-delay-600 mt-10 text-sepia/25 text-xs">
          时光流转，文字永恒
        </p>
      </div>

      <AnnouncementModal />
    </main>
  );
}
