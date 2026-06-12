"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { formatPrice, discountPercent } from "@/lib/format";
import { DEFAULT_THEME, THEME_PRESETS, themeToCss } from "@/lib/theme";
import { DIAS } from "@/lib/horario";

const TABS = [
  { id: "pedidos", label: "📋 Pedidos" },
  { id: "relatorios", label: "📊 Relatórios" },
  { id: "info", label: "Restaurante" },
  { id: "products", label: "Produtos" },
  { id: "categories", label: "Categorias" },
  { id: "addons", label: "Adicionais" },
  { id: "theme", label: "Cores" },
];

const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

// Gera um id simples e único para novos registros.
function newId(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function AdminDashboard({ initialMenu, demoMode = false }) {
  const [menu, setMenu] = useState(initialMenu);
  const [tab, setTab] = useState("pedidos");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");

  function update(patch) {
    setMenu((m) => ({ ...m, ...patch }));
  }

  async function save() {
    setSaving(true);
    setStatus("");
    try {
      const res = await fetch("/api/menu", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(menu),
      });
      if (res.ok) {
        setStatus("Salvo com sucesso! ✅");
        setTimeout(() => setStatus(""), 3000);
      } else {
        const data = await res.json().catch(() => ({}));
        setStatus(data.error || "Erro ao salvar ❌");
        setTimeout(() => setStatus(""), 8000);
      }
    } catch {
      setStatus("Erro de conexão ❌");
      setTimeout(() => setStatus(""), 5000);
    } finally {
      setSaving(false);
    }
  }

  async function logout() {
    await fetch("/api/auth", { method: "DELETE" });
    window.location.reload();
  }

  return (
    <main className="min-h-dvh overflow-x-hidden pb-28">
      {/* Preview do tema ao vivo: aplica as cores escolhidas na hora */}
      <style dangerouslySetInnerHTML={{ __html: themeToCss(menu.theme) }} />

      {demoMode && (
        <div className="bg-amber-500/15 px-4 py-2 text-center text-xs font-semibold text-amber-300">
          🧪 Ambiente de demonstração — pode editar à vontade: as alterações são
          restauradas automaticamente.
        </div>
      )}

      {/* Cabeçalho */}
      <header className="sticky top-0 z-20 border-b border-ink-700 bg-ink-900/90 backdrop-blur-lg">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-xl">
              🍔
            </span>
            <h1 className="font-display text-lg font-bold text-white">Admin</h1>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <a
              href="/cardapio"
              target="_blank"
              className="btn-ghost whitespace-nowrap px-4 py-2 text-sm"
            >
              Ver cardápio
            </a>
            <button onClick={logout} className="text-sm text-zinc-400 hover:text-white">
              Sair
            </button>
          </div>
        </div>

        {/* Abas — scroll horizontal no mobile */}
        <div className="no-scrollbar overflow-x-auto">
          <div className="mx-auto flex max-w-5xl gap-1 px-4 pb-2">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition ${
                  tab === t.id
                    ? "bg-brand text-white"
                    : "bg-ink-700 text-zinc-300 hover:bg-ink-600"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-6">
        {tab === "pedidos" && <PedidosTab menu={menu} />}
        {tab === "relatorios" && <RelatoriosTab />}
        {!["pedidos", "relatorios"].includes(tab) && (
          <div className="mx-auto max-w-3xl">
            {tab === "info" && <InfoTab menu={menu} update={update} />}
            {tab === "products" && <ProductsTab menu={menu} setMenu={setMenu} />}
            {tab === "categories" && (
              <CategoriesTab menu={menu} setMenu={setMenu} />
            )}
            {tab === "addons" && <AddonsTab menu={menu} setMenu={setMenu} />}
            {tab === "theme" && <ThemeTab menu={menu} setMenu={setMenu} />}
          </div>
        )}
      </div>

      {/* Barra de salvar — só nas abas que editam o cardápio */}
      {tab !== "pedidos" && tab !== "relatorios" && (
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-ink-700 bg-ink-900/95 backdrop-blur-lg">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-2 px-4 py-3">
          {status && (
            <span className="text-center text-sm leading-tight text-zinc-400 line-clamp-2">
              {status}
            </span>
          )}
          <button
            onClick={save}
            disabled={saving}
            className="btn-primary w-full max-w-sm disabled:opacity-60"
          >
            {saving ? "Salvando..." : "Salvar alterações"}
          </button>
        </div>
      </div>
      )}
    </main>
  );
}

/* ---------------- Aba: Restaurante ---------------- */
function InfoTab({ menu, update }) {
  const r = menu.restaurant;
  const set = (patch) => update({ restaurant: { ...r, ...patch } });

  return (
    <div className="space-y-5">
      <Card title="Dados do restaurante">
        <Field label="Nome do restaurante">
          <input
            className="input"
            value={r.name}
            onChange={(e) => set({ name: e.target.value })}
          />
        </Field>
        <Field label="Slogan / descrição curta">
          <input
            className="input"
            value={r.tagline}
            onChange={(e) => set({ tagline: e.target.value })}
          />
        </Field>
        <Field label="WhatsApp (com DDI e DDD, só números)">
          <input
            className="input"
            value={r.phone}
            onChange={(e) => set({ phone: e.target.value.replace(/\D/g, "") })}
            placeholder="5511999999999"
          />
        </Field>
        <Field label="Logo (emoji, letra ou link de imagem)">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-brand text-2xl">
              {/^https?:\/\//.test(r.logo) ? (
                <img src={r.logo} alt="logo" className="h-full w-full object-cover" />
              ) : (
                r.logo
              )}
            </div>
            <input
              className="input"
              value={r.logo}
              onChange={(e) => set({ logo: e.target.value })}
              placeholder="🍔 ou https://..."
            />
          </div>
        </Field>
        <Field label="URL da imagem de capa">
          <input
            className="input"
            value={r.cover}
            onChange={(e) => set({ cover: e.target.value })}
          />
        </Field>
        <Field label="Taxa de entrega fixa (R$) — deixe vazio para 'a confirmar'">
          <input
            type="number"
            step="0.5"
            min="0"
            className="input"
            value={r.deliveryFee ?? ""}
            onChange={(e) =>
              set({
                deliveryFee:
                  e.target.value === "" ? null : parseFloat(e.target.value) || 0,
              })
            }
            placeholder="ex: 6.00"
          />
        </Field>
        <Field label="Observação de entrega (usada quando a taxa está vazia)">
          <input
            className="input"
            value={r.deliveryNote || ""}
            onChange={(e) => set({ deliveryNote: e.target.value })}
          />
        </Field>
      </Card>

      <Card title="🕐 Horários de funcionamento">
        <p className="text-sm text-zinc-400">
          Fora do horário, o cardápio mostra "fechado" e não aceita pedidos.
        </p>
        {DIAS.map((dia, i) => {
          const hours =
            Array.isArray(r.hours) && r.hours.length === 7
              ? r.hours
              : DIAS.map(() => ({ aberto: true, de: "00:00", ate: "23:59" }));
          const h = hours[i];
          const setDia = (patch) => {
            const novo = hours.map((x, j) => (j === i ? { ...x, ...patch } : x));
            set({ hours: novo });
          };
          return (
            <div
              key={dia}
              className="flex flex-wrap items-center gap-3 rounded-xl border border-ink-700 bg-ink-900/40 px-3 py-2.5"
            >
              <label className="flex w-32 cursor-pointer items-center gap-2 text-sm font-semibold text-white">
                <input
                  type="checkbox"
                  checked={!!h.aberto}
                  onChange={(e) => setDia({ aberto: e.target.checked })}
                  className="h-4 w-4 accent-brand"
                />
                {dia}
              </label>
              {h.aberto ? (
                <div className="flex items-center gap-2 text-sm text-zinc-300">
                  <input
                    type="time"
                    className="input w-auto px-2 py-1.5 text-sm"
                    value={h.de || "00:00"}
                    onChange={(e) => setDia({ de: e.target.value })}
                  />
                  até
                  <input
                    type="time"
                    className="input w-auto px-2 py-1.5 text-sm"
                    value={h.ate || "23:59"}
                    onChange={(e) => setDia({ ate: e.target.value })}
                  />
                </div>
              ) : (
                <span className="text-sm font-semibold text-red-400">Fechado</span>
              )}
            </div>
          );
        })}
      </Card>
    </div>
  );
}

