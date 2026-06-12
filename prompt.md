Crie um sistema de cardápio digital para hamburguerias com foco em design moderno, visual atrativo e alta conversão de pedidos via WhatsApp.

O sistema deve ser simples tecnicamente, mas com design altamente profissional, pensado para dar a sensação de um app de delivery.

---

## Tecnologias

* Next.js (App Router)
* Tailwind CSS

---

## Objetivo

Criar um cardápio digital com:

* visual forte e apetitoso
* fácil navegação
* foco em aumentar pedidos

---

## Estilo visual (MUITO IMPORTANTE)

* Tema escuro (dark mode)
* Cores principais:

  * preto / cinza escuro
  * laranja ou vermelho para destaque
* Tipografia moderna e forte (bold)
* Layout inspirado em apps de delivery

---

## Design

### Página inicial

* imagem de capa grande (hambúrguer destaque)
* logo do restaurante
* nome em destaque
* botão grande: "Ver cardápio"

---

### Página de cardápio

* categorias em formato horizontal (scroll)

  * Ex: Burgers, Combos, Bebidas

* produtos em formato de cards:

  * imagem grande
  * nome do lanche
  * descrição curta
  * preço bem destacado
  * botão "Adicionar"

---

### Produto (modal ou página)

* imagem grande no topo
* nome + descrição
* preço destacado
* seleção de adicionais com botões fáceis
* botão fixo: "Adicionar ao pedido"

---

### Carrinho

* lista de produtos
* resumo claro
* total destacado
* botão fixo: "Enviar pedido no WhatsApp"

---

## Experiência do usuário

* mobile-first (prioridade total)
* botões grandes e fáceis de clicar
* animações leves (hover, click, transições)
* sensação de app fluido

---

## Funcionalidades

* adicionar/remover produtos
* selecionar adicionais
* alterar quantidade
* cálculo automático do total

---

## Integração com WhatsApp

Ao finalizar:

* gerar mensagem com:

  * produtos
  * adicionais
  * quantidade
  * total
  * incluir: "Taxa de entrega a confirmar"

* redirecionar para:
  https://wa.me/NUMERO?text=MENSAGEM

---

## Painel Admin (/admin)

* login simples (usuário e senha fixos)

Permitir editar:

* nome do restaurante
* telefone (WhatsApp)
* produtos
* preços
* categorias

---

## Estrutura de dados

* usar JSON dinâmico (editável via painel)
* NÃO depender de rebuild

---

## Requisitos importantes

* código simples e organizado
* fácil de replicar para novos clientes
* sem banco de dados complexo
* sem sistema SaaS completo

---

## DIFERENCIAL (IMPORTANTE)

O design deve parecer um aplicativo premium de hamburgueria, com foco em:

* deixar os lanches visualmente irresistíveis
* facilitar a montagem do pedido
* incentivar o usuário a finalizar o pedido rápido

---

## Objetivo final

Criar um template que impressione donos de hamburgueria e aumente a chance de fechamento de venda, mesmo sendo um sistema simples por trás.
