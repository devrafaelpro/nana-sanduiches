"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { formatPrice, maskFone } from "@/lib/format";

// Área do cliente: "login" por nome + WhatsApp (fica salvo no aparelho).
// Pedidos em andamento aparecem grandes, com linha do tempo e chat aberto;
// entregues e cancelados ficam compactos, expandindo só se o cliente tocar.

const PERFIL_KEY = "cardapio_cliente";

const STATUS = {
  recebido: { label: "Recebido", emoji: "📥" },
  aceito: { label: "Aceito", emoji: "✅" },
  preparando: { label: "Em preparação", emoji: "👨‍🍳" },
  saiu: { label: "Saiu p/ entrega", emoji: "🛵" },
  entregue: { label: "Entregue", emoji: "😋" },
  cancelado: { label: "Cancelado", emoji: "❌" },
};
const FLUXO = ["recebido", "aceito", "preparando", "saiu", "entregue"];

export default function MeusPedidos({ restaurant }) {
  const [perfil, setPerfil] = useState(null);
  const [nome, setNome] = useState("");
  const [tel, setTel] = useState("");
  const [pedidos, setPedidos] = useState(null);
  const [drafts, setDrafts] = useState({});
  const [aberto, setAberto] = useState({});
  const [enviando, setEnviando] = useState(false);
  const timer = useRef(null);

  useEffect(() => {
    try {
      const salvo = JSON.parse(localStorage.getItem(PERFIL_KEY) || "null");
      if (salvo?.tel) {
        setPerfil(salvo);
      } else {
        // aproveita os dados do checkout, se existirem
        const c = JSON.parse(localStorage.getItem("cardapio_customer") || "null");
        if (c?.name) setNome(c.name);
        if (c?.telefone) setTel(maskFone(c.telefone));
      }
    } catch {}
  }, []);

  async function carregar(p = perfil) {
    if (!p?.tel) return;
    try {
      const res = await fetch(`/api/pedidos/meus?tel=${encodeURIComponent(p.tel)}`);
      if (res.ok) setPedidos(await res.json());
    } catch {}
  }

  // carrega e fica atualizando sozinho (chat/status "ao vivo")
  useEffect(() => {
    if (!perfil) return;
    carregar();
    timer.current = setInterval(() => carregar(), 12000);
    return () => clearInterval(timer.current);
  }, [perfil]);

  function entrar(e) {
    e.preventDefault();
    const dig = tel.replace(/\D/g, "");
    if (!nome.trim() || dig.length < 10) return;
    const p = { nome: nome.trim(), tel: dig };
    localStorage.setItem(PERFIL_KEY, JSON.stringify(p));
    setPerfil(p);
  }

  function sair() {
    localStorage.removeItem(PERFIL_KEY);
    setPerfil(null);
    setPedidos(null);
  }

  async function enviarMsg(pedido) {
    const texto = (drafts[pedido.id] || "").trim();
    if (!texto || enviando) return;
    setEnviando(true);
    // otimista: já mostra a mensagem
    setPedidos((lista) =>
      lista.map((p) =>
        p.id === pedido.id
          ? {
              ...p,
              mensagens: [
                ...(p.mensagens || []),
                { de: "cliente", texto, em: new Date().toISOString() },
              ],
            }
          : p
      )
    );
    setDrafts((d) => ({ ...d, [pedido.id]: "" }));
    try {
      await fetch("/api/pedidos/mensagem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: pedido.id, tel: perfil.tel, texto }),
      });
    } catch {}
    setEnviando(false);
  }

  const fmtHora = (iso) =>
    new Date(iso).toLocaleString("pt-BR", {
      timeZone: "America/Sao_Paulo",
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });

  const ativos = (pedidos || []).filter(
    (p) => !["entregue", "cancelado"].includes(p.status)
  );
  const entregues = (pedidos || []).filter((p) => p.status === "entregue");
  const cancelados = (pedidos || []).filter((p) => p.status === "cancelado");

  function renderItens(p) {
    return (
      <div className="space-y-1 px-4 pt-3 text-sm text-zinc-300">
        {p.items.map((i, idx) => (
          <p key={idx}>
            <b className="text-white">
              {i.qtd}x {i.nome}
            </b>{" "}
            <span className="text-brand-light">{formatPrice(i.total)}</span>
          </p>
        ))}
        <p className="pt-1 text-zinc-400">
          {p.entrega > 0 && <>Entrega {formatPrice(p.entrega)} • </>}
          Total{" "}
          <b className="font-display text-base text-brand-light">
            {formatPrice(p.total)}
          </b>
        </p>
      </div>
    );
  }

  function renderChat(p) {
    return (
      <div className="mt-3 border-t border-ink-700 bg-ink-900/40 px-4 py-3">
        <div className="max-h-56 space-y-2 overflow-y-auto">
          {(p.mensagens || []).length === 0 && (
            <p className="text-center text-xs text-zinc-600">
              Precisa falar com a loja sobre esse pedido? Escreva aqui. 👇
            </p>
          )}
          {(p.mensagens || []).map((m, idx) =>
            m.sys ? (
              <p key={idx} className="text-center text-[11px] text-zinc-500">
                {m.texto}
              </p>
            ) : (
              <div
                key={idx}
                className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                  m.de === "cliente"
                    ? "ml-auto rounded-br-sm bg-brand/20 text-white"
                    : "rounded-bl-sm bg-ink-700 text-zinc-200"
                }`}
              >
                {m.texto}
                <span className="mt-0.5 block text-right text-[9px] text-zinc-500">
                  {fmtHora(m.em)}
                </span>
              </div>
            )
          )}
        </div>
        <div className="mt-3 flex gap-2">
          <input
            className="input py-2.5 text-sm"
            value={drafts[p.id] || ""}
            onChange={(e) => setDrafts((d) => ({ ...d, [p.id]: e.target.value }))}
            onKeyDown={(e) => e.key === "Enter" && enviarMsg(p)}
            placeholder="Mensagem pra loja..."
          />
          <button
            onClick={() => enviarMsg(p)}
            className="btn-primary shrink-0 px-4 py-2 text-sm"
          >
            ➤
          </button>
        </div>
      </div>
    );
  }

  // Pedido em andamento: cartão completo com linha do tempo e chat
  function renderAtivo(p) {
    const idxAtual = FLUXO.indexOf(p.status);
    const atual = STATUS[p.status] || STATUS.recebido;
    return (
      <div
        key={p.id}
        className="overflow-hidden rounded-3xl border border-brand/40 bg-ink-800 shadow-card"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink-700 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-bold text-brand-light">
              #{p.id}
            </span>
            <span className="text-xs text-zinc-400">{fmtHora(p.criadoEm)}</span>
          </div>
          <span className="rounded-full bg-brand/15 px-3 py-1 text-xs font-bold text-brand-light">
            {atual.emoji} {atual.label}
          </span>
        </div>

        {/* linha do tempo */}
        <div className="px-4 pt-4">
          <div className="flex items-center">
            {FLUXO.map((st, i) => {
              const feito = i <= idxAtual;
              const corrente = i === idxAtual;
              return (
                <div key={st} className="flex flex-1 items-center last:flex-none">
                  <div className="flex flex-col items-center">
                    <span
                      className={`flex h-8 w-8 items-center justify-center rounded-full text-sm ${
                        feito
                          ? "bg-brand text-white shadow-glow"
                          : "bg-ink-700 text-zinc-500"
                      } ${corrente ? "ring-2 ring-brand-light/60" : ""}`}
                    >
                      {STATUS[st].emoji}
                    </span>
                    <span
                      className={`mt-1 w-14 text-center text-[9px] font-semibold leading-tight ${
                        corrente
                          ? "text-white"
                          : feito
                            ? "text-brand-light"
                            : "text-zinc-600"
                      }`}
                    >
                      {STATUS[st].label}
                    </span>
                  </div>
                  {i < FLUXO.length - 1 && (
                    <div
                      className={`mx-0.5 mb-4 h-0.5 flex-1 rounded ${
                        i < idxAtual ? "bg-brand" : "bg-ink-700"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {renderItens(p)}
        {renderChat(p)}
      </div>
    );
  }

  // Pedido finalizado: linha compacta que expande ao toque
  function renderFinalizado(p) {
    const cancelado = p.status === "cancelado";
    const exp = !!aberto[p.id];
    return (
      <div
        key={p.id}
        className="overflow-hidden rounded-2xl border border-ink-700 bg-ink-800"
      >
        <button
          onClick={() => setAberto((a) => ({ ...a, [p.id]: !exp }))}
          className="flex w-full items-center gap-2 px-4 py-3 text-left"
        >
          <span className="font-mono text-sm font-bold text-brand-light">
            #{p.id}
          </span>
          <span className="text-xs text-zinc-500">{fmtHora(p.criadoEm)}</span>
          <span
            className={`ml-auto rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
              cancelado
                ? "bg-red-500/10 text-red-400"
                : "bg-green-500/10 text-green-400"
            }`}
          >
            {cancelado ? "✖ Cancelado" : "✓ Entregue"}
          </span>
          <span className="text-sm font-bold text-zinc-300">
            {formatPrice(p.total)}
          </span>
          <span
            className={`text-xs text-zinc-500 transition-transform ${
              exp ? "rotate-180" : ""
            }`}
          >
            ▼
          </span>
        </button>
        {exp && (
          <div className="border-t border-ink-700 pb-1">
            {renderItens(p)}
            {renderChat(p)}
          </div>
        )}
      </div>
    );
  }

  return (
    <main className="mx-auto min-h-dvh max-w-2xl px-4 pb-16">
      {/* Cabeçalho */}
      <header className="sticky top-0 z-20 -mx-4 mb-5 border-b border-ink-700 bg-ink-900/90 px-4 py-4 backdrop-blur-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-xl font-bold text-heading">
              📦 Meus pedidos
            </h1>
            <p className="text-xs text-zinc-400">{restaurant.name}</p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/cardapio" className="btn-ghost px-4 py-2 text-sm">
              🍽️ Cardápio
            </Link>
            {perfil && (
              <button onClick={sair} className="text-sm text-zinc-400 hover:text-white">
                Sair
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Login simples */}
      {!perfil && (
        <form
          onSubmit={entrar}
          className="mx-auto mt-10 max-w-sm rounded-3xl border border-ink-700 bg-ink-800 p-7 shadow-card"
        >
          <p className="text-center text-4xl">👋</p>
          <h2 className="mt-3 text-center font-display text-xl font-bold text-heading">
            Acompanhe seus pedidos
          </h2>
          <p className="mt-1 text-center text-sm text-zinc-400">
            Informe o nome e o WhatsApp usados no pedido.
          </p>
          <div className="mt-5 space-y-3">
            <div>
              <label className="label">Seu nome</label>
              <input
                className="input"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Maria"
              />
            </div>
            <div>
              <label className="label">Seu WhatsApp</label>
              <input
                className="input"
                value={tel}
                onChange={(e) => setTel(maskFone(e.target.value))}
                inputMode="tel"
                placeholder="(89) 99999-9999"
              />
            </div>
          </div>
          <button type="submit" className="btn-primary mt-5 w-full">
            Ver meus pedidos
          </button>
        </form>
      )}

      {/* Lista de pedidos */}
      {perfil && (
        <>
          <p className="mb-4 text-sm text-zinc-400">
            Olá, <b className="text-white">{perfil.nome.split(" ")[0]}</b>! 👋 Esta
            página atualiza sozinha.
          </p>

          {pedidos === null && (
            <p className="py-10 text-center text-zinc-500">Carregando...</p>
          )}
          {pedidos?.length === 0 && (
            <div className="rounded-2xl border border-dashed border-ink-600 px-6 py-12 text-center">
              <p className="text-4xl">🔍</p>
              <p className="mt-3 text-zinc-400">
                Nenhum pedido encontrado para esse WhatsApp ainda.
              </p>
              <Link href="/cardapio" className="btn-primary mt-5 inline-flex">
                Fazer meu primeiro pedido
              </Link>
            </div>
          )}

          {ativos.length > 0 && (
            <section className="mb-7">
              <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-zinc-500">
                🔥 Em andamento
              </h2>
              <div className="space-y-5">{ativos.map(renderAtivo)}</div>
            </section>
          )}

          {pedidos?.length > 0 && ativos.length === 0 && (
            <div className="mb-7 rounded-2xl border border-ink-700 bg-ink-800 px-5 py-5 text-center">
              <p className="text-sm text-zinc-400">
                Nenhum pedido em andamento agora. Bateu a fome? 😋
              </p>
              <Link href="/cardapio" className="btn-primary mt-3 inline-flex px-6 py-2.5 text-sm">
                Fazer um pedido
              </Link>
            </div>
          )}

          {entregues.length > 0 && (
            <section className="mb-7">
              <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-zinc-500">
                ✅ Entregues ({entregues.length})
              </h2>
              <div className="space-y-2">{entregues.map(renderFinalizado)}</div>
            </section>
          )}

          {cancelados.length > 0 && (
            <section className="mb-7">
              <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-zinc-500">
                ✖ Cancelados ({cancelados.length})
              </h2>
              <div className="space-y-2">{cancelados.map(renderFinalizado)}</div>
            </section>
          )}
        </>
      )}
    </main>
  );
}
