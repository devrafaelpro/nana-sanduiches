// Autenticação simples para o painel admin.
// Credenciais fixas — troque aqui ou via variáveis de ambiente.
export const ADMIN_USER = process.env.ADMIN_USER || "admin";
export const ADMIN_PASS = process.env.ADMIN_PASS || "admin123";

export const SESSION_COOKIE = "cardapio_admin";
// Valor do cookie de sessão (simples; suficiente para um painel básico).
export const SESSION_VALUE = "ok";

export function isAuthed(cookieStore) {
  return cookieStore.get(SESSION_COOKIE)?.value === SESSION_VALUE;
}
