"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Stats {
  total: number;
  pending: number;
  sent: number;
  failed: number;
  configs: number;
}

export default function AdminPage() {
  const [stats, setStats] = useState<Stats>({
    total: 0,
    pending: 0,
    sent: 0,
    failed: 0,
    configs: 0,
  });
  const [cronResult, setCronResult] = useState<string>("");
  const [cronLoading, setCronLoading] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [lettersRes, configsRes] = await Promise.all([
        fetch("/api/admin/letters"),
        fetch("/api/admin/emails"),
      ]);
      const lettersData = await lettersRes.json();
      const configsData = await configsRes.json();

      const letters = lettersData.letters || [];
      setStats({
        total: letters.length,
        pending: letters.filter((l: any) => l.status === "pending").length,
        sent: letters.filter((l: any) => l.status === "sent").length,
        failed: letters.filter((l: any) => l.status === "failed").length,
        configs: (configsData.configs || []).length,
      });
    } catch {
      // ignore
    }
  };

  const triggerCron = async () => {
    setCronLoading(true);
    setCronResult("");
    try {
      const res = await fetch("/api/cron");
      const data: any = await res.json();
      setCronResult(
        `处理了 ${data.processed} 封信件：${data.results
          .map(
            (r: any) =>
              `${r.success ? "发送成功" : "发送失败"}: ${r.recipient}`
          )
          .join("；")}`
      );
      loadStats();
    } catch {
      setCronResult("执行失败");
    } finally {
      setCronLoading(false);
    }
  };

  const cards = [
    { label: "总信件", value: stats.total, color: "bg-bark" },
    { label: "待发送", value: stats.pending, color: "bg-gold" },
    { label: "已发送", value: stats.sent, color: "bg-moss" },
    { label: "发送失败", value: stats.failed, color: "bg-rust" },
    { label: "邮箱配置", value: stats.configs, color: "bg-sepia" },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-serif text-2xl text-bark">系统概览</h2>
        <div className="flex gap-2">
          <button
            onClick={triggerCron}
            disabled={cronLoading}
            className="vintage-btn-primary vintage-btn-sm"
          >
            {cronLoading ? "执行中..." : "手动触发发送"}
          </button>
          <Link href="/admin/emails" className="vintage-btn-outline vintage-btn-sm">
            管理邮箱
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {cards.map((card) => (
          <div key={card.label} className="paper-card p-4 text-center">
            <div
              className={`inline-block w-2 h-2 rounded-full ${card.color} mb-2`}
            />
            <div className="font-serif text-2xl text-bark">{card.value}</div>
            <div className="text-xs text-sepia/60 mt-0.5">{card.label}</div>
          </div>
        ))}
      </div>

      {cronResult && (
        <div className="paper-card p-4 text-sm text-sepia mb-6">{cronResult}</div>
      )}
    </div>
  );
}
