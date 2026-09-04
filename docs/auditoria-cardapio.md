# Auditoria completa do Cardápio Digital

Rodada de diagnóstico apenas — nenhum arquivo de código foi alterado nesta sessão. Migrations, `tsc`, `build` e `lint` foram *executados* (leitura), nunca usados para corrigir nada.

Ambiente: Next.js 16.3.3 (App Router, Turbopack) + TypeScript + Tailwind v4 + Supabase (projeto `jurbkjrqduclyawofjnb`). Loja real usada como base de teste: **Cida Lanche** (`cida-lanche`).

---

## 1. Placar

| Gravidade | Quantidade |
|---|---|
| 🔴 BLOQUEADOR | 1 |
| 🟠 GRAVE | 8 |
| 🟡 MÉDIO | 10 |
| ⚪ BAIXO | 6 |
| **Total** | **25** |

**Pode receber cliente real hoje? Não.**

O motivo não é volume de achados pequenos — é que o carrinho fecha pedido confiando 100% no preço que está no navegador do cliente, sem checagem nenhuma no instante do clique em "Fechar pedido" (achado B1), e duas telas inteiras (categoria e busca) deixam adicionar item ao carrinho com a loja fechada (G1/G2). Esses três, juntos, tocam a coisa que mais importa num cardápio: o pedido que chega pro dono pode estar com preço errado ou ser impossível de atender. O resto — tap target pequeno, falta de `error.tsx`, índice faltando — é real e vale corrigir, mas não é o que te impede de abrir hoje.

---

## 2. Semáforo por tela

| Tela | Status | Justificativa |
|---|---|---|
| Home (`/[slug]`) | 🟡 | Fluxo principal funciona (testado ao vivo); botão "+" abaixo do tap target mínimo, imagem quebrada não tem fallback. |
| Detalhe do produto | 🟡 | Adiciona ao carrinho corretamente e respeita loja fechada; mas os adicionais não são acessíveis por leitor de tela (G7). |
| Categoria | 🔴 | Deixa adicionar produto ao carrinho com a loja fechada — nenhuma outra tela pública do app tem essa falha. |
| Promoções | 🟢 | Sem achados de correção nesta varredura. |
| Busca | 🔴 | Mesmo bug de loja fechada da Categoria, **e** mostra produto esgotado como se estivesse disponível. |
| Carrinho | 🔴 | Onde mora o achado BLOQUEADOR: fecha pedido sem revalidar preço no clique. |
| Pedidos | 🟢 | Local (sem backend), mas funciona como projetado: histórico e "pedir de novo" reais. |
| Perfil | 🟡 | Botão "Fale no WhatsApp" não abre o WhatsApp — abre o sheet de Informações (G4). |
| Sheet de informações | 🟢 | Todos os blocos renderizam e funcionam; falta trava de foco (M6, cosmético). |
| Menu lateral | 🟢 | Todos os itens têm ação real, testado. |

---

## 3. Tabela de achados

