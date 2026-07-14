"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  const links = [
    { href: "/admin", label: "概览", exact: true },
    { href: "/admin/pending", label: "待发送" },
    { href: "/admin/letters", label: "信件管理" },
    { href: "/admin/attachments", label: "附件管理" },
    { href: "/admin/emails", label: "邮箱配置" },
    { href: "/admin/announcements", label: "公告管理" },
    { href: "/admin/settings", label: "系统设置" },
  ];

  const handleLogout = async () => {
    await fetch("/api/admin/login", { method: "DELETE" });
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-cream">
      <div className="absolute inset-0 bg-paper-texture pointer-events-none" />

      <nav className="relative z-10 bg-bark text-paper/90">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/admin" className="font-serif text-lg tracking-wide">
            时光邮局 · 管理
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-paper/50 hover:text-paper/80 text-sm transition-colors"
            >
              返回前台
            </Link>
            <button
              onClick={handleLogout}
              className="text-paper/40 hover:text-paper/70 text-sm transition-colors"
            >
              退出
            </button>
          </div>
        </div>
        <div className="max-w-5xl mx-auto px-4 flex gap-1 pb-2">
          {links.map((link) => {
            const active = link.exact
              ? pathname === link.href
              : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-1.5 text-sm rounded-t-sm transition-colors ${
                  active
                    ? "bg-cream text-bark"
                    : "text-paper/50 hover:text-paper/80"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      </nav>

      <main className="relative z-10 max-w-5xl mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
}
