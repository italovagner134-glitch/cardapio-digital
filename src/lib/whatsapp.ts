import type { CartItem } from "./cart/types";
import type { CustomerProfile } from "./profile/types";

function formatBRL(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/** Aceita o `whatsapp` da loja em qualquer formato digitado no painel
 * ((37) 99999-9999, 37999999999...) e monta a URL wa.me certa. */
function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

export function buildWhatsAppContactUrl(whatsapp: string, message: string): string {
  const digits = onlyDigits(whatsapp);
  const withCountryCode = digits.startsWith("55") ? digits : `55${digits}`;
  return `https://wa.me/${withCountryCode}?text=${encodeURIComponent(message)}`;
}

/**
 * "Fechar pedido" (Parte 6) não tem backend de pedidos nesta fase — a
 * mensagem monta o pedido inteiro (itens, opções, observação, total e os
 * dados salvos em /perfil) e abre o WhatsApp da loja, com uma pessoa de
 * verdade do outro lado pra confirmar. Uma cópia fica salva localmente
 * (lib/orders) só pra "Meus pedidos"/"Pedir de novo" neste aparelho.
 */
export function buildOrderMessage(
  storeName: string,
  items: CartItem[],
  subtotalCents: number,
  profile: CustomerProfile,
  deliveryFeeCents = 0,
): string {
  const lines: string[] = [`Olá! Quero fazer um pedido no *${storeName}*:`, ""];

  for (const item of items) {
    lines.push(`▫️ ${item.quantity}x ${item.name} — ${formatBRL(item.unitPriceCents * item.quantity)}`);
    for (const selection of item.selections) {
      lines.push(`   • ${selection.groupName}: ${selection.optionName}`);
    }
    if (item.note) lines.push(`   Obs: ${item.note}`);
  }

  lines.push("");
  if (deliveryFeeCents > 0) {
    lines.push(
      `Subtotal: ${formatBRL(subtotalCents)}`,
      `Taxa de entrega: ${formatBRL(deliveryFeeCents)}`,
      `Total: ${formatBRL(subtotalCents + deliveryFeeCents)}`,
    );
  } else {
    lines.push(`Total: ${formatBRL(subtotalCents)}`);
  }

  if (profile.name || profile.phone || profile.address) lines.push("");
  if (profile.name) lines.push(`Nome: ${profile.name}`);
  if (profile.phone) lines.push(`Telefone: ${profile.phone}`);
  if (profile.address) lines.push(`Endereço: ${profile.address}`);

  return lines.join("\n");
}