/* ---------------- Aba: Produtos ---------------- */
function ProductsTab({ menu, setMenu }) {
  const products = menu.products;
  const [expandedId, setExpandedId] = useState(null);
  const [scrollToId, setScrollToId] = useState(null);
  const rowRefs = useRef({});

  // Ao criar/abrir um produto, rola até ele para ficar visível.
  useEffect(() => {
    if (scrollToId && rowRefs.current[scrollToId]) {
      rowRefs.current[scrollToId].scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      setScrollToId(null);
    }
  }, [scrollToId]);

  function setProducts(next) {
    setMenu((m) => ({ ...m, products: next }));
  }

  function addProduct() {
    const p = {
      id: newId("p"),
      category: menu.categories[0]?.id || "",
      name: "Novo produto",
      description: "",
      price: 0,
      image: "",
      featured: false,
      ingredients: [],
    };
    // Entra no início do array → aparece no topo da sua categoria, já aberto.
    setProducts([p, ...products]);
    setExpandedId(p.id);
    setScrollToId(p.id);
  }

  function updateProduct(id, patch) {
    setProducts(products.map((pr) => (pr.id === id ? { ...pr, ...patch } : pr)));
  }

  function removeProduct(id) {
    if (!confirm("Remover este produto?")) return;
    setProducts(products.filter((pr) => pr.id !== id));
  }

  // Move o produto para cima/baixo trocando com o vizinho da MESMA categoria,
  // refletindo exatamente a ordem em que o cliente vê no cardápio.
  function moveProduct(id, dir) {
    const idx = products.findIndex((pr) => pr.id === id);
    if (idx < 0) return;
    const cat = products[idx].category;
    let target = -1;
    if (dir < 0) {
      for (let i = idx - 1; i >= 0; i--)
        if (products[i].category === cat) {
          target = i;
          break;
        }
    } else {
      for (let i = idx + 1; i < products.length; i++)
        if (products[i].category === cat) {
          target = i;
          break;
        }
    }
    if (target < 0) return;
    const next = [...products];
    [next[idx], next[target]] = [next[target], next[idx]];
    setProducts(next);
  }

  return (
    <div className="space-y-6">
      <button onClick={addProduct} className="btn-primary w-full">
        + Adicionar novo produto
      </button>

      {menu.categories.map((cat) => {
        const catProducts = products.filter((p) => p.category === cat.id);
        return (
          <div key={cat.id}>
            <div className="mb-2 flex items-center gap-2">
              <h3 className="font-display text-lg font-bold text-white">
                {cat.icon} {cat.name}
              </h3>
              <span className="text-sm text-zinc-500">
                ({catProducts.length})
              </span>
            </div>

            {catProducts.length === 0 ? (
              <p className="rounded-xl border border-dashed border-ink-600 px-4 py-5 text-center text-sm text-zinc-500">
                Nenhum produto nesta categoria.
              </p>
            ) : (
              <div className="space-y-2">
                {catProducts.map((p, i) => (
                  <ProductRow
                    key={p.id}
                    product={p}
                    categories={menu.categories}
                    expanded={expandedId === p.id}
                    isFirst={i === 0}
                    isLast={i === catProducts.length - 1}
                    setRef={(el) => (rowRefs.current[p.id] = el)}
                    onToggle={() =>
                      setExpandedId(expandedId === p.id ? null : p.id)
                    }
                    onMove={(dir) => moveProduct(p.id, dir)}
                    onUpdate={(patch) => updateProduct(p.id, patch)}
                    onRemove={() => removeProduct(p.id)}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ProductRow({
  product: p,
  categories,
  expanded,
  isFirst,
  isLast,
  setRef,
  onToggle,
  onMove,
  onUpdate,
  onRemove,
}) {
  return (
    <div
      ref={setRef}
      className={`overflow-hidden rounded-2xl border bg-ink-800 shadow-card transition ${
        expanded ? "border-brand/60" : "border-ink-700"
      }`}
    >
      {/* Linha compacta */}
      <div className="flex items-center gap-3 p-3">
        {p.image ? (
          <img
            src={p.image}
            alt=""
            className="h-14 w-14 shrink-0 rounded-xl object-cover"
          />
        ) : (
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-ink-700 text-2xl">
            🍔
          </div>
        )}

        <button onClick={onToggle} className="min-w-0 flex-1 text-left">
          <div className="flex items-center gap-2">
            <span className="truncate font-semibold text-white">
              {p.name || "Sem nome"}
            </span>
            {p.featured && (
              <span className="shrink-0 text-xs text-brand-light">⭐</span>
            )}
          </div>
          <span className="text-sm font-bold text-brand-light">
            {formatPrice(p.price)}
          </span>
        </button>

        {/* Setas de ordem */}
        <div className="flex shrink-0 flex-col gap-1">
          <button
            onClick={() => onMove(-1)}
            disabled={isFirst}
            aria-label="Mover para cima"
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-ink-700 text-white transition hover:bg-ink-600 disabled:opacity-25"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="m18 15-6-6-6 6" />
            </svg>
          </button>
          <button
            onClick={() => onMove(1)}
            disabled={isLast}
            aria-label="Mover para baixo"
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-ink-700 text-white transition hover:bg-ink-600 disabled:opacity-25"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>
        </div>

        <button
          onClick={onToggle}
          className={`shrink-0 rounded-lg px-3 py-2 text-sm font-semibold transition ${
            expanded
              ? "bg-brand text-white"
              : "bg-ink-700 text-zinc-200 hover:bg-ink-600"
          }`}
        >
          {expanded ? "Fechar" : "Editar"}
        </button>
      </div>

      {/* Formulário expandido */}
      {expanded && (
        <div className="space-y-3 border-t border-ink-700 p-4">
          <Field label="Nome do produto">
            <input
              className="input"
              value={p.name}
              onChange={(e) => onUpdate({ name: e.target.value })}
            />
          </Field>

          <Field label="Descrição">
            <textarea
              className="input min-h-[60px] resize-none"
              value={p.description}
              onChange={(e) => onUpdate({ description: e.target.value })}
            />
          </Field>

          <PriceEditor
            price={p.price}
            oldPrice={p.oldPrice}
            onChange={({ price, oldPrice }) => onUpdate({ price, oldPrice })}
          />

          <Field label="Categoria">
            <select
              className="input"
              value={p.category}
              onChange={(e) => onUpdate({ category: e.target.value })}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Link da imagem">
            <input
              className="input"
              value={p.image}
              onChange={(e) => onUpdate({ image: e.target.value })}
              placeholder="https://..."
            />
          </Field>

          <Field label="Ingredientes (o cliente pode remover no pedido)">
            <IngredientsEditor
              value={p.ingredients || []}
              onChange={(next) => onUpdate({ ingredients: next })}
            />
          </Field>

          <div className="flex items-center justify-between pt-1">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-300">
              <input
                type="checkbox"
                checked={p.featured}
                onChange={(e) => onUpdate({ featured: e.target.checked })}
                className="h-4 w-4 accent-brand"
              />
              Destaque (⭐ Top)
            </label>
            <button
              onClick={onRemove}
              className="text-sm font-semibold text-red-400 hover:text-red-300"
            >
              Remover produto
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------- Aba: Categorias ---------------- */
function CategoriesTab({ menu, setMenu }) {
  const categories = menu.categories;

  function setCategories(next) {
    setMenu((m) => ({ ...m, categories: next }));
  }

  function addCategory() {
    setCategories([
      ...categories,
      { id: newId("cat"), name: "Nova categoria", icon: "🍽️" },
    ]);
  }

  function updateCategory(id, patch) {
    setCategories(
      categories.map((c) => (c.id === id ? { ...c, ...patch } : c))
    );
  }

  function removeCategory(id) {
    const used = menu.products.some((p) => p.category === id);
    if (used) {
      alert("Não é possível remover: há produtos nesta categoria.");
      return;
    }
    setCategories(categories.filter((c) => c.id !== id));
  }

  return (
    <div className="space-y-4">
      <button onClick={addCategory} className="btn-ghost w-full">
        + Adicionar categoria
      </button>

      {categories.map((c) => (
        <Card key={c.id}>
          <div className="flex items-end gap-3">
            <div className="w-20">
              <Field label="Ícone">
                <input
                  className="input text-center"
                  value={c.icon}
                  onChange={(e) => updateCategory(c.id, { icon: e.target.value })}
                />
              </Field>
            </div>
            <div className="flex-1">
              <Field label="Nome">
                <input
                  className="input"
                  value={c.name}
                  onChange={(e) => updateCategory(c.id, { name: e.target.value })}
                />
              </Field>
            </div>
            <button
              onClick={() => removeCategory(c.id)}
              className="mb-2 text-sm text-red-400 hover:text-red-300"
            >
              Remover
            </button>
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-300">
            <input
              type="checkbox"
              checked={!!c.upsell}
              onChange={(e) => updateCategory(c.id, { upsell: e.target.checked })}
              className="h-4 w-4 accent-brand"
            />
            Oferecer estes itens como sugestão no carrinho (upsell)
          </label>
        </Card>
      ))}
    </div>
  );
}

/* ---------------- Aba: Adicionais ---------------- */
function AddonsTab({ menu, setMenu }) {
  const addons = menu.addons || [];

  function setAddons(next) {
    setMenu((m) => ({ ...m, addons: next }));
  }

  function addAddon() {
    setAddons([...addons, { id: newId("add"), name: "Novo adicional", price: 0 }]);
  }

  function updateAddon(id, patch) {
    setAddons(addons.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  }

  function removeAddon(id) {
    setAddons(addons.filter((a) => a.id !== id));
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-400">
        Extras pagos (ex: bacon, borda recheada). Marque em quais categorias
        cada adicional aparece — sem nenhuma marcada, aparece em todas.
      </p>
      <button onClick={addAddon} className="btn-ghost w-full">
        + Adicionar adicional
      </button>

      {addons.map((a) => (
        <Card key={a.id}>
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <Field label="Nome">
                <input
                  className="input"
                  value={a.name}
                  onChange={(e) => updateAddon(a.id, { name: e.target.value })}
                />
              </Field>
            </div>
            <div className="w-28">
              <Field label="Preço (R$)">
                <input
                  type="number"
                  step="0.01"
                  className="input"
                  value={a.price}
                  onChange={(e) =>
                    updateAddon(a.id, { price: parseFloat(e.target.value) || 0 })
                  }
                />
              </Field>
            </div>
            <button
              onClick={() => removeAddon(a.id)}
              className="mb-2 text-sm text-red-400 hover:text-red-300"
            >
              Remover
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(menu.categories || []).map((c) => {
              const ativo = a.cats?.includes(c.id);
              return (
                <button
                  key={c.id}
                  onClick={() =>
                    updateAddon(a.id, {
                      cats: ativo
                        ? (a.cats || []).filter((x) => x !== c.id)
                        : [...(a.cats || []), c.id],
                    })
                  }
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    ativo
                      ? "bg-brand text-white"
                      : "bg-ink-700 text-zinc-400 hover:bg-ink-600"
                  }`}
                >
                  {c.icon} {c.name}
                </button>
              );
            })}
          </div>
        </Card>
      ))}
    </div>
  );
}

/* ---------------- Editor de ingredientes (chips) ---------------- */
function IngredientsEditor({ value, onChange }) {
  const [draft, setDraft] = useState("");

  function add() {
    const v = draft.trim();
    if (!v || value.includes(v)) {
      setDraft("");
      return;
    }
    onChange([...value, v]);
    setDraft("");
  }

  function remove(name) {
    onChange(value.filter((n) => n !== name));
  }

  return (
    <div>
      {value.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {value.map((name) => (
            <span
              key={name}
              className="flex items-center gap-1.5 rounded-full bg-ink-700 px-3 py-1.5 text-sm text-white"
            >
              {name}
              <button
                onClick={() => remove(name)}
                className="text-zinc-500 hover:text-red-400"
                aria-label={`Remover ${name}`}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <input
          className="input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder="Ex: Cebola — Enter para adicionar"
        />
        <button onClick={add} className="btn-ghost shrink-0 px-4 py-3">
          Add
        </button>
      </div>
    </div>
  );
}

/* ---------------- Editor de preço com desconto ---------------- */
function PriceEditor({ price, oldPrice, onChange }) {
  const hasDiscount = oldPrice != null && oldPrice > 0 && oldPrice > price;
  // "full" é sempre o preço cheio (sem desconto).
  const [full, setFull] = useState(hasDiscount ? oldPrice : price || 0);
  const [on, setOn] = useState(hasDiscount);
  // Já com desconto salvo abre em "valor" para mostrar o preço exato.
  const [mode, setMode] = useState(hasDiscount ? "value" : "percent");
  const [pct, setPct] = useState(
    hasDiscount ? discountPercent(price, oldPrice) : 10
  );
  const [val, setVal] = useState(hasDiscount ? price : price || 0);

  // Calcula {price, oldPrice} finais a partir do estado atual e avisa o pai.
  function emit(next = {}) {
    const f = round2(next.full ?? full);
    const o = next.on ?? on;
    const m = next.mode ?? mode;
    const p = next.pct ?? pct;
    const v = next.val ?? val;
    if (!o) {
      onChange({ price: f, oldPrice: null });
      return;
    }
    const final =
      m === "percent" ? round2(f * (1 - (Number(p) || 0) / 100)) : round2(v);
    onChange({ price: Math.max(0, final), oldPrice: f });
  }

  const finalPrice =
    !on
      ? round2(full)
      : mode === "percent"
      ? round2(full * (1 - (Number(pct) || 0) / 100))
      : round2(val);
  const finalPct = discountPercent(finalPrice, full);

  return (
    <div className="rounded-xl border border-ink-600 bg-ink-700/30 p-3">
      <Field label="Preço cheio (R$)">
        <input
          type="number"
          step="0.01"
          className="input"
          value={full}
          onChange={(e) => {
            const f = parseFloat(e.target.value) || 0;
            setFull(f);
            emit({ full: f });
          }}
        />
      </Field>

      <label className="mt-2 flex cursor-pointer items-center gap-2 text-sm text-zinc-300">
        <input
          type="checkbox"
          checked={on}
          onChange={(e) => {
            setOn(e.target.checked);
            emit({ on: e.target.checked });
          }}
          className="h-4 w-4 accent-brand"
        />
        Aplicar desconto
      </label>

      {on && (
        <div className="mt-3 space-y-3">
          <div className="flex gap-2">
            {[
              { id: "percent", label: "Por %" },
              { id: "value", label: "Por valor (R$)" },
            ].map((opt) => (
              <button
                key={opt.id}
                onClick={() => {
                  setMode(opt.id);
                  emit({ mode: opt.id });
                }}
                className={`flex-1 rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                  mode === opt.id
                    ? "border-brand bg-brand/10 text-white"
                    : "border-ink-600 bg-ink-700 text-zinc-300"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {mode === "percent" ? (
            <Field label="Desconto (%)">
              <input
                type="number"
                step="1"
                min="0"
                max="100"
                className="input"
                value={pct}
                onChange={(e) => {
                  const p = parseFloat(e.target.value) || 0;
                  setPct(p);
                  emit({ pct: p });
                }}
              />
            </Field>
          ) : (
            <Field label="Preço com desconto (R$)">
              <input
                type="number"
                step="0.01"
                className="input"
                value={val}
                onChange={(e) => {
                  const v = parseFloat(e.target.value) || 0;
                  setVal(v);
                  emit({ val: v });
                }}
              />
            </Field>
          )}

          <div className="flex items-center justify-between rounded-lg bg-ink-800 px-3 py-2 text-sm">
            <span className="text-zinc-400">
              De{" "}
              <span className="text-zinc-500 line-through">
                {formatPrice(full)}
              </span>{" "}
              por{" "}
              <span className="font-bold text-brand-light">
                {formatPrice(finalPrice)}
              </span>
            </span>
            <span className="rounded-full bg-green-500/15 px-2 py-0.5 text-xs font-bold text-green-400">
              -{finalPct}%
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------- Aba: Cores (tema) ---------------- */
function ThemeTab({ menu, setMenu }) {
  const theme = { ...DEFAULT_THEME, ...(menu.theme || {}) };

  function setTheme(patch) {
    setMenu((m) => ({ ...m, theme: { ...theme, ...patch } }));
  }

  const FIELDS = [
    { key: "brand", label: "Destaque (botões, preços)" },
    { key: "brandDark", label: "Destaque escuro (hover)" },
    { key: "brandLight", label: "Destaque claro (preços)" },
    { key: "heading", label: "Títulos (nome, categorias, produtos)" },
    { key: "bg", label: "Fundo da página" },
    { key: "surface", label: "Cartões" },
    { key: "surface2", label: "Superfície secundária (chips, header)" },
    { key: "line", label: "Bordas" },
    { key: "line2", label: "Bordas de inputs" },
    { key: "text", label: "Texto principal" },
  ];

  return (
    <div className="space-y-5">
      <Card title="Temas prontos">
        <p className="text-sm text-zinc-400">
          Clique para aplicar uma paleta de destaque. Você pode ajustar cada cor
          abaixo depois.
        </p>
        <div className="flex flex-wrap gap-2">
          {THEME_PRESETS.map((preset) => (
            <button
              key={preset.name}
              onClick={() => setTheme(preset.colors)}
              className="flex items-center gap-2 rounded-full border border-ink-600 bg-ink-700 px-3 py-2 text-sm font-semibold text-white transition hover:border-ink-500"
            >
              <span
                className="h-4 w-4 rounded-full"
                style={{ backgroundColor: preset.colors.brand }}
              />
              {preset.name}
            </button>
          ))}
        </div>
      </Card>

      <Card title="Todas as cores">
        <div className="grid gap-3 sm:grid-cols-2">
          {FIELDS.map((f) => (
            <div key={f.key}>
              <label className="label">{f.label}</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={theme[f.key]}
                  onChange={(e) => setTheme({ [f.key]: e.target.value })}
                  className="h-11 w-12 shrink-0 cursor-pointer rounded-lg border border-ink-600 bg-ink-800 p-1"
                />
                <input
                  className="input font-mono uppercase"
                  value={theme[f.key]}
                  onChange={(e) => setTheme({ [f.key]: e.target.value })}
                />
              </div>
            </div>
          ))}
        </div>
        <button
          onClick={() => setTheme(DEFAULT_THEME)}
          className="mt-2 text-sm text-zinc-400 hover:text-white"
        >
          Restaurar cores padrão
        </button>
      </Card>

      <p className="text-center text-xs text-zinc-500">
        As cores mudam aqui na hora (pré-visualização). Clique em{" "}
        <strong>Salvar alterações</strong> para aplicar no cardápio do cliente.
      </p>
    </div>
  );
}

/* ---------------- Aba: Pedidos (status, relatório e comanda) ---------------- */
const STATUS_INFO = {
  recebido: { label: "Recebido", cor: "bg-amber-500/15 text-amber-300 border-amber-500/40" },
  aceito: { label: "Aceito", cor: "bg-sky-500/15 text-sky-300 border-sky-500/40" },
  preparando: { label: "Em preparação", cor: "bg-brand/15 text-brand-light border-brand/40" },
  saiu: { label: "Saiu p/ entrega", cor: "bg-violet-500/15 text-violet-300 border-violet-500/40" },
  entregue: { label: "Entregue", cor: "bg-green-500/15 text-green-400 border-green-500/40" },
  cancelado: { label: "Cancelado", cor: "bg-red-500/15 text-red-400 border-red-500/40" },
};
const STATUS_FLUXO = ["recebido", "aceito", "preparando", "saiu", "entregue"];
const STATUS_MSG = {
  aceito: "foi ACEITO e já vai pra produção! ✅",
  preparando: "está EM PREPARAÇÃO! 👨‍🍳",
  saiu: "SAIU PARA ENTREGA! 🛵 Já já chega aí!",
  entregue: "foi entregue! Bom apetite! 😋 Obrigado pela preferência!",
};

const FILTROS = [
  { id: "ativos", label: "🔥 Em andamento", test: (p) => !["entregue", "cancelado"].includes(p.status) },
  { id: "entregues", label: "✅ Entregues", test: (p) => p.status === "entregue" },
  { id: "cancelados", label: "✖ Cancelados", test: (p) => p.status === "cancelado" },
  { id: "todos", label: "Todos", test: () => true },
];

const fmtHora = (iso) =>
  new Date(iso).toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

function PedidosTab({ menu }) {
  const [pedidos, setPedidos] = useState(null);
  const [printing, setPrinting] = useState(null);
  const [filtro, setFiltro] = useState("ativos");
  const [chatAberto, setChatAberto] = useState({});
  const [drafts, setDrafts] = useState({});
  const [som, setSom] = useState(true);
  const [largura, setLargura] = useState("80");
  const somRef = useRef(true);
  const audioRef = useRef(null);
  const vistosRef = useRef(null); // ids já conhecidos; null = primeira carga

  useEffect(() => {
    try {
      const somSalvo = localStorage.getItem("admin_som") !== "0";
      setSom(somSalvo);
      somRef.current = somSalvo;
      const papel = localStorage.getItem("comanda_papel");
      if (papel === "58" || papel === "80") setLargura(papel);
    } catch {}
    // navegadores só liberam áudio depois de um toque na página
    const unlock = () => {
      garantirAudio();
      document.removeEventListener("pointerdown", unlock);
    };
    document.addEventListener("pointerdown", unlock);
    return () => document.removeEventListener("pointerdown", unlock);
  }, []);

  function garantirAudio() {
    try {
      if (!audioRef.current) {
        audioRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      audioRef.current.resume?.();
    } catch {}
  }

  // Campainha: três bipes curtos gerados na hora (sem arquivo de som)
  function tocarAlerta() {
    garantirAudio();
    const ctx = audioRef.current;
    if (!ctx) return;
    [0, 0.28, 0.56].forEach((t) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.001, ctx.currentTime + t);
      gain.gain.exponentialRampToValueAtTime(0.5, ctx.currentTime + t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.24);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + t);
      osc.stop(ctx.currentTime + t + 0.26);
    });
  }

  function toggleSom() {
    const novo = !som;
    setSom(novo);
    somRef.current = novo;
    try {
      localStorage.setItem("admin_som", novo ? "1" : "0");
    } catch {}
    if (novo) tocarAlerta(); // toca como teste, no toque do usuário
  }

  function trocarPapel(p) {
    setLargura(p);
    try {
      localStorage.setItem("comanda_papel", p);
    } catch {}
  }

  async function carregar() {
    try {
      const res = await fetch("/api/pedidos");
      if (!res.ok) return setPedidos([]);
      const lista = await res.json();
      // alerta sonoro quando entra pedido que ainda não conhecíamos
      if (vistosRef.current) {
        const novos = lista.filter((p) => !vistosRef.current.has(p.id));
        if (novos.length > 0 && somRef.current) tocarAlerta();
      }
      vistosRef.current = new Set(lista.map((p) => p.id));
      setPedidos(lista);
    } catch {
      setPedidos((atual) => atual || []);
    }
  }
  useEffect(() => {
    carregar();
    const t = setInterval(() => carregar(), 20000);
    return () => clearInterval(t);
  }, []);

  // Mostra quantos pedidos aguardam ação no título da aba do navegador
  useEffect(() => {
    const n = (pedidos || []).filter((p) => (p.status || "recebido") === "recebido").length;
    document.title = n > 0 ? `(${n}) Pedido${n > 1 ? "s" : ""} aguardando — Admin` : "Admin";
    return () => {
      document.title = "Admin";
    };
  }, [pedidos]);

  async function responder(p) {
    const texto = (drafts[p.id] || "").trim();
    if (!texto) return;
    setPedidos((lista) =>
      lista.map((x) =>
        x.id === p.id
          ? {
              ...x,
              mensagens: [
                ...(x.mensagens || []),
                { de: "loja", texto, em: new Date().toISOString() },
              ],
            }
          : x
      )
    );
    setDrafts((d) => ({ ...d, [p.id]: "" }));
    try {
      await fetch("/api/pedidos/mensagem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: p.id, de: "loja", texto }),
      });
    } catch {}
  }

  async function mudarStatus(p, status) {
    setPedidos((lista) =>
      lista.map((x) => (x.id === p.id ? { ...x, status } : x))
    );
    try {
      await fetch("/api/pedidos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: p.id, status }),
      });
    } catch {}
  }

  function avisarCliente(p) {
    const dig = (p.telefone || "").replace(/\D/g, "");
    if (!dig) return;
    const numero = dig.startsWith("55") ? dig : "55" + dig;
    const st = STATUS_MSG[p.status] || "foi recebido! ✅";
    const texto = `Olá${p.nome ? " " + p.nome.split(" ")[0] : ""}! Seu pedido #${p.id} ${st}`;
    window.open(`https://wa.me/${numero}?text=${encodeURIComponent(texto)}`, "_blank");
  }

  function imprimir(p) {
    setPrinting(p);
    setTimeout(() => {
      window.print();
      setTimeout(() => setPrinting(null), 400);
    }, 120);
  }

  const contagem = (f) => (pedidos || []).filter(f.test).length;
  const visiveis = (pedidos || []).filter(
    FILTROS.find((f) => f.id === filtro).test
  );

  return (
    <div className="space-y-4">
      {/* Filtros por situação */}
      <div className="no-scrollbar -mx-4 overflow-x-auto px-4">
        <div className="flex gap-2">
          {FILTROS.map((f) => {
            const n = contagem(f);
            return (
              <button
                key={f.id}
                onClick={() => setFiltro(f.id)}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
                  filtro === f.id
                    ? "bg-brand text-white"
                    : "bg-ink-700 text-zinc-300 hover:bg-ink-600"
                }`}
              >
                {f.label}
                {n > 0 && (
                  <span className={filtro === f.id ? "ml-1.5 opacity-80" : "ml-1.5 text-zinc-500"}>
                    {n}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Ferramentas: som, papel da impressora, atualizar */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={toggleSom}
            className={`flex h-10 w-10 items-center justify-center rounded-full text-lg transition ${
              som ? "bg-green-500/15" : "bg-ink-700 opacity-60"
            }`}
            title={som ? "Som de pedido novo: ligado" : "Som de pedido novo: desligado"}
          >
            {som ? "🔔" : "🔕"}
          </button>
          <div
            className="flex items-center gap-1 rounded-full bg-ink-700 p-1 text-xs font-semibold"
            title="Largura do papel da sua impressora térmica"
          >
            <span className="pl-2 text-zinc-500">🖨️</span>
            {["58", "80"].map((mm) => (
              <button
                key={mm}
                onClick={() => trocarPapel(mm)}
                className={`rounded-full px-2.5 py-1.5 transition ${
                  largura === mm ? "bg-brand text-white" : "text-zinc-400"
                }`}
              >
                {mm}mm
              </button>
            ))}
          </div>
        </div>
        <button onClick={carregar} className="btn-ghost px-4 py-2 text-sm">
          ↻ Atualizar
        </button>
      </div>

      {pedidos === null && (
        <p className="py-10 text-center text-zinc-500">Carregando...</p>
      )}
      {pedidos !== null && visiveis.length === 0 && (
        <div className="rounded-2xl border border-dashed border-ink-600 px-6 py-12 text-center">
          <p className="text-4xl">📋</p>
          <p className="mt-3 text-zinc-400">
            {pedidos.length === 0
              ? "Nenhum pedido ainda — eles aparecem aqui sozinhos (e tocam o sino 🔔)."
              : "Nenhum pedido nessa situação."}
          </p>
        </div>
      )}

      <div className="grid items-start gap-4 lg:grid-cols-2">
      {visiveis.map((p) => {
        const st = STATUS_INFO[p.status || "recebido"];
        const idxFluxo = STATUS_FLUXO.indexOf(p.status || "recebido");
        const proximo = idxFluxo >= 0 ? STATUS_FLUXO[idxFluxo + 1] : null;
        const novo = (p.status || "recebido") === "recebido";
        const nMsgs = (p.mensagens || []).filter((m) => !m.sys).length;
        const aberto = !!chatAberto[p.id];
        return (
          <div
            key={p.id + p.criadoEm}
            className={`rounded-2xl border bg-ink-800 p-4 shadow-card ${
              novo ? "border-amber-400/60 ring-1 ring-amber-400/30" : "border-ink-700"
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="rounded-lg bg-brand/15 px-2.5 py-1 font-mono text-sm font-bold text-brand-light">
                  #{p.id}
                </span>
                <span className="text-sm text-zinc-400">{fmtHora(p.criadoEm)}</span>
              </div>
              <span className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${st.cor}`}>
                {novo ? "🆕 " : ""}
                {st.label}
              </span>
            </div>

            <div className="mt-3 text-sm">
              <p>
                <b className="text-white">{p.nome || "Cliente"}</b>
                {p.telefone && <span className="text-zinc-400"> • 📱 {p.telefone}</span>}
              </p>
              {p.endereco && <p className="mt-0.5 text-zinc-400">📍 {p.endereco}</p>}
            </div>

            <div className="mt-2 space-y-1">
              {p.items.map((i, idx) => (
                <div key={idx} className="text-sm text-zinc-300">
                  <span className="font-semibold text-white">
                    {i.qtd}x {i.nome}
                  </span>{" "}
                  <span className="text-brand-light">{formatPrice(i.total)}</span>
                  {i.sabores?.length > 0 && (
                    <span className="block pl-4 text-xs text-brand-light">
                      🍕 {i.sabores.length > 1 ? i.sabores.map((sb) => `½ ${sb}`).join(" + ") : i.sabores[0]}
                    </span>
                  )}
                  {i.adicionais?.length > 0 && (
                    <span className="block pl-4 text-xs text-zinc-500">
                      + {i.adicionais.join(", ")}
                    </span>
                  )}
                  {i.sem?.length > 0 && (
                    <span className="block pl-4 text-xs text-zinc-500">
                      sem: {i.sem.join(", ")}
                    </span>
                  )}
                </div>
              ))}
            </div>

            {p.obs && (
              <p className="mt-2 rounded-lg bg-amber-500/10 px-3 py-1.5 text-sm text-amber-300">
                📝 {p.obs}
              </p>
            )}

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-ink-700 pt-3">
              <span className="text-sm text-zinc-400">
                {p.pagamento || "—"}
                {p.troco && ` (troco p/ ${p.troco})`}
                {p.entrega > 0 && ` • entrega ${formatPrice(p.entrega)}`}
              </span>
              <span className="font-display text-lg font-bold text-brand-light">
                {formatPrice(p.total)}
              </span>
            </div>

            {/* Ação principal: avançar o status */}
            {proximo && (
              <button
                onClick={() => mudarStatus(p, proximo)}
                className="btn-primary mt-3 w-full py-2.5 text-sm"
              >
                ➜ Marcar como {STATUS_INFO[proximo].label}
              </button>
            )}

            {/* Utilidades */}
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => setChatAberto((c) => ({ ...c, [p.id]: !aberto }))}
                className={`rounded-full px-3.5 py-2 text-sm font-semibold transition ${
                  aberto ? "bg-ink-600 text-white" : "bg-ink-700 text-zinc-300 hover:bg-ink-600"
                }`}
              >
                💬 Chat{nMsgs > 0 ? ` (${nMsgs})` : ""}
              </button>
              <button
                onClick={() => imprimir(p)}
                className="rounded-full bg-ink-700 px-3.5 py-2 text-sm font-semibold text-zinc-300 transition hover:bg-ink-600"
              >
                🖨️ Comanda
              </button>
              {p.telefone && p.status !== "recebido" && p.status !== "cancelado" && (
                <button
                  onClick={() => avisarCliente(p)}
                  className="rounded-full bg-green-500/15 px-3.5 py-2 text-sm font-bold text-green-400 transition hover:bg-green-500/25"
                >
                  📣 Avisar
                </button>
              )}
              {p.status !== "entregue" && p.status !== "cancelado" && (
                <button
                  onClick={() => mudarStatus(p, "cancelado")}
                  className="ml-auto px-2 py-2 text-sm font-semibold text-red-400/80 transition hover:text-red-400"
                >
                  Cancelar
                </button>
              )}
            </div>

            {/* Chat com o cliente (recolhido por padrão) */}
            {aberto && (
              <div className="mt-3 rounded-xl border border-ink-700 bg-ink-900/40 p-3">
                <div className="max-h-44 space-y-1.5 overflow-y-auto">
                  {(p.mensagens || []).length === 0 && (
                    <p className="text-center text-xs text-zinc-600">
                      Sem mensagens ainda.
                    </p>
                  )}
                  {(p.mensagens || []).map((m, idx) =>
                    m.sys ? (
                      <p key={idx} className="text-center text-[11px] text-zinc-600">
                        — {m.texto} —
                      </p>
                    ) : (
                      <div
                        key={idx}
                        className={`max-w-[80%] rounded-xl px-3 py-1.5 text-sm ${
                          m.de === "loja"
                            ? "ml-auto bg-brand/20 text-white"
                            : "bg-ink-700 text-zinc-200"
                        }`}
                      >
                        {m.texto}
                      </div>
                    )
                  )}
                </div>
                <div className="mt-2 flex gap-2">
                  <input
                    className="input py-2 text-sm"
                    value={drafts[p.id] || ""}
                    onChange={(e) => setDrafts((d) => ({ ...d, [p.id]: e.target.value }))}
                    onKeyDown={(e) => e.key === "Enter" && responder(p)}
                    placeholder="Responder cliente..."
                  />
                  <button onClick={() => responder(p)} className="btn-ghost shrink-0 px-4 py-2 text-sm">
                    ➤
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
      </div>

      {printing &&
        createPortal(
          <Comanda pedido={printing} restaurante={menu.restaurant} largura={largura} />,
          document.body
        )}
    </div>
  );
}

/* ---------------- Aba: Relatórios ---------------- */
function RelatoriosTab() {
  const [pedidos, setPedidos] = useState(null);

  async function carregar() {
    try {
      const res = await fetch("/api/pedidos");
      setPedidos(res.ok ? await res.json() : []);
    } catch {
      setPedidos([]);
    }
  }
  useEffect(() => {
    carregar();
  }, []);

  if (pedidos === null) {
    return <p className="py-10 text-center text-zinc-500">Carregando...</p>;
  }
  if (pedidos.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-ink-600 px-6 py-12 text-center">
        <p className="text-4xl">📊</p>
        <p className="mt-3 text-zinc-400">
          Os relatórios aparecem aqui depois do primeiro pedido.
        </p>
      </div>
    );
  }

  const agora = Date.now();
  const validos = pedidos.filter((p) => p.status !== "cancelado");
  const doPeriodo = (dias) =>
    validos.filter((p) => agora - new Date(p.criadoEm).getTime() < dias * 864e5);
  const resumo = (lista) => ({
    n: lista.length,
    fat: lista.reduce((soma, p) => soma + (p.total || 0), 0),
  });

  const topProdutos = Object.entries(
    doPeriodo(30)
      .flatMap((p) => p.items)
      .reduce((acc, i) => {
        acc[i.nome] = (acc[i.nome] || 0) + i.qtd;
        return acc;
      }, {})
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const maxQtd = topProdutos[0]?.[1] || 1;

  // Faturamento dos últimos 7 dias, dia a dia
  const dias = [...Array(7)].map((_, i) => {
    const d = new Date(agora - (6 - i) * 864e5);
    const chave = d.toLocaleDateString("pt-BR", {
      timeZone: "America/Sao_Paulo",
      day: "2-digit",
      month: "2-digit",
    });
    const doDia = validos.filter(
      (p) =>
        new Date(p.criadoEm).toLocaleDateString("pt-BR", {
          timeZone: "America/Sao_Paulo",
          day: "2-digit",
          month: "2-digit",
        }) === chave
    );
    return { chave, ...resumo(doDia) };
  });
  const maxFat = Math.max(...dias.map((d) => d.fat), 1);

  // Clientes agrupados pelo WhatsApp (quem mais pede primeiro)
  const clientes = Object.values(
    validos.reduce((acc, p) => {
      const tel = (p.telefone || "").replace(/\D/g, "");
      const chave = tel || (p.nome || "?").toLowerCase();
      if (!acc[chave]) {
        acc[chave] = { nome: p.nome || "Cliente", tel, n: 0, total: 0, ultimo: p.criadoEm };
      }
      acc[chave].n += 1;
      acc[chave].total += p.total || 0;
      if (p.criadoEm > acc[chave].ultimo) {
        acc[chave].ultimo = p.criadoEm;
        if (p.nome) acc[chave].nome = p.nome;
      }
      return acc;
    }, {})
  )
    .sort((a, b) => b.n - a.n || b.total - a.total)
    .slice(0, 10);

  const porStatus = Object.entries(STATUS_INFO)
    .map(([id, info]) => [info, pedidos.filter((p) => (p.status || "recebido") === id).length])
    .filter(([, n]) => n > 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        {[
          ["Hoje", resumo(doPeriodo(1))],
          ["7 dias", resumo(doPeriodo(7))],
          ["30 dias", resumo(doPeriodo(30))],
        ].map(([titulo, r]) => (
          <div
            key={titulo}
            className="rounded-2xl border border-ink-700 bg-ink-800 p-3 text-center"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              {titulo}
            </p>
            <p className="mt-1 font-display text-xl font-bold text-white">
              {r.n} <span className="text-sm font-normal text-zinc-400">pedidos</span>
            </p>
            <p className="text-sm font-bold text-brand-light">{formatPrice(r.fat)}</p>
            <p className="text-[11px] text-zinc-500">
              ticket {formatPrice(r.n ? r.fat / r.n : 0)}
            </p>
          </div>
        ))}
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-2">
      <Card title="📅 Últimos 7 dias">
        <div className="space-y-2">
          {dias.map((d) => (
            <div key={d.chave} className="flex items-center gap-3 text-sm">
              <span className="w-12 shrink-0 text-zinc-400">{d.chave}</span>
              <div className="h-3 flex-1 overflow-hidden rounded-full bg-ink-700">
                <div
                  className="h-full rounded-full bg-brand"
                  style={{ width: `${Math.round((d.fat / maxFat) * 100)}%` }}
                />
              </div>
              <span className="w-24 shrink-0 text-right font-semibold text-white">
                {formatPrice(d.fat)}
              </span>
              <span className="w-10 shrink-0 text-right text-xs text-zinc-500">
                {d.n} ped.
              </span>
            </div>
          ))}
        </div>
      </Card>

      {topProdutos.length > 0 && (
        <Card title="🏆 Mais vendidos (30 dias)">
          <div className="space-y-2">
            {topProdutos.map(([nome, qtd]) => (
              <div key={nome} className="flex items-center gap-3 text-sm">
                <span className="min-w-0 flex-1 truncate text-zinc-200">{nome}</span>
                <div className="h-3 w-32 shrink-0 overflow-hidden rounded-full bg-ink-700">
                  <div
                    className="h-full rounded-full bg-brand"
                    style={{ width: `${Math.round((qtd / maxQtd) * 100)}%` }}
                  />
                </div>
                <span className="w-10 shrink-0 text-right font-bold text-white">×{qtd}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {clientes.length > 0 && (
        <Card title="👥 Seus clientes">
          <div className="space-y-1.5">
            {clientes.map((c) => (
              <div
                key={c.tel || c.nome}
                className="flex items-center gap-3 rounded-xl bg-ink-900/40 px-3 py-2 text-sm"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-white">{c.nome}</p>
                  {c.tel && (
                    <a
                      href={`https://wa.me/${c.tel.startsWith("55") ? c.tel : "55" + c.tel}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-zinc-400 hover:text-green-400"
                    >
                      📱 {c.tel}
                    </a>
                  )}
                </div>
                <span className="shrink-0 rounded-full bg-brand/15 px-2.5 py-1 text-xs font-bold text-brand-light">
                  {c.n} pedido{c.n > 1 ? "s" : ""}
                </span>
                <span className="w-20 shrink-0 text-right font-bold text-white">
                  {formatPrice(c.total)}
                </span>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-zinc-600">
            Toque no número pra chamar o cliente no WhatsApp. 😉
          </p>
        </Card>
      )}

      {porStatus.length > 0 && (
        <Card title="📦 Pedidos por situação">
          <div className="flex flex-wrap gap-2">
            {porStatus.map(([info, n]) => (
              <span
                key={info.label}
                className={`rounded-full border px-3 py-1.5 text-sm font-semibold ${info.cor}`}
              >
                {info.label}: {n}
              </span>
            ))}
          </div>
        </Card>
      )}
      </div>
    </div>
  );
}

// Comanda térmica — só aparece na impressão (CSS .comanda-print em globals)
function Comanda({ pedido, restaurante, largura = "80" }) {
  const hora = new Date(pedido.criadoEm).toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
  const linha = largura === "58" ? "------------------------" : "--------------------------------";
  return (
    <div className={`comanda-print${largura === "58" ? " c58" : ""}`}>
      <p style={{ textAlign: "center", fontWeight: 700, fontSize: 16 }}>
        {restaurante.name}
      </p>
      <p style={{ textAlign: "center" }}>
        PEDIDO #{pedido.id} — {hora}
      </p>
      <p>{linha}</p>
      <p>CLIENTE: {pedido.nome}</p>
      {pedido.telefone && <p>FONE: {pedido.telefone}</p>}
      {pedido.endereco && <p>END: {pedido.endereco}</p>}
      {pedido.referencia && <p>REF: {pedido.referencia}</p>}
      <p>{linha}</p>
      {pedido.items.map((i, idx) => (
        <div key={idx}>
          <p style={{ fontWeight: 700 }}>
            {i.qtd}x {i.nome} ... {formatPrice(i.total)}
          </p>
          {i.sabores?.length > 0 && (
            <p>&nbsp;&nbsp;SABOR: {i.sabores.join(" / ")}</p>
          )}
          {i.adicionais?.length > 0 && <p>&nbsp;&nbsp;+ {i.adicionais.join(", ")}</p>}
          {i.sem?.length > 0 && <p>&nbsp;&nbsp;SEM: {i.sem.join(", ")}</p>}
        </div>
      ))}
      <p>{linha}</p>
      {pedido.entrega > 0 && <p>ENTREGA: {formatPrice(pedido.entrega)}</p>}
      <p style={{ fontWeight: 700, fontSize: 15 }}>
        TOTAL: {formatPrice(pedido.total)}
      </p>
      <p>PAGAMENTO: {pedido.pagamento || "-"}</p>
      {pedido.troco && <p>TROCO PARA: {pedido.troco}</p>}
      {pedido.obs && <p>OBS: {pedido.obs}</p>}
      <p>{linha}</p>
      <p style={{ textAlign: "center" }}>Obrigado pela preferência! :)</p>
    </div>
  );
}

/* ---------------- UI helpers ---------------- */
function Card({ title, children }) {
  return (
    <div className="space-y-3 rounded-2xl border border-ink-700 bg-ink-800 p-4 shadow-card">
      {title && (
        <h3 className="font-display text-lg font-bold text-white">{title}</h3>
      )}
      {children}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
    </div>
  );
}
