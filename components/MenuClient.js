"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useCart } from "@/components/CartContext";
import { formatPrice, discountPercent } from "@/lib/format";
import ProductModal from "@/components/ProductModal";
import CartSheet from "@/components/CartSheet";
import { useAberto, BannerFechado, TabelaHorarios } from "@/components/Horarios";

export default function MenuClient({ menu }) {
  const { restaurant, categories, products, addons } = menu;
  const { count, total, addItem } = useCart();

  const [activeCat, setActiveCat] = useState(categories[0]?.id);
  const [selected, setSelected] = useState(null); // produto aberto no modal
  const [cartOpen, setCartOpen] = useState(false);
  const sectionRefs = useRef({});
  const aberto = useAberto(restaurant.hours);

  // Rola até a seção da categoria ao clicar no chip
  function goToCategory(id) {
    setActiveCat(id);
    const el = sectionRefs.current[id];
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 130;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  }

  const productsByCat = (catId) =>
    products.filter((p) => p.category === catId);

  return (
    <main className="min-h-dvh pb-32">
      {/* Cabeçalho */}
      <header className="sticky top-0 z-30 border-b border-ink-700 bg-ink-900/90 backdrop-blur-lg">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
          <Link
            href="/"
            className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl bg-brand text-2xl shadow-glow"
          >
            {/^https?:\/\//.test(restaurant.logo) ? (
              <img
                src={restaurant.logo}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              restaurant.logo
            )}
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-display text-lg font-bold leading-tight text-heading">
              {restaurant.name}
            </h1>
            <p className="flex items-center gap-1.5 text-xs text-zinc-400">
              <span className={`h-1.5 w-1.5 rounded-full ${aberto ? "bg-green-400" : "bg-red-500"}`} />
              {aberto ? "Aberto • Entrega rápida" : "Fechado no momento"}
            </p>
          </div>
          <Link
            href="/pedidos"
            className="shrink-0 rounded-full bg-ink-700 px-3 py-2 text-xs font-bold text-zinc-200 transition hover:bg-ink-600"
          >
            📦 Meus pedidos
          </Link>
        </div>

        {/* Categorias com scroll horizontal */}
        <div className="no-scrollbar overflow-x-auto">
          <div className="mx-auto flex max-w-2xl gap-2 px-4 pb-3">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => goToCategory(cat.id)}
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                  activeCat === cat.id
                    ? "bg-brand text-white shadow-glow"
                    : "bg-ink-700 text-zinc-300 hover:bg-ink-600"
                }`}
              >
                <span>{cat.icon}</span>
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </header>

      {!aberto && <BannerFechado hours={restaurant.hours} />}

      {/* Listagem de produtos por categoria */}
      <div className="mx-auto max-w-2xl px-4">
        {categories.map((cat) => {
          const catProducts = productsByCat(cat.id);
          if (catProducts.length === 0) return null;
          return (
            <section
              key={cat.id}
              ref={(el) => (sectionRefs.current[cat.id] = el)}
              className="pt-7"
            >
              <h2 className="mb-4 flex items-center gap-2 font-display text-2xl font-extrabold text-heading">
                <span>{cat.icon}</span>
                {cat.name}
              </h2>
              <div className="flex flex-col gap-3">
                {catProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onOpen={() => setSelected(product)}
                    onQuickAdd={() => addItem(product)}
                  />
                ))}
              </div>
            </section>
          );
        })}

        <TabelaHorarios hours={restaurant.hours} />

        <p className="mt-10 text-center text-xs text-zinc-600">
          {restaurant.name} • Cardápio digital
        </p>
      </div>

      {/* Barra fixa do carrinho */}
      {count > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-30 animate-slide-up px-4 pb-4">
          <button
            onClick={() => setCartOpen(true)}
            className="mx-auto flex w-full max-w-2xl items-center justify-between rounded-2xl bg-brand px-5 py-4 shadow-glow transition active:scale-[0.98]"
          >
            <span className="flex items-center gap-3">
              <span className="flex h-7 min-w-7 items-center justify-center rounded-full bg-white px-2 text-sm font-bold text-brand">
                {count}
              </span>
              <span className="font-display font-bold text-white">
                Ver pedido
              </span>
            </span>
            <span className="font-display text-lg font-extrabold text-white">
              {formatPrice(total)}
            </span>
          </button>
        </div>
      )}

      {/* Modal de produto */}
      {selected && (
        <ProductModal
          product={selected}
          addons={addons}
          onClose={() => setSelected(null)}
        />
      )}

      {/* Carrinho */}
      {cartOpen && (
        <CartSheet
          restaurant={restaurant}
          categories={categories}
          products={products}
          onClose={() => setCartOpen(false)}
        />
      )}
    </main>
  );
}

function ProductCard({ product, onOpen, onQuickAdd }) {
  return (
    <article
      onClick={onOpen}
      className="group flex cursor-pointer gap-3 rounded-2xl border border-ink-700 bg-ink-800 p-3 shadow-card transition-all hover:border-ink-500 active:scale-[0.99]"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="font-display text-base font-bold text-heading">
            {product.name}
          </h3>
          {product.featured && (
            <span className="rounded-full bg-brand/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-light">
              ⭐ Top
            </span>
          )}
        </div>
        <p className="mt-1 line-clamp-2 text-sm text-zinc-400">
          {product.description}
        </p>
        {discountPercent(product.price, product.oldPrice) > 0 ? (
          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-sm text-zinc-500 line-through">
              {formatPrice(product.oldPrice)}
            </span>
            <span className="font-display text-lg font-extrabold text-brand-light">
              {formatPrice(product.price)}
            </span>
            <span className="rounded-full bg-green-500/15 px-2 py-0.5 text-[10px] font-bold text-green-400">
              -{discountPercent(product.price, product.oldPrice)}%
            </span>
          </div>
        ) : (
          <p className="mt-2 font-display text-lg font-extrabold text-brand-light">
            {formatPrice(product.price)}
          </p>
        )}
      </div>

      <div className="relative shrink-0">
        <img
          src={product.image}
          alt={product.name}
          className="h-28 w-28 rounded-xl object-cover"
        />
        <button
          onClick={(e) => {
            e.stopPropagation();
            onQuickAdd();
          }}
          aria-label="Adicionar"
          className="absolute -bottom-2 -right-2 flex h-10 w-10 items-center justify-center rounded-full bg-brand text-white shadow-glow transition hover:bg-brand-dark active:animate-pop"
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
      </div>
    </article>
  );
}
