import { getMenu } from "@/lib/data";
import MenuClient from "@/components/MenuClient";
import DemoBanner from "@/components/DemoBanner";

export const dynamic = "force-dynamic";

export default async function CardapioPage() {
  const menu = await getMenu();
  return (
    <>
      <MenuClient menu={menu} />
      <DemoBanner />
    </>
  );
}
