"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { SolidHeader } from "@/components/store/SolidHeader";
import { formatBRL } from "@/lib/format";
import { routes } from "@/lib/routes";
import { useStoreRef } from "@/lib/store-context";
import { useCart } from "@/lib/cart/use-cart";
import { useOrders } from "@/lib/orders/use-orders";
import { useProfile } from "@/lib/profile/use-profile";
import { buildOrderMessage, buildWhatsAppContactUrl } from "@/lib/whatsapp";
import { checkCartPrices } from "./actions";
import type { CartItem } from "@/lib/cart/types";

interface CartPageContentProps {
  storeName: string;
  storeWhatsapp: string | null;
  minOrderCents: number;
}

const UNDO_MS = 5000;

export function CartPageContent({ storeName, storeWhatsapp, minOrderCents }: CartPageContentProps) {
  const router = useRouter();
  const { restaurantId, slug } = useStoreRef();
  const cart = useCart();
  const orders = useOrders();
  const { profile } = useProfile();

  // Timeout do "Desfazer" de cada linha removida — só precisa ser cancelado
  // se a pessoa clicar em Desfazer antes de expirar, nunca é lido no render,
  // então é ref (não state): guardar isso em state re-renderizaria a tela
  // toda à toa a cada remoção.
  const undoTimeouts = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const revalidated = useRef(false);

  // Revalida preço/disponibilidade no servidor uma vez ao entrar no
  // carrinho (não a cada render) — critério de aceite: "revalidado no
  // servidor". Ajuste de estado feito fora de efeito quando possível já é a
  // convenção do projeto; aqui o dado vem de fora (rede), então é
  // exatamente o caso de usar efeito mesmo, mas só dispara uma vez.
  useEffect(() => {
    if (revalidated.current || cart.items.length === 0) return;
    revalidated.current = true;

    const productIds = cart.items.map((item) => item.productId);
    checkCartPrices(restaurantId, productIds).then((checks) => {
      const byId = new Map(checks.map((check) => [check.productId, check]));
      let changed = false;

      for (const item of cart.items) {
        const check = byId.get(item.productId);
        if (!check || !check.exists || !check.available) {
          cart.removeItem(item.lineId);
          changed = true;
          continue;
        }
        const newUnitPrice = check.currentProductPriceCents + item.optionsTotalCents;
        if (newUnitPrice !== item.unitPriceCents || check.currentPromotionId !== item.promotionId) {
          cart.updateQuantity(item.lineId, 0);
          cart.addItem({ ...item, unitPriceCents: newUnitPrice, promotionId: check.currentPromotionId });
          changed = true;
        }
      }

      if (changed) toast("Alguns preços foram atualizados", { description: "Confira o carrinho antes de fechar o pedido." });
    });
  }, [cart, restaurantId]);

  function handleRemove(item: CartItem) {
    cart.removeItem(item.lineId);
    const timeout = setTimeout(() => undoTimeouts.current.delete(item.lineId), UNDO_MS);
    undoTimeouts.current.set(item.lineId, timeout);

    toast(`${item.name} removido`, {
      action: {
        label: "Desfazer",
        onClick: () => {
          clearTimeout(undoTimeouts.current.get(item.lineId));
          undoTimeouts.current.delete(item.lineId);
          cart.restoreItem(item);
        },
      },
    });
  }

  function handleCheckout() {
    if (cart.items.length === 0) return;

    if (!storeWhatsapp) {
      toast.error("Loja sem WhatsApp cadastrado para receber pedidos.");
      return;
    }

    const message = buildOrderMessage(storeName, cart.items, cart.subtotalCents, profile);
    orders.save({ items: cart.items, subtotalCents: cart.subtotalCents });
    cart.clear();
    window.open(buildWhatsAppContactUrl(storeWhatsapp, message), "_blank", "noopener,noreferrer");
    router.push(routes.orders(slug));
  }

  const belowMinOrder = minOrderCents > 0 && cart.subtotalCents < minOrderCents;

  return (
    <div>
      <SolidHeader title="Carrinho" onBack={() => router.back()} />

      {cart.items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 px-4 py-20 text-center">
          <ShoppingCart size={40} className="text-muted" aria-hidden="true" />
          <p className="text-sm text-muted">Seu carrinho está vazio</p>
          <button
            type="button"
            onClick={() => router.push(routes.home(slug))}
            className="rounded-full border border-line px-4 py-2 text-sm font-medium text-content transition-transform duration-150 active:scale-95"
          >
            Ver cardápio
          </button>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-3 p-4">
            {cart.items.map((item) => (
              <div key={item.lineId} className="flex gap-3 rounded-2xl border border-line bg-surface p-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-content">{item.name}</p>
                  {item.selections.length > 0 && (
                    <p className="mt-0.5 line-clamp-2 text-xs text-muted">
                      {item.selections.map((s) => s.optionName).join(", ")}
                    </p>
                  )}
                  {item.note && <p className="mt-0.5 text-xs italic text-muted">Obs: {item.note}</p>}

                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => cart.updateQuantity(item.lineId, item.quantity - 1)}
                        aria-label="Diminuir quantidade"
                        className="flex size-7 items-center justify-center rounded-full border border-line text-content"
                      >
                        <Minus size={14} aria-hidden="true" />
                      </button>
                      <span className="w-5 text-center text-sm font-semibold text-content">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => cart.updateQuantity(item.lineId, item.quantity + 1)}
                        aria-label="Aumentar quantidade"
                        className="flex size-7 items-center justify-center rounded-full border border-line text-content"
                      >
                        <Plus size={14} aria-hidden="true" />
                      </button>
                    </div>
                    <p className="text-sm font-bold text-primary">{formatBRL(item.unitPriceCents * item.quantity)}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemove(item)}
                  aria-label={`Remover ${item.name}`}
                  className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted transition-transform duration-150 active:scale-90"
                >
                  <Trash2 size={16} aria-hidden="true" />
                </button>
              </div>
            ))}
          </div>

          <div className="mx-4 flex flex-col gap-1.5 border-t border-line pt-4 text-sm">
            <div className="flex justify-between text-muted">
              <span>Subtotal</span>
              <span>{formatBRL(cart.subtotalCents)}</span>
            </div>
            <div className="flex justify-between text-base font-bold text-content">
              <span>Total</span>
              <span>{formatBRL(cart.subtotalCents)}</span>
            </div>
          </div>

          {belowMinOrder && (
            <p className="mx-4 mt-2 text-xs text-muted">
              Pedido mínimo de {formatBRL(minOrderCents)} — faltam {formatBRL(minOrderCents - cart.subtotalCents)}.
            </p>
          )}

          <div className="p-4">
            <button
              type="button"
              onClick={handleCheckout}
              disabled={belowMinOrder}
              className="flex h-12 w-full items-center justify-center rounded-full bg-primary text-sm font-bold text-onprimary transition-transform duration-150 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Fechar pedido
            </button>
            <p className="mt-2 text-center text-[11px] text-muted">
              O pedido é enviado pelo WhatsApp da loja — sem checkout online nesta fase.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
