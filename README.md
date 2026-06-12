# 🍔 Cardápio Digital

Template de cardápio digital para hamburguerias com visual premium (dark mode), carrinho e pedidos via **WhatsApp**. Feito em **Next.js (App Router)** + **Tailwind CSS**, com dados em **JSON editável** — sem banco de dados e **sem rebuild** para alterar o cardápio.

## ✨ Recursos

- **Página inicial** com capa em tela cheia, logo e botão "Ver cardápio"
- **Cardápio** com categorias em scroll horizontal e cards apetitosos
- **Modal de produto** com adicionais pagos e **ingredientes removíveis** (ex: "sem cebola")
- **Upsell** — sugestões automáticas no carrinho (ex: bebidas e sobremesas)
- **Carrinho** com **dados do cliente** (nome, endereço, pagamento), resumo e envio pelo WhatsApp
- **Painel admin** (`/admin`) para editar restaurante, produtos, preços, categorias, **ingredientes** e **adicionais**
- **Mobile-first**, animações suaves e sensação de app de delivery

## 🚀 Como rodar

```bash
npm install
npm run dev      # http://localhost:3000
```

Build de produção:

```bash
npm run build && npm start
```

## 🔐 Painel Admin

Acesse **`/admin`**. Credenciais padrão:

- Usuário: `admin`
- Senha: `admin123`

Para alterar, edite `lib/auth.js` ou defina as variáveis de ambiente `ADMIN_USER` e `ADMIN_PASS`.

As edições são salvas em `data/menu.json` e refletem **imediatamente** no cardápio, sem precisar rebuildar.

## 🗂️ Estrutura

```
app/
  page.js              # Página inicial (capa)
  cardapio/page.js     # Cardápio
  admin/page.js        # Painel admin (login + dashboard)
  api/auth/route.js    # Login / logout
  api/menu/route.js    # GET cardápio (público) / PUT salvar (protegido)
components/             # CartContext, MenuClient, ProductModal, CartSheet, Admin*
data/menu.json         # Todos os dados do cardápio (editável)
lib/                   # data, auth, format
```

## 📱 WhatsApp

O número fica em `data/menu.json` (`restaurant.phone`) no formato internacional só com números (ex: `5511999999999`). Ao finalizar, o pedido é montado e o usuário é redirecionado para `https://wa.me/NUMERO?text=MENSAGEM`.

## ▲ Deploy no Vercel (com admin funcionando)

É **um projeto só** — front e back juntos (Next.js). No Vercel o sistema de arquivos é somente leitura, então o admin precisa de um storage externo para salvar. A camada `lib/data.js` detecta isso automaticamente:

- **Sem variáveis de ambiente** → usa `data/menu.json` (ideal para rodar localmente).
- **Com KV configurado** → salva no Redis e reflete na hora, sem rebuild.

### Um banco Upstash grátis atende vários clientes

O plano grátis da Upstash dá **1 banco por conta** — mas **1 banco serve muitos restaurantes**. Cada cardápio é salvo numa chave separada (`menu:<CLIENT_ID>`), e como cada cardápio ocupa poucos KB, os 256 MB grátis comportam **milhares** de clientes. Você cria o banco **uma única vez**.

**Setup inicial (uma vez na vida):**

1. Crie **um** banco **Upstash Redis** (no Marketplace do Vercel ou direto no upstash.com).
2. Anote `KV_REST_API_URL` e `KV_REST_API_TOKEN` (também aceita `UPSTASH_REDIS_REST_*`).

**Para cada cliente novo (só variáveis de ambiente, sem criar serviço):**

1. Importe/clone o projeto no Vercel.
2. Em **Settings → Environment Variables**, defina:
   - `KV_REST_API_URL` e `KV_REST_API_TOKEN` → os mesmos do seu banco único (ou conecte o storage ao projeto, que o Vercel injeta sozinho).
   - `CLIENT_ID` → um identificador único do cliente (ex: `burguer-house`). **É isso que separa o cardápio de cada um.**
   - `ADMIN_USER` e `ADMIN_PASS` → login do cliente.
3. Deploy. Na primeira visita o cardápio é semeado a partir de `data/menu.json`; a partir daí o cliente edita tudo pelo `/admin`.

> Sem o KV o site funciona normalmente, mas o `/admin` não salva em produção — nesse caso edite `data/menu.json` localmente e faça redeploy.

## 🔁 Replicar para um novo cliente

1. Clone o projeto (ou use "Use this template" no GitHub).
2. Ajuste o cardápio inicial em `data/menu.json` (nome, telefone, capa, produtos…).
3. Deploy no Vercel definindo um `CLIENT_ID` novo + login — reaproveitando o mesmo banco Upstash.
