"use client";

import { useEffect, useState } from "react";
import { useCart } from "@/components/CartContext";
import { formatPrice, discountPercent } from "@/lib/format";

export default function ProductModal({ product, addons, onClose }) {
  const { addItem } = useCart();
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [removedIngredients, setRemovedIngredients] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const ingredients = product.ingredients || [];

  // Bloqueia o scroll do fundo enquanto o modal está aberto
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  function toggleAddon(addon) {
    setSelectedAddons((prev) =>
      prev.find((a) => a.id === addon.id)
        ? prev.filter((a) => a.id !== addon.id)
        : [...prev, addon]
    );
  }

  // Marca/desmarca um ingrediente como "removido" (ex: sem cebola).
  function toggleIngredient(name) {
    setRemovedIngredients((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  }

  const addonsTotal = selectedAddons.reduce((s, a) => s + a.price, 0);
  const unitPrice = product.price + addonsTotal;
  const total = unitPrice * quantity;

  function handleAdd() {
    addItem(product, { addons: selectedAddons, removedIngredients, quantity });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 animate-fade-in bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Conteúdo */}
      <div className="relative z-10 flex max-h-[92dvh] w-full max-w-lg animate-slide-up flex-col overflow-hidden rounded-t-3xl bg-ink-800 sm:animate-scale-in sm:rounded-3xl">
        {/* Imagem topo */}
        <div className="relative h-56 shrink-0">
          <img
            src={product.image}
            alt={product.name}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink-800 to-transparent" />
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur transition hover:bg-black/70"
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
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Corpo rolável */}
        <div className="flex-1 overflow-y-auto px-5 pb-4">
          <h2 className="font-display text-2xl font-extrabold text-heading">
            {product.name}
          </h2>
          <p className="mt-2 text-zinc-400">{product.description}</p>
          {discountPercent(product.price, product.oldPrice) > 0 ? (
            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="text-base text-zinc-500 line-through">
                {formatPrice(product.oldPrice)}
              </span>
              <span className="font-display text-2xl font-extrabold text-brand-light">
                {formatPrice(product.price)}
              </span>
              <span className="rounded-full bg-green-500/15 px-2.5 py-1 text-xs font-bold text-green-400">
                -{discountPercent(product.price, product.oldPrice)}% OFF
              </span>
            </div>
          ) : (
            <p className="mt-3 font-display text-2xl font-extrabold text-brand-light">
              {formatPrice(product.price)}
            </p>
          )}

          {/* Ingredientes (removíveis) */}
          {ingredients.length > 0 && (
            <div className="mt-6">
              <h3 className="mb-1 font-display text-lg font-bold text-white">
                Ingredientes
              </h3>
              <p className="mb-3 text-sm text-zinc-500">
                Toque para remover o que não quiser
              </p>
              <div className="flex flex-wrap gap-2">
                {ingredients.map((name) => {
                  const removed = removedIngredients.includes(name);
                  return (
                    <button
                      key={name}
                      onClick={() => toggleIngredient(name)}
                      className={`flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium transition ${
                        removed
                          ? "border-ink-600 bg-ink-700/50 text-zinc-500 line-through"
                          : "border-brand/40 bg-brand/10 text-white"
                      }`}
                    >
                      {removed ? (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                          <path d="M5 12h14" />
                        </svg>
                      ) : (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 6 9 17l-5-5" />
                        </svg>
                      )}
                      {name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Adicionais */}
          {addons?.length > 0 && (
            <div className="mt-6">
              <h3 className="mb-3 font-display text-lg font-bold text-white">
                Adicionais
                <span className="ml-2 text-sm font-normal text-zinc-500">
                  opcional
                </span>
              </h3>
              <div className="flex flex-col gap-2">
                {addons.map((addon) => {
                  const active = selectedAddons.find((a) => a.id === addon.id);
                  return (
                    <button
                      key={addon.id}
                      onClick={() => toggleAddon(addon)}
                      className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left transition ${
                        active
                          ? "border-brand bg-brand/10"
                          : "border-ink-600 bg-ink-700 hover:border-ink-500"
                      }`}
                    >
                      <span className="font-medium text-white">
                        {addon.name}
                      </span>
                      <span className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-brand-light">
                          + {formatPrice(addon.price)}
                        </span>
                        <span
                          className={`flex h-6 w-6 items-center justify-center rounded-full border-2 transition ${
                            active
                              ? "border-brand bg-brand text-white"
                              : "border-ink-500"
                          }`}
                        >
                          {active && (
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="3"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M20 6 9 17l-5-5" />
                            </svg>
                          )}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quantidade */}
          <div className="mt-6 flex items-center justify-between">
            <span className="font-display text-lg font-bold text-white">
              Quantidade
            </span>
            <div className="flex items-center gap-4 rounded-full bg-ink-700 p-1.5">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-ink-600 text-xl font-bold text-white transition hover:bg-ink-500 active:scale-90"
              >
                −
              </button>
              <span className="w-6 text-center font-display text-xl font-bold text-white">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity((q) => q + 1)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-xl font-bold text-white transition hover:bg-brand-dark active:scale-90"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Botão fixo */}
        <div className="shrink-0 border-t border-ink-700 bg-ink-800 p-4">
          <button onClick={handleAdd} className="btn-primary w-full py-4 text-lg">
            Adicionar
            <span className="opacity-80">•</span>
            {formatPrice(total)}
          </button>
        </div>
      </div>
    </div>
  );
}
