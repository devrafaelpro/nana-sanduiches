import { Inter, Poppins } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/components/CartContext";
import { getMenu } from "@/lib/data";
import { themeToCss } from "@/lib/theme";

export const dynamic = "force-dynamic";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-poppins",
  display: "swap",
});

// Título, descrição e prévia de compartilhamento (WhatsApp/redes) dinâmicos:
// usam o nome, slogan e capa do restaurante salvos no cardápio.
export async function generateMetadata() {
  try {
    const { restaurant } = await getMenu();
    return {
      title: `${restaurant.name} — Cardápio Digital`,
      description: restaurant.tagline || "Peça já pelo WhatsApp!",
      openGraph: {
        title: restaurant.name,
        description: restaurant.tagline || "Peça já pelo WhatsApp!",
        images: restaurant.cover ? [restaurant.cover] : [],
      },
    };
  } catch {
    return { title: "Cardápio Digital" };
  }
}

export const viewport = {
  themeColor: "#0a0a0b",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default async function RootLayout({ children }) {
  let themeCss = "";
  let preload = [];
  try {
    const menu = await getMenu();
    themeCss = themeToCss(menu.theme);
    // Pré-carrega logo e capa: começam a baixar junto com o HTML,
    // eliminando o "pisca" da logo aparecendo aos poucos.
    preload = [menu.restaurant?.logo, menu.restaurant?.cover].filter((u) =>
      /^https?:\/\//.test(u || "")
    );
  } catch {
    themeCss = themeToCss();
  }

  return (
    <html lang="pt-BR" className={`${inter.variable} ${poppins.variable}`}>
      <head>
        <style dangerouslySetInnerHTML={{ __html: themeCss }} />
        {preload.map((href) => (
          <link key={href} rel="preload" as="image" href={href} />
        ))}
      </head>
      <body className="font-sans">
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
