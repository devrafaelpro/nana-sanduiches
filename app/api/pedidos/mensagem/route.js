import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getPedidos, setPedidos } from "@/lib/data";
import { isAuthed } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Chat do pedido: a loja responde pelo painel (autenticada); o cliente envia
// provando posse do telefone do pedido.
export async function POST(request) {
  const b = await request.json().catch(() => ({}));
  const texto = String(b.texto || "").trim().slice(0, 300);
  if (!b.id || !texto) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const lista = await getPedidos();
  const idx = lista.findIndex((p) => p.id === b.id);
  if (idx < 0) {
    return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });
  }

  let de = "cliente";
  const cookieStore = await cookies();
  if (b.de === "loja" && isAuthed(cookieStore)) {
    de = "loja";
  } else {
    const tel = String(b.tel || "").replace(/\D/g, "");
    const telPedido = (lista[idx].telefone || "").replace(/\D/g, "");
    const ok =
      tel.length >= 10 &&
      telPedido &&
      (tel === telPedido || "55" + tel === telPedido || tel === "55" + telPedido);
    if (!ok) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
  }

  lista[idx].mensagens = [
    ...(lista[idx].mensagens || []),
    { de, texto, em: new Date().toISOString() },
  ].slice(-100);
  await setPedidos(lista);
  return NextResponse.json({ ok: true });
}
