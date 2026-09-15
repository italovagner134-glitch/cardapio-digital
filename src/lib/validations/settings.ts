import { z } from "zod";

export const PAYMENT_METHODS = [
  { value: "dinheiro", label: "Dinheiro" },
  { value: "pix", label: "Pix" },
  { value: "cartao_entrega", label: "Cartão na entrega" },
] as const;

export const restaurantSettingsSchema = z
  .object({
    acceptsDelivery: z.boolean(),
    acceptsPickup: z.boolean(),
    acceptsDinein: z.boolean(),
    minOrderCents: z.coerce.number().int().min(0),
    deliveryFeeCents: z.coerce.number().int().min(0),
    deliveryTimeMin: z.coerce.number().int().min(0).optional(),
    deliveryTimeMax: z.coerce.number().int().min(0).optional(),
    paymentMethods: z.array(z.enum(["dinheiro", "pix", "cartao_entrega"])),
    pixKey: z.string().trim().max(140).optional().or(z.literal("")),
    instagram: z.string().trim().max(60).optional().or(z.literal("")),
    orderNotice: z.string().trim().max(300).optional().or(z.literal("")),
  })
  .refine(
    (data) => !data.deliveryTimeMin || !data.deliveryTimeMax || data.deliveryTimeMax >= data.deliveryTimeMin,
    { message: "O tempo máximo precisa ser maior ou igual ao mínimo.", path: ["deliveryTimeMax"] },
  )
  .refine((data) => data.acceptsDelivery || data.acceptsPickup || data.acceptsDinein, {
    message: "Aceite ao menos um tipo de pedido (entrega, retirada ou local).",
    path: ["acceptsDelivery"],
  });

export type RestaurantSettingsInput = z.infer<typeof restaurantSettingsSchema>;
