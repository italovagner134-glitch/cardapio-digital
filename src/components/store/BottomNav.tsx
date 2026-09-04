"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ClipboardList, ShoppingCart, User } from "lucide-react";
import { routes } from "@/lib/routes";
import { useStoreRef } from "@/lib/store-context";
import { useCart } from "@/lib/cart/use-cart";

export function BottomNav() {
  const pathname = usePathname();
  const { slug } = useStoreRef();
  const cart = useCart();

  const items = [
    { key: "inicio", label: "Início", icon: Home, href: routes.home(slug) },
    { key: "pedidos", label: "Pedidos", icon: ClipboardList, href: routes.orders(slug) },
    { key: "carrinho", label: "Carrinho", icon: ShoppingCart, href: routes.cart(slug), badge: cart.count },
    { key: "perfil", label: "Perfil", icon: User, href: routes.profile(slug) },
  ] as const;

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 flex h-16 items-stretch border-t border-line bg-bg/95 backdrop-blur-md"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {items.map((item) => {
        const active = pathname === item.href;
        const Icon = item.icon;

        return (
          <Link
            key={item.key}
            href={item.href}
            aria-label={item.label}
            aria-current={active ? "page" : undefined}
            onClick={(event) => {
              // Já está na home e tocou em "Início" de novo — rola pro topo
              // em vez de navegar pra mesma rota à toa (Parte 6).
              if (item.key === "inicio" && active) {
                event.preventDefault();
                window.scrollTo({ top: 0, behavior: "smooth" });
              }
            }}
            className="relative flex flex-1 flex-col items-center justify-center gap-1"
          >
            {active && <span className="absolute top-0 h-[3px] w-6 rounded-full bg-primary" />}
            <Icon
              size={22}
              className={active ? "text-primary" : "text-muted"}
              fill={active ? "currentColor" : "none"}
              aria-hidden="true"
            />
            <span className={`text-[10px] font-medium ${active ? "text-primary" : "text-muted"}`}>
              {item.label}
            </span>
            {item.key === "carrinho" && item.badge > 0 && (
              <span className="badge-pop absolute right-5 top-1 flex size-[16px] items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-onprimary">
                {item.badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