| # | Gravidade | Tela | Arquivo:linha | O que está errado | Impacto |
|---|---|---|---|---|---|
| B1 | 🔴 BLOQUEADOR | Carrinho | `src/app/[slug]/carrinho/CartPageContent.tsx:45-71,90-103` | `checkCartPrices` (revalidação de preço no servidor) só roda **uma vez**, ao montar a tela (guard `revalidated.current`). `handleCheckout` (linha 90) — chamado no clique de "Fechar pedido" — não faz **nenhuma** chamada ao servidor: lê `cart.items`/`cart.subtotalCents` (estado local em `localStorage`) e manda direto pro WhatsApp. | Se o cliente ficar um tempo no carrinho (promoção expira, produto esgota, dono muda preço) o valor enviado fica desatualizado. Pior: como o preço final vem 100% do estado do navegador, dá pra editar via DevTools/`localStorage` e mandar qualquer valor pro dono sem checagem nenhuma no instante crítico. |
| G1 | 🟠 GRAVE | Categoria | `src/app/[slug]/categoria/[categorySlug]/page.tsx` (não chama `isOpenNow`); `CategoryPageContent.tsx:149,155` | `ProductCard`/`ProductListCard` são renderizados sem a prop `orderingDisabled` — o "+" fica sempre habilitado, mesmo com a loja fechada. | Cliente consegue "pedir" numa hora em que a cozinha não vai nem ver o pedido — inconsistente com a Home e o Detalhe do produto, que bloqueiam corretamente. |
| G2 | 🟠 GRAVE | Busca | `src/lib/supabase/store-queries.ts` (`getAllProducts`, sem filtro `is_available`); `src/app/[slug]/busca/SearchPageContent.tsx:68` | Mesmo bug do G1 (sem `orderingDisabled`) **e** a query de busca não filtra produtos esgotados — eles aparecem na lista, com "+" habilitado, sem nenhuma marca de indisponível. | Cliente pesquisa e adiciona ao carrinho um item que o dono já tirou de circulação; só é barrado (silenciosamente, com toast genérico) se abrir o carrinho depois. |
| G3 | 🟠 GRAVE | Carrinho | `src/app/[slug]/carrinho/CartPageContent.tsx:50` | `checkCartPrices(...).then(...)` não tem `.catch()` — se a chamada falhar (rede caiu, Supabase fora do ar), a Promise rejeita silenciosamente e nada acontece. | O cliente segue achando que o carrinho foi revalidado; combinado com B1, mais uma camada sem rede de segurança. |
| G4 | 🟠 GRAVE | Perfil | `src/app/[slug]/perfil/page.tsx:99-109` | O link "Fale no WhatsApp" tem `href="#"` e o `onClick` chama `event.preventDefault(); openInfo();` — abre o sheet de Informações, não o WhatsApp. | Rótulo mentiroso: o cliente clica esperando abrir uma conversa e cai numa tela diferente. Contorno existe (WhatsApp real está certo em Informações e no Menu lateral), mas este botão específico está errado. |
| G5 | 🟠 GRAVE | Todas | Nenhum `src/app/**/error.tsx` existe (confirmado via busca no projeto inteiro) | Zero tratamento de erro de runtime em qualquer nível da árvore de rotas. | Qualquer exceção não tratada (ex.: falha de rede numa Server Action, erro de renderização) mostra a tela de erro genérica e sem marca do Next, sem botão de "tentar de novo". |
| G6 | 🟠 GRAVE | Todas (mobile) | `src/app/layout.tsx` (sem export `viewport`); `src/app/[slug]/page.tsx:40-49` (`generateViewport` sem `viewportFit`) | Nenhum lugar do app define `viewport-fit=cover`. Sem isso, `env(safe-area-inset-*)` resolve pra `0` no Safari/iPhone. | Todo o código de safe-area que já existe (`StoreHeader.tsx:57`, `SolidHeader.tsx:29`, `BottomNav.tsx:25`) fica **inerte** em iPhone com notch/Dynamic Island/home indicator — foi escrito mas não tem efeito nenhum. |
| G7 | 🟠 GRAVE | Detalhe do produto | `src/app/[slug]/produto/[productSlug]/ProductDetailContent.tsx:164-177` | Os botões de opção (adicionais/variações) mudam de aparência quando selecionados, mas não têm `aria-pressed`, `role="checkbox"`/`"radio"` nem `aria-checked`. | Leitor de tela não anuncia o que está marcado. Num grupo **obrigatório** (ex.: "Ponto da carne"), quem usa leitor de tela pode não conseguir completar o pedido. |
| G8 | 🟠 GRAVE | Home / Categoria / Busca / Carrinho | `ProductCard.tsx:131`, `ProductListCard.tsx:111` (`size-8` = 32×32px); `CartPageContent.tsx:143,152` (`size-7` = 28×28px) | O botão "+" de adicionar ao carrinho — o controle mais usado do app inteiro — mede 32×32px; os steppers de quantidade do carrinho medem 28×28px. Abaixo do mínimo de 44×44px recomendado (Apple HIG / WCAG 2.5.5). | Mistoque em tela pequena, sobretudo pra quem tem dedo maior ou está andando/numa fila — exatamente o contexto de uso real de cardápio digital. |
| M1 | 🟡 MÉDIO | Categoria/Home | Tabela `categories` no Supabase | Existe índice em `(restaurant_id, sort_order)`, mas `getStoreCategories()` ordena por **`position`** (coluna nova) — não existe índice em `(restaurant_id, position)`. | Sem impacto perceptível hoje (poucas categorias); vira lentidão perceptível conforme o catálogo cresce. |
| M2 | 🟡 MÉDIO | Home/Promoções | Tabela `promotions` no Supabase | Índice só em `restaurant_id`; não existe composto `(restaurant_id, is_active)`, que é exatamente o filtro de `getLivePromotions()`. | Mesmo cenário do M1 — não dói agora, dói em escala. |
| M3 | 🟡 MÉDIO | (banco) | `restaurant_settings.pix_key` | Confirmado via REST direto com a chave `anon`: qualquer requisição sem autenticação lê `pix_key` de qualquer loja ativa — a RLS protege por linha (restaurante ativo), não por coluna. | Hoje a UI não expõe essa chave em lugar nenhum (não é renderizada), mas o dado fica publicamente consultável por quem bater direto no Supabase REST. |
| M4 | 🟡 MÉDIO | Todas | Nenhum `<Image>` do app (produto, logo, capa) tem `onError` | Só `StoreCover.tsx` trata falha — e só a do **vídeo** (`onError={() => setVideoFailed(true)}`); a imagem de poster/capa (linha 142) e todas as imagens de produto não têm fallback. | URL de imagem quebrada mostra o ícone de imagem-quebrada padrão do navegador em vez do placeholder do app (que já existe e é usado quando a URL é `null`, só não quando ela existe mas falha ao carregar). |
| M5 | 🟡 MÉDIO | Detalhe do produto | `ProductDetailContent.tsx:180` | `text-red-500` (cor padrão do Tailwind) na mensagem de erro de grupo obrigatório — único lugar do app público que não usa um token do tema. | Não se adapta ao tema da loja; risco de contraste ruim dependendo da paleta escolhida pelo dono. |
| M6 | 🟡 MÉDIO | Info/Menu | `InfoSheet.tsx`, `MenuDrawer.tsx`, `DirectionsSheet` (dentro de `InfoSheet.tsx`) | `useOverlayBehavior` foca o painel ao abrir e devolve o foco ao fechar, mas não trava o `Tab` dentro do overlay enquanto aberto. | Navegando só por teclado, dá pra `Tab` sair do sheet/drawer aberto e cair em conteúdo visualmente coberto atrás dele. |
| M7 | 🟡 MÉDIO | Categoria/Produto/Busca/Carrinho/Pedidos/Perfil/Promoções | Só existe `src/app/[slug]/loading.tsx` (cobre a Home) | Nenhuma das outras 7 rotas tem `loading.tsx` próprio. | Navegar pra essas telas não mostra esqueleto de carregamento — a tela fica "parada" até o servidor responder. |
| M8 | 🟡 MÉDIO | Categoria (link morto) | Bug de plataforma, Next.js 16.3.3 | Confirmado ao vivo: `GET /cida-lanche/categoria/nao-existe` renderiza corretamente a página "não encontrada" do Next, mas retorna **HTTP 200**, não 404 (`notFound()` chamado depois de `await` numa rota dinâmica). Mesmo bug documentado no relatório do Prompt A anterior; não é código deste app. | Crawlers/SEO tratam a página como válida; não corrigível a partir do código da aplicação. |
| M9 | 🟡 MÉDIO | (tema) | `lib/theme.ts` / paleta da Cida Lanche | Calculado: `--muted` (#A1A1AA) sobre `--surface` (#161618) = **7,05:1**, sobre `--bg` (#0B0B0C) = **7,68:1** — passam AA (4,5:1) com folga nos valores padrão atuais. Mas nada no app valida contraste quando o dono troca as cores do tema. | Sem achado nos valores de hoje; risco fica aberto pra qualquer customização futura de tema (não existe guarda-corpo). |
| M10 | 🟡 MÉDIO | Todas | — | **Não verificado**: navegação 100% por teclado (Tab) na Home inteira e visibilidade do anel de foco — este ambiente não tem navegador real pra testar interação de teclado de ponta a ponta. | — |
| Ba1 | ⚪ BAIXO | (código) | `src/components/store/StoreInfoSheet.tsx` | Componente inteiro é código morto — foi substituído por `InfoSheet.tsx` no Prompt 03 e nunca apagado; só aparece citado num comentário do arquivo novo. | Risco de alguém editar o arquivo errado no futuro. |
| Ba2 | ⚪ BAIXO | Painel do dono | `src/app/app/page.tsx:31` (🚀), `src/components/dashboard/Greeting.tsx:40` (👋) | Dois emojis, ambos no painel do dono, não na loja pública. | A regra "zero emoji" foi historicamente combinada como escopo da loja pública; reportando porque o grep pedido cobre `app/` e `components/` inteiros, sem exceção. |
| Ba3 | ⚪ BAIXO | Home/Info | `StoreStatusCountdown.tsx:8` | `const AMBER = "#F59E0B"` hardcoded pro tier "fechando em breve" do cronômetro. | Escolha deliberada (cor universal de alerta, independente da marca da loja) — mas é, ao pé da letra, cor fora do sistema de tema. |
| Ba4 | ⚪ BAIXO | Home | `FlameIcon.tsx:44` | `fill="var(--primary, #FF7A00)"` duplica o laranja padrão que já existe em `globals.css`. | Se o laranja padrão da marca mudar um dia, esse fallback fica desatualizado — duas fontes de verdade pro mesmo valor. |
| Ba5 | ⚪ BAIXO | (código) | `src/components/store/ProductCarousel.tsx` | Marcado `"use client"` sem usar nenhum hook/handler próprio — só repassa props pro `ProductCard` (que já é client). | Poderia voltar a ser Server Component. |
| Ba6 | ⚪ BAIXO | Info | `InfoSheet.tsx:371` | `<img>` cru (não `next/image`) pro preview de mapa estático do Google. | Justificado por comentário (URL externa dinâmica, fora do domínio configurado); na prática é código morto hoje — nenhuma loja tem `NEXT_PUBLIC_STATIC_MAPS_KEY` configurada. |

**Sweeps sem achados** (rodei, não encontrei nada a reportar):
- Rotas/arquivos: todas as 8 rotas do mapa esperado existem, nenhuma órfã, `lib/routes.ts` bate 1:1 com as pastas.
- `tsc --noEmit`, `npm run build`, `npm run lint`: **zero erros, zero warnings** os três (saída completa abaixo).
- `grep` de `100vh`, `: any`/`as any`, `console.log`: zero ocorrências.
- `grep` de `localStorage`: todas as leituras/escritas (`cart/store.ts`, `orders/store.ts`, `profile/store.ts`) estão dentro de `try/catch` — confirmado por leitura direta do código (o grep pedido, `| grep -v "try"`, não prova isso sozinho porque o `try` fica numa linha diferente do `getItem`/`setItem`; verifiquei manualmente).
- RLS: as 12 tabelas de `public` têm `rowsecurity = true`. Nenhuma tabela sem RLS.
- Vazamento de dado de loja inativa/outra loja: testado via REST direto com a chave `anon` em `restaurant_users` e `profiles` — ambas vazias, como esperado (só dono autenticado enxerga).
- `SUPABASE_SERVICE_ROLE_KEY`: zero ocorrências em `src/` ou `next.config.ts`; `.env.local` só tem `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- Formatação de dinheiro: **zero** `toFixed` no projeto; tudo passa por `formatBRL()` (`lib/format.ts`), que usa `toLocaleString('pt-BR', {style:'currency'})` — equivalente a `Intl.NumberFormat`.
- Tipos monetários: `price_cents`/`compare_at_price_cents`/`min_order_cents`/`stock_used`/`stock_limit` são `integer` (centavos); `discount_value`/`free_shipping_min` são `numeric(10,2)` (exceção documentada e intencional, não são `float`).
- Pedido mínimo e frete grátis: mesma coluna (`settings.min_order_cents`, `store.free_shipping_min`) alimenta Home, Carrinho e Sheet de Informações — valores sempre batem entre as três telas.
- Vídeo de capa: `<video>` em `StoreCover.tsx` tem `muted` **e** `playsInline` (linhas 131-133) — autoplay funciona no iPhone.
- Todo `<Image>` do app tem `alt` (vazio `alt=""` nas decorativas — capa, logos pequenos — e com texto real nas informativas — produto, promoção).
- `priority` em `<Image>`: usado só no hero da capa, nos 2 primeiros itens de cada carrossel (`index < 2`) e na imagem única do detalhe do produto — não está espalhado.
- Todo elemento clicável usa `<button type="button">` ou `<a href>` real, ou `<div role="button" tabIndex={0}>` com `onKeyDown` pra Enter/Espaço (padrão usado em `ProductCard`/`ProductListCard`) — nenhum `<div onClick>` "cru" encontrado.
- `w-screen` ou largura fixa >360px causando scroll horizontal: não encontrado (os únicos `w-[…px]` são `max-w-[480px]` combinados com `w-full`, que encolhem normalmente).
- Conteúdo escondido atrás da bottom nav: o container raiz (`[slug]/layout.tsx:37`) tem `pb-24`, suficiente pra cobrir a altura da nav fixa em todas as rotas.

---

## 4. Tabela de botões (Varredura 2, completa)

| Componente | Elemento | Ação encontrada | Status |
|---|---|---|---|
| `StoreHeader.tsx` | Ícone hambúrguer | `onClick={openMenu}` — abre `MenuDrawer` via `?menu=1` | ✅ |
| `StoreHeader.tsx` | Logo | `onClick={handleLogoClick}` — rola pro topo na home, navega pra home nas outras telas | ✅ |
| `StoreHeader.tsx` | Ícone carrinho | `<Link href={routes.cart(slug)}>` + badge com `cart.count` | ✅ |
| `SolidHeader.tsx` | Voltar/hambúrguer | `onClick={onBack ?? openMenu}` | ✅ |
| `SolidHeader.tsx` | Ícone carrinho | `<Link href={routes.cart(slug)}>` + badge | ✅ |
| `StoreStatusBar.tsx` | "Ver informações" | `onClick={openInfo}` | ✅ |
| `MenuSearch.tsx` | Campo de busca | `onChange` com debounce 250ms | ✅ |
| `SearchPageContent.tsx` | Botão limpar busca (X) | `onClick={() => setQuery("")}` | ✅ |
| `StoreHome.tsx` | Botão "Limpar busca" (sem resultado) | `onClick={() => setQuery("")}` | ✅ |
| `CategoryChips.tsx` | Cada chip de categoria (toque curto) | `onTap` → rola até a seção + atualiza hash da URL | ✅ |
| `CategoryChips.tsx` | Cada chip de categoria (toque longo) | `onLongPress` → `router.push(routes.category(...))` | ✅ |
| `CategoryChips.tsx` | Chip "Promoções" | `onSelectPromotions` → rola até o bloco de promoção | ✅ |
| `CategorySection.tsx` / `PromotionBlock.tsx` | "Ver todos"/"Ver todas" de cada seção | `onSeeAllClick` → navega pra `/categoria/[slug]` ou `/promocoes` | ✅ |
| `ProductCard.tsx` / `ProductListCard.tsx` | Card do produto (clique/Enter/Espaço) | `role="button" tabIndex={0}` → navega pro detalhe | ✅ |
| `ProductCard.tsx` / `ProductListCard.tsx` | Botão "+" | Adiciona direto (sem grupo obrigatório) ou navega pro detalhe (com grupo obrigatório) | ✅ funcional, mas ⚠️ ver G1/G2/G8 |
| `FreeShippingBanner.tsx` | Banner de frete grátis | `onClick={openInfo}` | ✅ |
| `PromotionBlock.tsx` / `PromotionCard.tsx` | Bloco/card de promoção | `onClick` → navega pro produto com desconto aplicado | ✅ |
| `ProductDetailContent.tsx` | Botão voltar (header) | `onBack={() => router.back()}` | ✅ |
| — | Botão de compartilhar | **Não existe** em nenhuma tela | ➖ (não implementado — ver seção 6) |
| `ProductDetailContent.tsx` | Cada opção de adicional | `onClick={toggleOption}` — funciona, mas sem `aria-pressed` | ✅ funcional / ⚠️ ver G7 |
| `ProductDetailContent.tsx` | Stepper de quantidade (−/+) | `onClick` com `Math.max(1, q-1)` / `q+1` | ✅ |
| `ProductDetailContent.tsx` | "Adicionar ao carrinho" | `onClick={handleAdd}` — valida grupos obrigatórios, some no `disabled` se esgotado/loja fechada | ✅ |
| `BottomNav.tsx` | Início | `<Link>` real; se já ativo, rola pro topo em vez de navegar | ✅ |
| `BottomNav.tsx` | Pedidos | `<Link href={routes.orders(slug)}>` | ✅ |
| `BottomNav.tsx` | Carrinho | `<Link href={routes.cart(slug)}>` + badge | ✅ |
| `BottomNav.tsx` | Perfil | `<Link href={routes.profile(slug)}>` | ✅ |
| `MenuDrawer.tsx` | Buscar no cardápio | `onClick` → `/busca` | ✅ |
| `MenuDrawer.tsx` | Cardápio / Promoções / Meus pedidos / Carrinho | `onClick` → rota real de cada um | ✅ |
| `MenuDrawer.tsx` | Informações da loja | `onClick` → fecha o drawer, abre o InfoSheet | ✅ |
| `MenuDrawer.tsx` | Formas de pagamento | `onClick` → mesmo destino de "Informações da loja" (abre o sheet inteiro, não rola até a seção de pagamento) | ⚠️ funciona, mas não é específico |
| `MenuDrawer.tsx` | Fale no WhatsApp | `<a href={buildWhatsAppContactUrl(...)}>` real | ✅ |
| `MenuDrawer.tsx` | Cada categoria da lista | `onClick` → `/categoria/[slug]` | ✅ |
| `InfoSheet.tsx` | Fechar (X) | `onClick={onClose}` | ✅ |
| `InfoSheet.tsx` | "Como chegar até nós" | `<a href={buildDirectionsUrl(store)}>` real | ✅ |
| `InfoSheet.tsx` | Ícone de outros mapas | `onClick` → abre `DirectionsSheet` | ✅ |
| `InfoSheet.tsx` | "Copiar endereço" | `onClick={handleCopyAddress}` → `navigator.clipboard.writeText` | ✅ |
| `InfoSheet.tsx` | WhatsApp (contato) | `<a href={buildWhatsAppContactUrl(...)}>` real | ✅ |
| `InfoSheet.tsx` | Ligar | `<a href="tel:...">` real | ✅ |
| `InfoSheet.tsx` | Instagram | `<a href="https://instagram.com/...">` real | ✅ |
| `DirectionsSheet` (em `InfoSheet.tsx`) | Google Maps / Waze / Apple Maps | `<a href>` real em cada um, condicional a ter lat/lng (Waze/Apple) ou plataforma (`Apple Maps` só se `navigator.platform` bate) | ✅ |
| `perfil/page.tsx` | Salvar (perfil) | `onSubmit={handleSubmit}` → `save(form)` | ✅ |
| `perfil/page.tsx` | Informações da loja | `onClick={openInfo}` | ✅ |
| `perfil/page.tsx` | "Fale no WhatsApp" | `href="#"` + `onClick` chama `openInfo()`, **não abre WhatsApp** | ❌ ver G4 |
| `pedidos/page.tsx` | "Pedir de novo" | `onClick={() => handleReorder(order.id)}` → repõe itens no carrinho e navega | ✅ |
| `pedidos/page.tsx` | "Ver cardápio" (vazio) | `onClick` → `/[slug]` | ✅ |
| `carrinho/CartPageContent.tsx` | Stepper de quantidade (−/+) | `onClick={() => cart.updateQuantity(...)}` | ✅ |
| `carrinho/CartPageContent.tsx` | Remover item | `onClick={() => handleRemove(item)}` + toast "Desfazer" | ✅ |
| `carrinho/CartPageContent.tsx` | "Fechar pedido" | `onClick={handleCheckout}` — funciona, mas ver B1 | ✅ funcional / 🔴 ver B1 |
| `carrinho/CartPageContent.tsx` | "Ver cardápio" (vazio) | `onClick` → `/[slug]` | ✅ |
| `categoria/CategoryPageContent.tsx` | Chip de outra categoria | `onClick` → navega direto (sem voltar pra home) | ✅ |
| `categoria/CategoryPageContent.tsx` | Pills de ordenação | `onClick={() => handleSortChange(...)}` | ✅ |

Todos os botões testados têm `type="button"` explícito onde são `<button>` — nenhum `<button>` sem `type` encontrado.

---

## 5. Os 5 primeiros consertos

| # | Conserto | Por quê primeiro | Esforço |
|---|---|---|---|
| 1 | **B1** — revalidar preço no servidor no instante de "Fechar pedido" (não só ao montar a tela) | É o único achado que toca "preço sai errado" — o critério mais crítico da própria escala de gravidade | M |
| 2 | **G1 + G2** — computar `isOpenNow`/`orderingDisabled` em `/categoria/[slug]` e `/busca`, e filtrar `is_available` em `getAllProducts()` | Duas telas inteiras deixam vender fora do horário ou vender item esgotado; mesmo padrão já existe (Home/Detalhe) — é replicar, não inventar | P |
| 3 | **G6** — adicionar `viewportFit: "cover"` no `layout.tsx` raiz (ou no `generateViewport` de cada rota) | Um `export` faltando invalida todo o trabalho de safe-area já feito em 3 componentes | P |
| 4 | **G5** — criar `error.tsx` (pelo menos um genérico em `src/app/error.tsx`, idealmente também em `[slug]/error.tsx` com o tema da loja) | Sem isso, qualquer bug futuro em produção mostra a tela crua do Next pro cliente final | P |
| 5 | **G4** — trocar o `href="#"` do "Fale no WhatsApp" em `perfil/page.tsx` por `buildWhatsAppContactUrl` de verdade | Bug de 5 minutos, mas é o tipo de coisa que mina confiança na primeira vez que alguém clica | P |

(P = pequeno, M = médio, G = grande — nenhum dos 5 primeiros é G.)

---

## 6. O que ainda não existe

Separado de "está com defeito" — isto é funcionalidade planejada que simplesmente não foi construída ainda:

- **Cobrança de taxa de entrega.** O carrinho mostra Subtotal e Total idênticos — nunca houve modelo de dado pra "taxa por bairro" nem "taxa única", então nada é somado. "Tempo estimado" e "Pedido mínimo" existem no Sheet de Informações, mas taxa de entrega em si, não.
- **Botão de compartilhar** (produto ou loja) — citado no prompt, não existe em nenhuma tela.
- **CRUD de promoções no painel** — a tabela, a API e a lógica de validação existem; a tela "Criar promoção do dia" no painel do dono, não.
- **CRUD completo de categorias no painel** — hoje só dá pra editar nome/descrição; criar com ícone/estilo de exibição, reordenar por posição e ocultar não têm UI.
- **Edição de horários com múltiplos turnos no painel** — o formulário atual edita só uma faixa aplicada a todos os dias abertos; a Cida Lanche tem dois turnos numa quinta-feira, mas isso só foi possível via SQL direto no seed.
- **Edição de endereço/lat-lng/CNPJ/razão social no painel** — as colunas existem (adicionadas no Prompt 03), a UI de edição não.
- **Login/conta do cliente** — decisão deliberada de produto (Parte 6 do Prompt 03: "se ainda não houver login, é isso mesmo"), não uma falha.
- **Checkout online/pagamento** — "Fechar pedido" monta uma mensagem e abre o WhatsApp; não existe cobrança, gateway de pagamento nem confirmação automática.
- **Kanban de pedidos / impressão pro dono** — não existe backend de pedidos nenhum ainda, só o histórico local do cliente.
- **PWA** — sem manifest, sem service worker.

---

## Saída completa dos comandos (Varredura 3)

### `npx tsc --noEmit`
```
(saída vazia — exit code 0)
```

### `npm run build`
```
> cardapio-digital@0.1.0 build
> next build

▲ Next.js 16.3.3 (Turbopack)
- Environments: .env.local
✓ Running next.config.ts took 214ms

  Creating an optimized production build ...
✓ Compiled successfully in 10.4s
  Running TypeScript ...
  Finished TypeScript in 3.7s ...
  Collecting page data using 11 workers ...
  Generating static pages using 11 workers (0/11) ...
  Generating static pages using 11 workers (2/11)
  Generating static pages using 11 workers (5/11)
  Generating static pages using 11 workers (8/11)
✓ Generating static pages using 11 workers (11/11) in 605ms
  Finalizing page optimization ...

Route (app)
┌ ○ /
├ ○ /_not-found
├ ƒ /[slug]
├ ƒ /[slug]/busca
├ ƒ /[slug]/carrinho
├ ƒ /[slug]/categoria/[categorySlug]
├ ƒ /[slug]/pedidos
├ ƒ /[slug]/perfil
├ ƒ /[slug]/produto/[productSlug]
├ ƒ /[slug]/promocoes
├ ƒ /app
├ ƒ /app/categorias
├ ƒ /app/configuracoes
├ ƒ /app/horarios
├ ƒ /app/produtos
├ ƒ /app/qrcode
├ ○ /cadastro
└ ○ /login

ƒ Proxy (Middleware)

○  (Static)   prerendered as static content
ƒ  (Dynamic)  server-rendered on demand
```
Nota: o build com Turbopack não imprime a tabela clássica de "First Load JS" por rota que o Next com Webpack mostrava — **não verificado** o tamanho exato em kB do primeiro JS carregado (ver Varredura 9).

### `npm run lint`
```
> cardapio-digital@0.1.0 lint
> eslint

(sem erros, sem warnings)
```

---

## Notas sobre o que não pôde ser verificado

- **Tamanho do primeiro JS carregado (Varredura 9).** Turbopack não imprime a tabela por rota; medir isso direito exigiria abrir o DevTools num navegador real (Network tab) ou configurar `@next/bundle-analyzer`, que não estava instalado. Não chutei um número.
- **Teclado ponta-a-ponta e anel de foco visível (Varredura 10, M10).** Este ambiente não tem navegador real — só consegui confirmar por leitura de código que os elementos são focáveis (`<button>`, `<a>`, `role="button" tabIndex={0}`) e que existem classes `focus-visible:` em alguns inputs, mas não testei a navegação completa por `Tab`.
- **Layout quebrando com teclado virtual aberto (Varredura 8).** Mesmo motivo — precisa de um dispositivo/emulador real.
- **Avisos de hidratação no console do navegador (Varredura 3).** Rodei um servidor de desenvolvimento e visitei todas as rotas — o log do **servidor** ficou limpo (sem `hydrat`/`warn`/`Error`), mas um mismatch de hidratação verdadeiro só aparece no console do **navegador**, que não tenho acesso aqui.
