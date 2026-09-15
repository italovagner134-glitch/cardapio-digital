"use client";

import { useRouter } from "next/navigation";
import { ClipboardList } from "lucide-react";
import { SolidHeader } from "@/components/store/SolidHeader";
import { formatBRL } from "@/lib/format";
import { routes } from "@/lib/routes";
import { useStoreRef } from "@/lib/store-context";
import { useOrders } from "@/lib/orders/use-orders";
import { useCart } from "@/lib/cart/use-cart";

const STATUS_LABEL: Record<string, string> = { enviado: "Enviado pelo WhatsApp" };

function formatOrderDate(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export default function OrdersPage() {
  const router = useRouter();
  const { slug } = useStoreRef();
  const { orders } = useOrders();
  const cart = useCart();

  function handleReorder(orderId: string) {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;
    for (const item of order.items) {
      cart.addItem(item);
    }
    router.push(routes.cart(slug));
  }

  return (
    <div>
      <SolidHeader title="Meus pedidos" />

      {orders.length === 0 ? (
        <div className="flex flex-col items-center gap-3 px-4 py-20 text-center">
          <ClipboardList size={40} className="text-muted" aria-hidden="true" />
          <p className="text-sm text-muted">Você ainda não fez pedidos aqui</p>
          <button
            type="button"
            onClick={() => router.push(routes.home(slug))}
            className="rounded-full border border-line px-4 py-2 text-sm font-medium text-content transition-transform duration-150 active:scale-95"
          >
            Ver cardápio
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3 p-4">
          {orders.map((order) => (
            <div key={order.id} className="rounded-2xl border border-line bg-surface p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted">{formatOrderDate(order.createdAt)}</p>
                <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-semibold text-primary">
                  {STATUS_LABEL[order.status] ?? order.status}
                </span>
              </div>

              <ul className="mt-2 flex flex-col gap-0.5 text-sm text-content">
                {order.items.map((item) => (
                  <li key={item.lineId}>
                    {item.quantity}x {item.name}
                  </li>
                ))}
              </ul>

              <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
                <p className="text-sm font-bold text-content">
                  {formatBRL(order.subtotalCents + (order.deliveryFeeCents ?? 0))}
                </p>
                <button
                  type="button"
                  onClick={() => handleReorder(order.id)}
                  className="rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-content transition-transform duration-150 active:scale-95"
                >
                  Pedir de novo
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
