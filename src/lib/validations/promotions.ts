import { z } from "zod";

export const DISCOUNT_TYPES = [
  { value: "percent", label: "Percentual (%)" },
  { value: "fixed", label: "Valor fixo (R$ de desconto)" },
  { value: "price", label: "Preço final (R$)" },
  { value: "none", label: "Sem desconto (só destaque)" },
] as const;

export const promotionSchema = z
  .object({
    productId: z.string().uuid("Escolha um produto."),
    title: z.string().trim().min(2, "Digite um título.").max(100),
    subtitle: z.string().trim().max(140).optional().or(z.literal("")),
    badgeText: z.string().trim().min(1).max(40).default("PROMOÇÃO DO DIA"),
    discountType: z.enum(["percent", "fixed", "price", "none"]),
    discountValue: z.coerce.number().min(0).optional(),
    // Dias da semana em que a promoção vale (0=domingo…6=sábado). Vazio =
    // todo dia — mesmo critério de isPromotionLive() (lib/promotions.ts).
    weekdays: z.array(z.coerce.number().int().min(0).max(6)),
    dailyStart: z.string().trim().optional().or(z.literal("")),
    dailyEnd: z.string().trim().optional().or(z.literal("")),
    startsAt: z.string().trim().optional().or(z.literal("")),
    endsAt: z.string().trim().optional().or(z.literal("")),
    stockLimit: z.coerce.number().int().min(1).optional(),
  })
  .refine((data) => data.discountType === "none" || (data.discountValue != null && data.discountValue > 0), {
    message: "Informe o valor do desconto.",
    path: ["discountValue"],
  })
  .refine((data) => !data.dailyStart || !data.dailyEnd || data.dailyStart !== data.dailyEnd, {
    message: "O horário de início e fim não podem ser iguais.",
    path: ["dailyEnd"],
  });

export type PromotionInput = z.infer<typeof promotionSchema>;
