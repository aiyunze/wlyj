"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [twoFactorPassword, setTwoFactorPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [twoFactorRequired, setTwoFactorRequired] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, twoFactorPassword }),
      });

      const data: any = await res.json();
      if (!res.ok) {
        if (data.twoFactorRequired) {
          setTwoFactorRequired(true);
          setError("");
        } else {
          setError(data.error || "登录失败");
        }
        return;
      }

      const from = searchParams.get("from") || "/admin";
      router.push(from);
    } catch {
      setError("网络错误");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative z-10 paper-card p-8 max-w-sm w-full animate-fade-in-up">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-bark/10 mb-4">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#5C3D2E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0110 0v4" />
          </svg>
        </div>
        <h2 className="font-serif text-xl text-bark">管理后台</h2>
        <p className="text-sepia/50 text-sm mt-1">请输入用户名和密码以继续</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          required
          className="vintage-input text-center"
          placeholder="管理员用户名"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoFocus
        />
        <input
          type="password"
          required
          className="vintage-input text-center"
          placeholder="管理员密码"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {twoFactorRequired && (
          <input
            type="password"
            required
            className="vintage-input text-center"
            placeholder="二级密码"
            value={twoFactorPassword}
            onChange={(e) => setTwoFactorPassword(e.target.value)}
            autoFocus
          />
        )}

        {error && (
          <div className="p-2 bg-rust/10 border border-rust/20 rounded-sm text-rust text-xs text-center">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="vintage-btn-primary w-full disabled:opacity-50"
        >
          {loading ? "验证中..." : "进入管理后台"}
        </button>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-cream">
      <div className="absolute inset-0 bg-paper-texture pointer-events-none" />
      <Suspense fallback={<div className="text-sepia/50">加载中...</div>}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
