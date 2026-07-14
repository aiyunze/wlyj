"use client";

import { useEffect, useState } from "react";

interface Announcement {
  id: string;
  title: string;
  content: string;
  is_active: number;
  created_at: string;
}

export default function AnnouncementModal() {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const checkAnnouncement = async () => {
      try {
        const res = await fetch("/api/announcement");
        const data = await res.json();
        if (data.announcement) {
          setAnnouncement(data.announcement);
          const lastId = localStorage.getItem("last_announcement_id");
          if (lastId !== data.announcement.id) {
            setShow(true);
          }
        }
      } catch {
        // ignore
      }
    };
    checkAnnouncement();
  }, []);

  const handleClose = () => {
    setShow(false);
    if (announcement) {
      localStorage.setItem("last_announcement_id", announcement.id);
    }
  };

  if (!show || !announcement) return null;

  return (
    <div className="fixed inset-0 bg-ink/50 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="paper-card p-6 max-w-md w-full animate-scale-in">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8B6914" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <h3 className="font-serif text-lg text-bark">{announcement.title}</h3>
          </div>
          <button
            onClick={handleClose}
            className="text-sepia/40 hover:text-bark transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="text-sepia/80 text-sm leading-relaxed mb-4 whitespace-pre-wrap">
          {announcement.content}
        </div>

        <div className="text-xs text-sepia/40 mb-4 text-right">
          {new Date(announcement.created_at).toLocaleDateString("zh-CN")}
        </div>

        <button
          onClick={handleClose}
          className="vintage-btn-primary vintage-btn-sm w-full"
        >
          知道了
        </button>
      </div>
    </div>
  );
}