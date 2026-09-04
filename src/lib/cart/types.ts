export interface CartItemSelection {
  groupId: string;
  groupName: string;
  optionId: string;
  optionName: string;
  priceCents: number;
}

export interface CartItem {
  /** Identifica a linha (produto + combinação de opções + observação) — não
   * o produto sozinho, pra "X-Tudo sem cebola" e "X-Tudo com cebola" virarem
   * linhas separadas, mas duas adições idênticas só somem quantidade. */
  lineId: string;
  productId: string;
  productSlug: string;
  name: string;
  imageUrl: string | null;
  quantity: number;
  note: string;
  selections: CartItemSelection[];
  /** Soma dos adicionais selecionados — separado do preço do produto pra dar
   * pra revalidar o preço no servidor (lib/promotions: o desconto incide só
   * sobre o produto, os adicionais somam por cima, sempre no preço cheio). */
  optionsTotalCents: number;
  /** Produto + opções, sem promoção — usado pro "de" riscado. */
  unitBasePriceCents: number;
  /** Preço final da unidade (com promoção aplicada, se houver). */
  unitPriceCents: number;
  promotionId: string | null;
}

export interface CartState {
  restaurantId: string;
  items: CartItem[];
}
