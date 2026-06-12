import Link from "next/link";
import { getMenu } from "@/lib/data";
import DemoBanner from "@/components/DemoBanner";
import { estaAberto } from "@/lib/horario";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const menu = await getMenu();
  const { restaurant } = menu;
  const aberto = estaAberto(restaurant.hours);

  return (
    <main className="relative min-h-dvh overflow-hidden">
      <DemoBanner />
      {/* Imagem de capa em tela cheia */}
      <div className="absolute inset-0">
        <img
          src={restaurant.cover}
          alt=""
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-ink-900/60 via-ink-900/75 to-ink-900" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-900 via-transparent to-transparent" />
      </div>

      {/* Conteúdo */}
      <div className="relative z-10 flex min-h-dvh flex-col items-center justify-center px-6 py-16 text-center">
        <div className="mx-auto flex max-w-md flex-col items-center animate-fade-in">
          <div className="mb-6 flex h-24 w-24 items-center justify-center overflow-hidden rounded-3xl bg-brand text-5xl shadow-glow ring-4 ring-white/10">
            {/^https?:\/\//.test(restaurant.logo) ? (
              <img
                src={restaurant.logo}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              restaurant.logo
            )}
          </div>

          <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-brand-light backdrop-blur">
            <span className={`h-2 w-2 animate-pulse rounded-full ${aberto ? "bg-green-400" : "bg-red-500"}`} />
            {aberto ? "Aberto agora" : "Fechado no momento"}
          </span>

          <h1 className="font-display text-5xl font-extrabold leading-tight text-heading text-balance drop-shadow-lg sm:text-6xl">
            {restaurant.name}
          </h1>

          <p className="mt-4 max-w-sm text-lg text-zinc-300 text-balance">
            {restaurant.tagline}
          </p>

          <Link
            href="/cardapio"
            className="btn-primary mt-9 w-full max-w-xs text-lg py-4"
          >
            Ver cardápio
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>

          <p className="mt-5 text-sm text-zinc-400">
            🛵 Entrega rápida • 💳 Pix, cartão e dinheiro
          </p>
        </div>
      </div>
    </main>
  );
}
