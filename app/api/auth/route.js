import { NextResponse } from "next/server";
import {
  ADMIN_USER,
  ADMIN_PASS,
  SESSION_COOKIE,
  SESSION_VALUE,
} from "@/lib/auth";

// Login: valida usuário/senha e grava o cookie de sessão.
export async function POST(request) {
  const { user, pass } = await request.json();

  if (user === ADMIN_USER && pass === ADMIN_PASS) {
    const res = NextResponse.json({ ok: true });
    res.cookies.set(SESSION_COOKIE, SESSION_VALUE, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 dias
    });
    return res;
  }

  return NextResponse.json(
    { ok: false, error: "Usuário ou senha inválidos" },
    { status: 401 }
  );
}

// Logout: limpa o cookie de sessão.
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
