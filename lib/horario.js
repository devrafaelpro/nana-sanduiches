// Horários de funcionamento — fuso de Brasília.
// hours = array de 7 dias (0=Domingo ... 6=Sábado):
//   { aberto: boolean, de: "19:00", ate: "23:30" }
// Sem configuração → considera sempre aberto (retrocompatível).

export const DIAS = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
];

export function agoraSP() {
  return new Date(
    new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" })
  );
}

export function estaAberto(hours) {
  if (!Array.isArray(hours) || hours.length !== 7) return true;
  const agora = agoraSP();
  const dia = hours[agora.getDay()];
  if (!dia?.aberto) return false;
  const min = agora.getHours() * 60 + agora.getMinutes();
  const [h1, m1] = String(dia.de || "00:00").split(":").map(Number);
  const [h2, m2] = String(dia.ate || "23:59").split(":").map(Number);
  const ini = h1 * 60 + (m1 || 0);
  const fim = h2 * 60 + (m2 || 0);
  // suporta horário que vira a meia-noite (ex: 18:00–02:00)
  return fim >= ini ? min >= ini && min <= fim : min >= ini || min <= fim;
}

// Texto do dia atual (pra faixa de "fechado"): "Quarta: 19:00–23:30" / "hoje: fechado"
export function horarioDeHoje(hours) {
  if (!Array.isArray(hours) || hours.length !== 7) return "";
  const agora = agoraSP();
  const dia = hours[agora.getDay()];
  if (!dia?.aberto) return `${DIAS[agora.getDay()]}: fechado`;
  return `${DIAS[agora.getDay()]}: ${dia.de || "00:00"}–${dia.ate || "23:59"}`;
}
