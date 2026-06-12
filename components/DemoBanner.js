// Botão flutuante exibido APENAS em deploys de demonstração.
// Liga com as variáveis de ambiente:
//   NEXT_PUBLIC_DEMO_MODE=1
//   NEXT_PUBLIC_DEMO_WHATSAPP=5511999999999  (WhatsApp de quem vende o sistema)
// Nos projetos dos clientes essas variáveis não existem e nada é renderizado.
export default function DemoBanner() {
  const enabled = process.env.NEXT_PUBLIC_DEMO_MODE;
  const phone = process.env.NEXT_PUBLIC_DEMO_WHATSAPP;
  if (!enabled || !phone) return null;

  const msg = encodeURIComponent(
    "Olá! Vi a demonstração e quero um cardápio digital assim para a minha hamburgueria 🍔"
  );

  return (
    <a
      href={`https://wa.me/${phone}?text=${msg}`}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-24 right-4 z-40 flex items-center gap-2 rounded-full bg-green-500 py-3 pl-4 pr-5 text-sm font-bold text-white shadow-[0_10px_40px_-10px_rgba(34,197,94,0.7)] transition hover:bg-green-600 active:scale-95"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2z" />
      </svg>
      Quero um site assim
    </a>
  );
}
