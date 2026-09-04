/** Centavos → "R$ 29,90". Único lugar que formata dinheiro na loja pública —
 * estava duplicado em ProductCard/FreeShippingBanner/etc., cada um com sua
 * cópia local; centralizado aqui pra não divergir. */
export function formatBRL(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
