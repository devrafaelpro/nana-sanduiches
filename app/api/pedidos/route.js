import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getPedidos, savePedido, setPedidos } from "@/lib/data";
import { isAuthed } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Lista os pedidos (protegido — só o admin logado).
export async function GET() {
  const cookieStore = await cookies();
  if (!isAuthed(cookieStore)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  return NextResponse.json(await getPedidos());
}

// Registra um pedido vindo do carrinho (público, com validação/limites).
export async function POST(request) {
  let b;
  try {
    b = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }
  if (!b || !Array.isArray(b.items) || b.items.length === 0) {
    return NextResponse.json({ error: "Pedido vazio" }, { status: 400 });
  }
  const txt = (v, max) => String(v ?? "").slice(0, max);
  const agora = new Date().toISOString();
  const pedido = {
    id: Math.random().toString(36).slice(2, 8).toUpperCase(),
    criadoEm: agora,
    status: "recebido",
    historico: [{ status: "recebido", em: agora }],
    mensagens: [
      { de: "loja", sys: true, texto: "Pedido recebido! 🎉 Já estamos olhando.", em: agora },
    ],
    nome: txt(b.nome, 80),
    telefone: txt(b.telefone, 20).replace(/\D/g, ""),
    endereco: txt(b.endereco, 220),
    referencia: txt(b.referencia, 120),
    pagamento: txt(b.pagamento, 30),
    troco: txt(b.troco, 30),
    obs: txt(b.obs, 200),
    entrega: Number(b.entrega) || 0,
    total: Number(b.total) || 0,
    items: b.items.slice(0, 50).map((i) => ({
      qtd: Math.max(1, Number(i.qtd) || 1),
      nome: txt(i.nome, 80),
      adicionais: (Array.isArray(i.adicionais) ? i.adicionais : [])
        .slice(0, 12)
        .map((a) => txt(a, 60)),
      sem: (Array.isArray(i.sem) ? i.sem : []).slice(0, 12).map((a) => txt(a, 60)),
      total: Number(i.total) || 0,
    })),
  };
  try {
    await savePedido(pedido);
  } catch (err) {
    console.error("Erro ao salvar pedido:", err);
  }
  return NextResponse.json({ ok: true, id: pedido.id });
}

// Atualiza o status de um pedido (protegido — só admin).
const STATUS_VALIDOS = ["recebido", "aceito", "preparando", "saiu", "entregue", "cancelado"];

export async function PATCH(request) {
  const cookieStore = await cookies();
  if (!isAuthed(cookieStore)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  const { id, status } = await request.json().catch(() => ({}));
  if (!id || !STATUS_VALIDOS.includes(status)) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }
  const lista = await getPedidos();
  const idx = lista.findIndex((p) => p.id === id);
  if (idx < 0) return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });
  const em = new Date().toISOString();
  const AVISOS = {
    aceito: "Seu pedido foi ACEITO! ✅",
    preparando: "Seu pedido está EM PREPARAÇÃO! 👨‍🍳",
    saiu: "Seu pedido SAIU PARA ENTREGA! 🛵",
    entregue: "Pedido entregue! Bom apetite! 😋",
    cancelado: "Pedido cancelado. ❌",
  };
  lista[idx].status = status;
  lista[idx].historico = [...(lista[idx].historico || []), { status, em }];
  if (AVISOS[status]) {
    lista[idx].mensagens = [
      ...(lista[idx].mensagens || []),
      { de: "loja", sys: true, texto: AVISOS[status], em },
    ].slice(-100);
  }
  await setPedidos(lista);
  return NextResponse.json({ ok: true });
}
