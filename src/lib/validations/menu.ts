import { z } from "zod";

export const categorySchema = z.object({
  name: z.string().trim().min(2, "Digite o nome da categoria.").max(80),
  description: z.string().trim().max(300).optional().or(z.literal("")),
});

export type CategoryInput = z.infer<typeof categorySchema>;

export const productSchema = z
  .object({
    name: z.string().trim().min(2, "Digite o nome do produto.").max(120),
    description: z.string().trim().max(500).optional().or(z.literal("")),
    priceCents: z.coerce.number().int().min(1, "Informe um preço válido."),
    compareAtPriceCents: z.coerce.number().int().min(1).optional(),
    categoryId: z.string().uuid("Escolha uma categoria."),
    isAvailable: z.boolean(),
    isFeatured: z.boolean(),
  })
  .refine(
    (data) => !data.compareAtPriceCents || data.compareAtPriceCents > data.priceCents,
    {
      message: "O preço \"de\" precisa ser maior que o preço atual.",
      path: ["compareAtPriceCents"],
    },
  );

export type ProductInput = z.infer<typeof productSchema>;

export const optionGroupSchema = z.object({
  name: z.string().trim().min(2, "Digite o nome do grupo.").max(80),
  minSelect: z.coerce.number().int().min(0),
  maxSelect: z.coerce.number().int().min(1),
  isRequired: z.boolean(),
}).refine((data) => data.maxSelect >= data.minSelect, {
  message: "O máximo precisa ser maior ou igual ao mínimo.",
  path: ["maxSelect"],
});

export type OptionGroupInput = z.infer<typeof optionGroupSchema>;

export const optionSchema = z.object({
  name: z.string().trim().min(1, "Digite o nome da opção.").max(80),
  priceCents: z.coerce.number().int().min(0),
});

export type OptionInput = z.infer<typeof optionSchema>;
