import { z } from "zod";

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

/**
 * Simplificação intencional da Fase 1: um único intervalo por dia da semana
 * (sem separar almoço/jantar). Cobre a maioria dos pequenos restaurantes; a
 * divisão em múltiplos períodos por dia entra em Configurações > Horários
 * numa fase seguinte, sem precisar mudar este contrato.
 */
export const businessHourSchema = z
  .object({
    dayOfWeek: z.number().int().min(0).max(6),
    isClosed: z.boolean(),
    opensAt: z
      .string()
      .regex(TIME_REGEX, "Horário inválido.")
      .optional()
      .or(z.literal("")),
    closesAt: z
      .string()
      .regex(TIME_REGEX, "Horário inválido.")
      .optional()
      .or(z.literal("")),
  })
  .refine(
    (data) =>
      data.isClosed || (!!data.opensAt && !!data.closesAt && data.opensAt < data.closesAt),
    { message: "Informe um horário de abertura antes do de fechamento." },
  );

export type BusinessHourInput = z.infer<typeof businessHourSchema>;

export const restaurantOnboardingSchema = z.object({
  name: z.string().trim().min(2, "Digite o nome do restaurante.").max(80),
  category: z.string().trim().min(2, "Escolha uma categoria.").max(60),
  phone: z.string().trim().min(10, "Digite um telefone válido com DDD.").max(20),
  whatsapp: z.string().trim().min(10, "Digite um WhatsApp válido com DDD.").max(20),
  address: z.string().trim().min(5, "Digite o endereço.").max(160),
  city: z.string().trim().min(2, "Digite a cidade.").max(80),
  businessHours: z.array(businessHourSchema).length(7),
});

export type RestaurantOnboardingInput = z.infer<typeof restaurantOnboardingSchema>;

export const DIAS_DA_SEMANA = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
] as const;

export const CATEGORIAS_RESTAURANTE = [
  "Lanchonete",
  "Hamburgueria",
  "Pizzaria",
  "Açaíteria",
  "Marmitaria",
  "Restaurante",
  "Bar",
  "Cafeteria",
  "Doceria",
  "Food truck",
] as const;
