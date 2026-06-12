"use client";

import { useEffect, useMemo, useState } from "react";
import { useCart } from "@/components/CartContext";
import { formatPrice, maskFone } from "@/lib/format";
import { estaAberto, horarioDeHoje } from "@/lib/horario";

const CUSTOMER_KEY = "cardapio_customer";
const PAYMENTS = ["Pix", "Cartão", "Dinheiro"];

export default function CartSheet({ restaurant, categories = [], products = [], onClose }) {
  const { items, updateQuantity, removeItem, total, lineTotal, clearCart, addItem } =
    useCart();

  // Dados do cliente (salvos no navegador para não digitar de novo)
  const [name, setName] = useState("");
  const [telefone, setTelefone] = useState("");
  const [cep, setCep] = useState("");
  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [city, setCity] = useState("");
  const [reference, setReference] = useState("");
  const [payment, setPayment] = useState("");
  const [changeFor, setChangeFor] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [etapa, setEtapa] = useState("form"); // form | enviando | feito
  const [pedidoId, setPedidoId] = useState(null);
  const [waUrl, setWaUrl] = useState("");
  const [cepStatus, setCepStatus] = useState(""); // "loading" | "ok" | "fail"

  useEffect(() => {
    document.body.style.overflow = "hidden";
    try {
      const s = JSON.parse(localStorage.getItem(CUSTOMER_KEY) || "{}");
      if (s.name) setName(s.name);
      if (s.telefone) setTelefone(maskFone(s.telefone));
      if (s.cep) setCep(s.cep);
      if (s.street) setStreet(s.street);
      if (s.number) setNumber(s.number);
      if (s.neighborhood) setNeighborhood(s.neighborhood);
      if (s.city) setCity(s.city);
      if (s.reference) setReference(s.reference);
      if (s.payment) setPayment(s.payment);
    } catch {}
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  // Busca o endereço pelo CEP na API pública ViaCEP (gratuita, sem chave).
  async function lookupCep(rawValue) {
    const digits = rawValue.replace(/\D/g, "").slice(0, 8);
    setCep(digits);
    if (digits.length !== 8) {
      setCepStatus("");
      return;
    }
    setCepStatus("loading");
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await res.json();
      if (data.erro) {
        setCepStatus("fail");
        return;
      }
      setStreet(data.logradouro || "");
      setNeighborhood(data.bairro || "");
      setCity([data.localidade, data.uf].filter(Boolean).join(" - "));
      setCepStatus("ok");
    } catch {
      setCepStatus("fail");
    }
  }

  // Monta o endereço completo em uma linha para a mensagem.
  function buildAddress() {
    const line1 = [street.trim(), number.trim()].filter(Boolean).join(", ");
    return [line1, neighborhood.trim(), city.trim(), cep && `CEP ${cep}`]
      .filter(Boolean)
      .join(" - ");
  }

  // Sugestões de upsell: produtos de categorias marcadas como "upsell" que
  // ainda não estão no carrinho (ex: bebidas e sobremesas).
  const upsellProducts = useMemo(() => {
    const upsellCats = new Set(
      categories.filter((c) => c.upsell).map((c) => c.id)
    );
    const inCart = new Set(items.map((i) => i.productId));
    return products
      .filter((p) => upsellCats.has(p.category) && !inCart.has(p.id))
      .slice(0, 6);
  }, [categories, products, items]);

  // Taxa de entrega fixa (configurável no admin); vazio = "a confirmar"
  const entregaFee = Number(restaurant.deliveryFee) || 0;
  const totalGeral = total + entregaFee;

  // Envia o pedido: registra no painel (aguardando a confirmação), loga o
  // cliente na área "Meus pedidos" e mostra a tela de pedido realizado.
  async function sendToWhatsApp() {
    if (items.length === 0 || etapa === "enviando") return;
    if (!estaAberto(restaurant.hours)) {
      setError(`Estamos fechados no momento 😴 (${horarioDeHoje(restaurant.hours)})`);
      return;
    }
    const telDig = telefone.replace(/\D/g, "");
    if (!name.trim() || telDig.length < 10 || !street.trim() || !number.trim()) {
      setError("Preencha nome, WhatsApp, rua e número da entrega.");
      return;
    }
    setError("");
    setEtapa("enviando");

    // Salva os dados pro próximo pedido + login automático na área do cliente
    try {
      localStorage.setItem(
        CUSTOMER_KEY,
        JSON.stringify({
          name,
          telefone,
          cep,
          street,
          number,
          neighborhood,
          city,
          reference,
          payment,
        })
      );
      localStorage.setItem(
        "cardapio_cliente",
        JSON.stringify({ nome: name.trim(), tel: telDig })
      );
    } catch {}

    // Registra o pedido no painel (timeout de 5s pra nunca travar a venda)
    let id = null;
    try {
      const res = await Promise.race([
        fetch("/api/pedidos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nome: name.trim(),
            telefone: telDig,
            endereco: buildAddress(),
            referencia: reference.trim(),
            pagamento: payment,
            troco: payment === "Dinheiro" ? changeFor.trim() : "",
            obs: notes.trim(),
            entrega: entregaFee,
            total: totalGeral,
            items: items.map((i) => ({
              qtd: i.quantity,
              nome: i.name,
              adicionais: i.addons.map((a) => a.name),
              sem: i.removedIngredients || [],
              total: lineTotal(i),
            })),
          }),
        }),
        new Promise((resolve) => setTimeout(() => resolve(null), 5000)),
      ]);
      if (res && res.ok) id = (await res.json()).id || null;
    } catch {}
    setPedidoId(id);

    let msg = `*Novo pedido — ${restaurant.name}*\n`;
    if (id) msg += `*Pedido:* #${id}\n`;
    msg += `\n*Cliente:* ${name.trim()}\n`;
    msg += `*Endereço:* ${buildAddress()}\n`;
    if (reference.trim()) msg += `*Referência:* ${reference.trim()}\n`;
    msg += `\n*Itens do pedido:*\n`;

    items.forEach((item) => {
      msg += `\n• ${item.quantity}x ${item.name}`;
      if (item.addons.length > 0) {
        msg += `\n   _Adicionais:_ ${item.addons.map((a) => a.name).join(", ")}`;
      }
      if (item.removedIngredients?.length > 0) {
        msg += `\n   _Sem:_ ${item.removedIngredients.join(", ")}`;
      }
      msg += `\n   ${formatPrice(lineTotal(item))}\n`;
    });

    if (entregaFee > 0) {
      msg += `\n*Subtotal: ${formatPrice(total)}*`;
      msg += `\n*Entrega: ${formatPrice(entregaFee)}*`;
      msg += `\n*Total: ${formatPrice(totalGeral)}*\n`;
    } else {
      msg += `\n*Total: ${formatPrice(total)}*\n`;
    }
    if (payment) {
      msg += `*Pagamento:* ${payment}`;
      if (payment === "Dinheiro" && changeFor.trim()) {
        msg += ` (troco para ${changeFor.trim()})`;
      }
      msg += `\n`;
    }
    if (notes.trim()) msg += `*Observações:* ${notes.trim()}\n`;
    if (entregaFee <= 0) {
      msg += `_${restaurant.deliveryNote || "Taxa de entrega a confirmar"}_`;
    }

    const url = `https://wa.me/${restaurant.phone}?text=${encodeURIComponent(
      msg
    )}`;
    setWaUrl(url);
    setEtapa("feito");
    clearCart();
    // Tenta abrir sozinho; se o navegador bloquear, o botão da tela resolve
    try {
      window.open(url, "_blank");
    } catch {}
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div
        className="absolute inset-0 animate-fade-in bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative z-10 flex max-h-[92dvh] w-full max-w-lg animate-slide-up flex-col overflow-hidden rounded-t-3xl bg-ink-800 sm:animate-scale-in sm:rounded-3xl">
        {/* Cabeçalho */}
        <div className="flex shrink-0 items-center justify-between border-b border-ink-700 px-5 py-4">
          <h2 className="font-display text-xl font-extrabold text-white">
            Seu pedido
          </h2>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-ink-700 text-white transition hover:bg-ink-600"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Corpo rolável */}
        {etapa === "feito" ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 overflow-y-auto px-6 py-12 text-center">
            <span className="text-6xl">🎉</span>
            <h3 className="font-display text-2xl font-extrabold text-heading">
              Pedido realizado!
            </h3>
            {pedidoId && (
              <p className="font-mono text-base font-bold text-brand-light">
                Pedido #{pedidoId}
              </p>
            )}
            <p className="text-sm text-zinc-400">
              Agora confirme com a loja pelo WhatsApp — se ele não abriu
              sozinho, toca no botão verde:
            </p>
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full max-w-xs items-center justify-center gap-2 rounded-full bg-green-500 px-6 py-3.5 font-display font-bold text-white transition hover:bg-green-600 active:scale-95"
            >
              📲 Enviar no WhatsApp
            </a>
            <a href="/pedidos" className="btn-primary w-full max-w-xs">
              📦 Acompanhar meu pedido
            </a>
            <p className="max-w-xs text-xs text-zinc-500">
              Você já está logado na área de pedidos — acompanhe o status e
              fale com a loja por lá 💬
            </p>
          </div>
        ) : (
          <>
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {items.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-5xl">🛒</p>
              <p className="mt-4 text-zinc-400">Seu carrinho está vazio</p>
            </div>
          ) : (
            <>
              {/* Itens */}
              <div className="flex flex-col gap-4">
                {items.map((item) => (
                  <div key={item.key} className="flex gap-3">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-20 w-20 shrink-0 rounded-xl object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-display font-bold text-white">
                          {item.name}
                        </h3>
                        <button
                          onClick={() => removeItem(item.key)}
                          aria-label="Remover"
                          className="shrink-0 text-zinc-500 transition hover:text-red-400"
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </button>
                      </div>
                      {item.addons.length > 0 && (
                        <p className="mt-0.5 text-xs text-brand-light">
                          + {item.addons.map((a) => a.name).join(", ")}
                        </p>
                      )}
                      {item.removedIngredients?.length > 0 && (
                        <p className="mt-0.5 text-xs text-zinc-500">
                          Sem: {item.removedIngredients.join(", ")}
                        </p>
                      )}
                      <div className="mt-2 flex items-center justify-between">
                        <div className="flex items-center gap-3 rounded-full bg-ink-700 p-1">
                          <button
                            onClick={() => updateQuantity(item.key, item.quantity - 1)}
                            className="flex h-7 w-7 items-center justify-center rounded-full bg-ink-600 font-bold text-white transition active:scale-90"
                          >
                            −
                          </button>
                          <span className="w-5 text-center font-bold text-white">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.key, item.quantity + 1)}
                            className="flex h-7 w-7 items-center justify-center rounded-full bg-brand font-bold text-white transition active:scale-90"
                          >
                            +
                          </button>
                        </div>
                        <span className="font-display font-bold text-brand-light">
                          {formatPrice(lineTotal(item))}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Upsell — sugestões */}
              {upsellProducts.length > 0 && (
                <div className="mt-6">
                  <h3 className="mb-3 font-display text-base font-bold text-white">
                    🥤 Que tal adicionar?
                  </h3>
                  <div className="no-scrollbar -mx-5 flex gap-3 overflow-x-auto px-5">
                    {upsellProducts.map((p) => (
                      <div
                        key={p.id}
                        className="w-32 shrink-0 rounded-2xl border border-ink-700 bg-ink-700/40 p-2"
                      >
                        <img
                          src={p.image}
                          alt={p.name}
                          className="h-20 w-full rounded-xl object-cover"
                        />
                        <p className="mt-2 line-clamp-1 text-sm font-semibold text-white">
                          {p.name}
                        </p>
                        <p className="text-xs font-bold text-brand-light">
                          {formatPrice(p.price)}
                        </p>
                        <button
                          onClick={() => addItem(p)}
                          className="mt-1.5 w-full rounded-full bg-brand py-1.5 text-xs font-bold text-white transition hover:bg-brand-dark active:scale-95"
                        >
                          + Adicionar
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Dados de entrega */}
              <div className="mt-7 space-y-3">
                <h3 className="font-display text-base font-bold text-white">
                  Dados para entrega
                </h3>
                <div>
                  <label className="label">Seu nome *</label>
                  <input
                    className="input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: João Silva"
                  />
                </div>
                <div>
                  <label className="label">Seu WhatsApp * (para acompanhar o pedido)</label>
                  <input
                    className="input"
                    value={telefone}
                    onChange={(e) => setTelefone(maskFone(e.target.value))}
                    inputMode="tel"
                    placeholder="(11) 99999-9999"
                  />
                </div>
                <div>
                  <label className="label">CEP</label>
                  <div className="relative">
                    <input
                      className="input"
                      value={cep}
                      onChange={(e) => lookupCep(e.target.value)}
                      inputMode="numeric"
                      placeholder="00000-000"
                      maxLength={9}
                    />
                    {cepStatus === "loading" && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400">
                        buscando...
                      </span>
                    )}
                    {cepStatus === "ok" && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-light">
                        ✓
                      </span>
                    )}
                  </div>
                  {cepStatus === "fail" && (
                    <p className="mt-1 text-xs text-red-400">
                      CEP não encontrado — preencha o endereço manualmente.
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-[1fr_90px] gap-3">
                  <div>
                    <label className="label">Rua *</label>
                    <input
                      className="input"
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      placeholder="Rua / Avenida"
                    />
                  </div>
                  <div>
                    <label className="label">Número *</label>
                    <input
                      className="input"
                      value={number}
                      onChange={(e) => setNumber(e.target.value)}
                      placeholder="123"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Bairro</label>
                    <input
                      className="input"
                      value={neighborhood}
                      onChange={(e) => setNeighborhood(e.target.value)}
                      placeholder="Bairro"
                    />
                  </div>
                  <div>
                    <label className="label">Cidade</label>
                    <input
                      className="input"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Cidade - UF"
                    />
                  </div>
                </div>

                <div>
                  <label className="label">Complemento / ponto de referência</label>
                  <input
                    className="input"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    placeholder="Apto 2, próximo à praça..."
                  />
                </div>

                <div>
                  <label className="label">Forma de pagamento</label>
                  <div className="flex gap-2">
                    {PAYMENTS.map((p) => (
                      <button
                        key={p}
                        onClick={() => setPayment(p === payment ? "" : p)}
                        className={`flex-1 rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${
                          payment === p
                            ? "border-brand bg-brand/10 text-white"
                            : "border-ink-600 bg-ink-700 text-zinc-300"
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                {payment === "Dinheiro" && (
                  <div>
                    <label className="label">Troco para quanto?</label>
                    <input
                      className="input"
                      value={changeFor}
                      onChange={(e) => setChangeFor(e.target.value)}
                      placeholder="Ex: R$ 50,00"
                    />
                  </div>
                )}

                <div>
                  <label className="label">Observações</label>
                  <input
                    className="input"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Sem cebola, ponto da carne..."
                  />
                </div>
              </div>

              <button
                onClick={clearCart}
                className="mt-5 block w-full text-center text-sm text-zinc-500 transition hover:text-red-400"
              >
                Limpar carrinho
              </button>
            </>
          )}
        </div>

        {/* Rodapé com total e botão */}
        {items.length > 0 && (
          <div className="shrink-0 border-t border-ink-700 bg-ink-800 p-4">
            <div className="mb-1 flex items-center justify-between text-sm text-zinc-400">
              <span>Subtotal</span>
              <span>{formatPrice(total)}</span>
            </div>
            <div className="mb-3 flex items-center justify-between text-sm text-zinc-400">
              <span>Entrega</span>
              <span className={entregaFee > 0 ? "font-semibold text-white" : "text-zinc-500"}>
                {entregaFee > 0 ? formatPrice(entregaFee) : "a confirmar"}
              </span>
            </div>
            <div className="mb-4 flex items-center justify-between">
              <span className="font-display text-lg font-bold text-white">
                Total
              </span>
              <span className="font-display text-2xl font-extrabold text-white">
                {formatPrice(totalGeral)}
              </span>
            </div>

            {error && (
              <p className="mb-3 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
                {error}
              </p>
            )}

            <button
              onClick={sendToWhatsApp}
              disabled={etapa === "enviando"}
              className="flex w-full items-center justify-center gap-3 rounded-full bg-green-500 disabled:opacity-60 px-6 py-4 font-display text-lg font-bold text-white shadow-[0_10px_40px_-10px_rgba(34,197,94,0.5)] transition hover:bg-green-600 active:scale-95"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm0 1.67c2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 0 1 2.42 5.82c0 4.54-3.7 8.23-8.24 8.23-1.48 0-2.93-.4-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.18 8.18 0 0 1-1.26-4.38c.01-4.54 3.7-8.23 8.24-8.23zm4.52 11.64c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.23-1.48-1.38-1.73-.14-.25-.01-.38.11-.51.11-.11.25-.29.37-.43.12-.14.16-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.22.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.14-1.18-.06-.1-.22-.16-.47-.28z" />
              </svg>
              {etapa === "enviando" ? "Enviando pedido..." : "Enviar pedido no WhatsApp"}
            </button>
            <p className="mt-3 text-center text-xs text-zinc-500">
              O restaurante confirma a taxa de entrega pelo WhatsApp
            </p>
          </div>
        )}
          </>
        )}
      </div>
    </div>
  );
}
