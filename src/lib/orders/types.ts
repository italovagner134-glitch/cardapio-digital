import type { CartItem } from "@/lib/cart/types";

/**
 * "Pedido" aqui é uma entrega deliberadamente simples (Parte 6 do prompt):
 * não existe backend de pedidos ainda (isso é Fase 3+ — checkout, kanban,
 * pagamento). "Fechar pedido" monta a mensagem pro WhatsApp da loja (o
 * cliente manda de verdade, com uma pessoa do outro lado) e grava uma cópia
 * local só pra popular "Meus pedidos" e o "Pedir de novo" neste aparelho.
 */
export interface Order {
  id: string;
  restaurantId: string;
  createdAt: string;
  items: CartItem[];
  subtotalCents: number;
  status: "enviado";
}
