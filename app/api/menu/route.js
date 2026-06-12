import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getMenu, saveMenu } from "@/lib/data";
import { isAuthed } from "@/lib/auth";

// Retorna o cardápio atual (público).
export async function GET() {
  const menu = await getMenu();
  return NextResponse.json(menu);
}

// Salva o cardápio (protegido — só admin logado).
export async function PUT(request) {
  const cookieStore = await cookies();
  if (!isAuthed(cookieStore)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const data = await request.json();
    await saveMenu(data);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Erro ao salvar o cardápio:", err);
    return NextResponse.json(
      { error: err?.message || "Não foi possível salvar o cardápio." },
      { status: 500 }
    );
  }
}
