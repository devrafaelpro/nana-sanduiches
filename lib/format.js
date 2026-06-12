// Formata um número como moeda em Real brasileiro.
export function formatPrice(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value) || 0);
}

// Retorna o percentual de desconto (0 se não houver). oldPrice é o preço "de".
export function discountPercent(price, oldPrice) {
  const p = Number(price) || 0;
  const o = Number(oldPrice) || 0;
  if (o <= p || o <= 0) return 0;
  return Math.round((1 - p / o) * 100);
}

// Máscara de telefone BR enquanto digita: (11) 98765-4321 (máx. 11 dígitos)
export function maskFone(v) {
  const d = (v || "").replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}
