"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

const CartContext = createContext(null);

const STORAGE_KEY = "cardapio_cart";

// Gera uma chave única para um item levando em conta os adicionais escolhidos e
// os ingredientes removidos, para que o mesmo lanche com personalizações
// diferentes seja tratado como linhas separadas no carrinho.
function lineKey(productId, addonIds, removed, sabores = []) {
  return `${productId}::add:${[...addonIds].sort().join(",")}::rem:${[...removed]
    .sort()
    .join(",")}::sab:${[...sabores].sort().join(",")}`;
}

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [loaded, setLoaded] = useState(false);

  // Carrega do localStorage no mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {}
    setLoaded(true);
  }, []);

  // Persiste sempre que o carrinho muda
  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {}
  }, [items, loaded]);

  function addItem(
    product,
    { addons = [], removedIngredients = [], quantity = 1, sabores = [] } = {}
  ) {
    const addonIds = addons.map((a) => a.id);
    const nomesSabores = sabores.map((sb) => sb.nome);
    // Meio a meio: cobra o valor do sabor mais caro
    const extraSabor = sabores.reduce((m, sb) => Math.max(m, sb.extra || 0), 0);
    const key = lineKey(product.id, addonIds, removedIngredients, nomesSabores);
    setItems((prev) => {
      const existing = prev.find((i) => i.key === key);
      if (existing) {
        return prev.map((i) =>
          i.key === key ? { ...i, quantity: i.quantity + quantity } : i
        );
      }
      return [
        ...prev,
        {
          key,
          productId: product.id,
          name: product.name,
          image: product.image,
          basePrice: product.price + extraSabor,
          addons,
          removedIngredients,
          sabores: nomesSabores,
          quantity,
        },
      ];
    });
  }

  function updateQuantity(key, quantity) {
    setItems((prev) =>
      prev
        .map((i) => (i.key === key ? { ...i, quantity } : i))
        .filter((i) => i.quantity > 0)
    );
  }

  function removeItem(key) {
    setItems((prev) => prev.filter((i) => i.key !== key));
  }

  function clearCart() {
    setItems([]);
  }

  const lineTotal = (item) =>
    (item.basePrice + item.addons.reduce((s, a) => s + a.price, 0)) *
    item.quantity;

  const total = useMemo(
    () => items.reduce((sum, i) => sum + lineTotal(i), 0),
    [items]
  );

  const count = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity, 0),
    [items]
  );

  const value = {
    items,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    total,
    count,
    lineTotal,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart deve ser usado dentro de CartProvider");
  return ctx;
}
