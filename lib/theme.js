// Tema de cores editável por cliente. As cores ficam salvas no menu.json e são
// aplicadas em tempo real via variáveis CSS — sem rebuild. Cada cor vira um
// par de canais "r g b" para que o Tailwind consiga aplicar transparências
// (ex: bg-brand/10) usando rgb(var(--brand) / <alpha>).

export const DEFAULT_THEME = {
  brand: "#ff5a1f", // cor de destaque (botões, preços)
  brandDark: "#e6450f", // destaque no hover
  brandLight: "#ff7a45", // destaque claro (preços/realces)
  bg: "#0a0a0b", // fundo da página
  surface: "#121214", // cartões / superfícies
  surface2: "#1a1a1d", // superfícies secundárias (chips, header)
  line: "#242428", // bordas
  line2: "#33333a", // bordas de inputs
  text: "#f5f5f5", // cor do texto principal (corpo)
  heading: "#ffffff", // cor dos títulos (nome, categorias, produtos)
};

// Mapa: chave do tema -> variável CSS usada pelo Tailwind.
const THEME_VARS = {
  brand: "--brand",
  brandDark: "--brand-dark",
  brandLight: "--brand-light",
  bg: "--ink-900",
  surface: "--ink-800",
  surface2: "--ink-700",
  line: "--ink-600",
  line2: "--ink-500",
  text: "--text",
  heading: "--heading",
};

// Converte "#ff5a1f" em "255 90 31" (canais separados para usar com alpha).
export function hexToChannels(hex) {
  let h = String(hex || "").trim().replace(/^#/, "");
  if (h.length === 3) {
    h = h.split("").map((c) => c + c).join("");
  }
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return null;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `${r} ${g} ${b}`;
}

// Gera o CSS ":root{ --brand: r g b; ... }" a partir do tema do cliente.
export function themeToCss(theme = {}) {
  const merged = { ...DEFAULT_THEME, ...theme };
  const decls = Object.entries(THEME_VARS)
    .map(([key, cssVar]) => {
      const ch = hexToChannels(merged[key]);
      return ch ? `${cssVar}:${ch};` : "";
    })
    .filter(Boolean)
    .join("");
  return `:root{${decls}}`;
}

// Presets prontos para o cliente trocar o visual em um clique.
export const THEME_PRESETS = [
  { name: "Laranja", colors: { brand: "#ff5a1f", brandDark: "#e6450f", brandLight: "#ff7a45" } },
  { name: "Vermelho", colors: { brand: "#ef4444", brandDark: "#dc2626", brandLight: "#f87171" } },
  { name: "Verde", colors: { brand: "#22c55e", brandDark: "#16a34a", brandLight: "#4ade80" } },
  { name: "Amarelo", colors: { brand: "#f59e0b", brandDark: "#d97706", brandLight: "#fbbf24" } },
  { name: "Roxo", colors: { brand: "#a855f7", brandDark: "#9333ea", brandLight: "#c084fc" } },
  { name: "Azul", colors: { brand: "#3b82f6", brandDark: "#2563eb", brandLight: "#60a5fa" } },
  { name: "Rosa", colors: { brand: "#ec4899", brandDark: "#db2777", brandLight: "#f472b6" } },
];
