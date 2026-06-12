import { promises as fs } from "fs";
import path from "path";

const DATA_PATH = path.join(process.cwd(), "data", "menu.json");

// Suporte a KV (Upstash Redis / Vercel KV). Em produção no Vercel o sistema
// de arquivos é somente leitura, então o admin precisa de um storage externo.
// Se as variáveis de ambiente existirem, usamos o KV; senão, caímos no arquivo
// local (ótimo para desenvolvimento). Funciona com a integração do Vercel
// (KV_REST_API_*) ou direto do Upstash (UPSTASH_REDIS_REST_*).
// Procura uma variável de ambiente cujo nome termine com algum dos sufixos.
// Assim funciona com QUALQUER prefixo que o Vercel/Upstash gerar (KV_, o nome
// do banco, etc), sem você precisar ajustar nada por causa do prefixo.
function findEnv(suffixes, exclude = []) {
  for (const [key, value] of Object.entries(process.env)) {
    if (!value) continue;
    if (exclude.some((e) => key.includes(e))) continue;
    if (suffixes.some((s) => key.endsWith(s))) return value;
  }
  return undefined;
}

const KV_URL =
  process.env.KV_REST_API_URL ||
  process.env.UPSTASH_REDIS_REST_URL ||
  findEnv(["_REST_API_URL", "_REST_URL"]);
// Exclui o token "READ_ONLY" — o admin precisa de permissão de escrita.
const KV_TOKEN =
  process.env.KV_REST_API_TOKEN ||
  process.env.UPSTASH_REDIS_REST_TOKEN ||
  findEnv(["_REST_API_TOKEN", "_REST_TOKEN"], ["READ_ONLY"]);
// CLIENT_ID separa o cardápio de cada cliente dentro do MESMO banco Redis.
// Assim um único banco grátis atende vários restaurantes — basta cada deploy
// usar um CLIENT_ID diferente (ex: "burguer-house", "lanches-do-joao").
const CLIENT_ID = process.env.CLIENT_ID || "default";
const KV_KEY = `menu:${CLIENT_ID}`;
const useKV = Boolean(KV_URL && KV_TOKEN);

async function readFileMenu() {
  const raw = await fs.readFile(DATA_PATH, "utf-8");
  return JSON.parse(raw);
}

async function kvGet(key = KV_KEY) {
  const res = await fetch(`${KV_URL}/get/${key}`, {
    headers: { Authorization: `Bearer ${KV_TOKEN}` },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const data = await res.json();
  if (!data?.result) return null;
  try {
    return JSON.parse(data.result);
  } catch {
    return null;
  }
}

// Modo demonstração: o que for salvo expira sozinho (TTL) e, quando a chave
// some do Redis, o seed roda de novo — a demo volta ao cardápio original
// sem nenhuma ação manual.
const DEMO_MODE = Boolean(process.env.NEXT_PUBLIC_DEMO_MODE);
const DEMO_RESET_SECONDS = Number(process.env.DEMO_RESET_SECONDS) || 3600;

async function kvSet(value, key = KV_KEY) {
  const res = await fetch(`${KV_URL}/set/${key}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${KV_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(value),
  });
  // Sem isto, um token errado "salvaria" sem erro (o admin diria sucesso à toa).
  if (!res.ok) {
    throw new Error(`Falha ao gravar no Redis (HTTP ${res.status}).`);
  }
  if (DEMO_MODE) {
    await fetch(`${KV_URL}/expire/${key}/${DEMO_RESET_SECONDS}`, {
      headers: { Authorization: `Bearer ${KV_TOKEN}` },
    });
  }
}

// Lê o cardápio. Em produção (KV) reflete as edições do admin sem rebuild.
// Na primeira leitura com o KV vazio, semeia a partir do arquivo de exemplo.
export async function getMenu() {
  if (useKV) {
    const fromKV = await kvGet();
    if (fromKV) return fromKV;
    const seed = await readFileMenu();
    await kvSet(seed);
    return seed;
  }
  return readFileMenu();
}

// Salva o cardápio. Usa o KV em produção; localmente grava no arquivo JSON.
export async function saveMenu(menu) {
  if (useKV) {
    await kvSet(menu);
  } else if (process.env.VERCEL) {
    // Na Vercel o sistema de arquivos é somente leitura: sem KV, não há onde
    // salvar. Erro claro em vez de um 500 cru de "EROFS".
    throw new Error(
      "Storage não configurado: defina KV_REST_API_URL e KV_REST_API_TOKEN (Upstash Redis) no projeto da Vercel."
    );
  } else {
    await fs.writeFile(DATA_PATH, JSON.stringify(menu, null, 2), "utf-8");
  }
  return menu;
}

// ───────────────── Pedidos (comanda no painel) ─────────────────
// Cada pedido enviado pelo carrinho também é salvo aqui (além do WhatsApp),
// para a aba "Pedidos" do admin com impressão de comanda. Guarda os últimos 200.
const PEDIDOS_KEY = `pedidos:${CLIENT_ID}`;
const PEDIDOS_PATH = path.join(process.cwd(), "data", "pedidos.json");

export async function getPedidos() {
  if (useKV) return (await kvGet(PEDIDOS_KEY)) || [];
  try {
    return JSON.parse(await fs.readFile(PEDIDOS_PATH, "utf-8"));
  } catch {
    return [];
  }
}

export async function savePedido(pedido) {
  const lista = await getPedidos();
  lista.unshift(pedido);
  const corte = lista.slice(0, 200);
  if (useKV) {
    await kvSet(corte, PEDIDOS_KEY);
  } else if (!process.env.VERCEL) {
    await fs.writeFile(PEDIDOS_PATH, JSON.stringify(corte, null, 2), "utf-8");
  }
  // Na Vercel sem KV: não persiste — o pedido segue normalmente pelo WhatsApp.
  return pedido;
}

// Regrava a lista inteira (usado pra atualizar status de um pedido).
export async function setPedidos(lista) {
  const corte = lista.slice(0, 200);
  if (useKV) {
    await kvSet(corte, PEDIDOS_KEY);
  } else if (!process.env.VERCEL) {
    await fs.writeFile(PEDIDOS_PATH, JSON.stringify(corte, null, 2), "utf-8");
  }
}
