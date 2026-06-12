"use client";

import { useEffect, useState } from "react";
import { estaAberto, horarioDeHoje, DIAS } from "@/lib/horario";

// Hook: aberto/fechado calculado no cliente (revalida a cada minuto)
export function useAberto(hours) {
  const [aberto, setAberto] = useState(true);
  useEffect(() => {
    const calc = () => setAberto(estaAberto(hours));
    calc();
    const t = setInterval(calc, 60000);
    return () => clearInterval(t);
  }, [hours]);
  return aberto;
}

// Faixa exibida no cardápio quando a loja está fechada
export function BannerFechado({ hours }) {
  return (
    <div className="bg-red-500/15 px-4 py-2.5 text-center text-sm font-semibold text-red-300">
      😴 Estamos fechados no momento — {horarioDeHoje(hours)}. Você pode olhar o
      cardápio à vontade!
    </div>
  );
}

// Tabela da semana (rodapé do cardápio)
export function TabelaHorarios({ hours }) {
  if (!Array.isArray(hours) || hours.length !== 7) return null;
  const hoje = new Date(
    new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" })
  ).getDay();
  return (
    <div className="mx-auto mt-10 max-w-sm rounded-2xl border border-ink-700 bg-ink-800/60 p-5">
      <p className="mb-3 text-center text-sm font-bold uppercase tracking-wide text-zinc-400">
        🕐 Horários de funcionamento
      </p>
      <div className="space-y-1.5">
        {DIAS.map((d, i) => {
          const h = hours[i];
          const ativo = i === hoje;
          return (
            <div
              key={d}
              className={`flex justify-between rounded-lg px-3 py-1 text-sm ${
                ativo ? "bg-brand/10 font-bold text-white" : "text-zinc-400"
              }`}
            >
              <span>{d}</span>
              <span className={h?.aberto ? "" : "text-red-400"}>
                {h?.aberto ? `${h.de || "00:00"} – ${h.ate || "23:59"}` : "Fechado"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
