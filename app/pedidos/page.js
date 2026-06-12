import { getMenu } from "@/lib/data";
import MeusPedidos from "@/components/MeusPedidos";

export const dynamic = "force-dynamic";

export default async function PedidosPage() {
  const menu = await getMenu();
  return <MeusPedidos restaurant={menu.restaurant} />;
}
