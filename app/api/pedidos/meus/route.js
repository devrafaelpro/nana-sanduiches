import { NextResponse } from "next/server";
import { getPedidos } from "@/lib/data";

export const dynamic = "force-dynamic";

// Área do cliente: lista os pedidos do telefone informado (login simples
// por nome+WhatsApp, padrão dos apps de delivery).
export async function GET(request) {
  const tel = (new URL(request.url).searchParams.get("tel") || "").replace(/\D/g, "");
  if (tel.length < 10) {
    return NextResponse.json({ error: "Telefone inválido" }, { status: 400 });
  }
  const todos = await getPedidos();
  const meus = todos.filter((p) => {
    const t = (p.telefone || "").replace(/\D/g, "");
    return t && (t === tel || t === "55" + tel || "55" + t === tel);
  });
  return NextResponse.json(meus);
}
