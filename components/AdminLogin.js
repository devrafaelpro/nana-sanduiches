"use client";

import { useState } from "react";

export default function AdminLogin({ demoHint = null }) {
  const [user, setUser] = useState(demoHint?.user || "");
  const [pass, setPass] = useState(demoHint?.pass || "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user, pass }),
      });
      if (res.ok) {
        window.location.reload();
      } else {
        const data = await res.json();
        setError(data.error || "Falha no login");
      }
    } catch {
      setError("Erro de conexão");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-dvh items-center justify-center px-5">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm animate-scale-in rounded-3xl border border-ink-700 bg-ink-800 p-8 shadow-card"
      >
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand text-3xl shadow-glow">
            🍔
          </div>
          <h1 className="font-display text-2xl font-extrabold text-white">
            Painel Admin
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Gerencie seu cardápio
          </p>
        </div>

        {demoHint && (
          <div className="mb-4 rounded-xl bg-amber-500/15 px-4 py-3 text-center text-sm text-amber-300">
            🧪 <strong>Demonstração</strong> — entre com{" "}
            <strong>{demoHint.user}</strong> / <strong>{demoHint.pass}</strong>{" "}
            e teste o painel à vontade.
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="label">Usuário</label>
            <input
              className="input"
              value={user}
              onChange={(e) => setUser(e.target.value)}
              placeholder="admin"
              autoComplete="username"
            />
          </div>
          <div>
            <label className="label">Senha</label>
            <input
              type="password"
              className="input"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>
        </div>

        {error && (
          <p className="mt-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="btn-primary mt-6 w-full disabled:opacity-60"
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </main>
  );
}
