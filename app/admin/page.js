import { cookies } from "next/headers";
import { getMenu } from "@/lib/data";
import { isAuthed, ADMIN_USER, ADMIN_PASS } from "@/lib/auth";
import AdminLogin from "@/components/AdminLogin";
import AdminDashboard from "@/components/AdminDashboard";

export const dynamic = "force-dynamic";

const DEMO_MODE = Boolean(process.env.NEXT_PUBLIC_DEMO_MODE);

export default async function AdminPage() {
  const cookieStore = await cookies();
  const authed = isAuthed(cookieStore);

  if (!authed) {
    // Em modo demo, mostra as credenciais na tela para o prospect testar sozinho.
    return (
      <AdminLogin
        demoHint={DEMO_MODE ? { user: ADMIN_USER, pass: ADMIN_PASS } : null}
      />
    );
  }

  const menu = await getMenu();
  return <AdminDashboard initialMenu={menu} demoMode={DEMO_MODE} />;
}
