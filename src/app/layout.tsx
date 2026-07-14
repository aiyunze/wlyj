import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "时光邮局 - 给未来写一封信",
  description: "写一封信，让它穿越时光，在未来的某一天抵达。",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-cream">{children}</body>
    </html>
  );
}
