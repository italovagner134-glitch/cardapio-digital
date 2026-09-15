import { z } from "zod";

export const restaurantAddressSchema = z.object({
  addressStreet: z.string().trim().max(160).optional().or(z.literal("")),
  addressNumber: z.string().trim().max(20).optional().or(z.literal("")),
  addressDistrict: z.string().trim().max(80).optional().or(z.literal("")),
  addressCity: z.string().trim().max(80).optional().or(z.literal("")),
  addressState: z.string().trim().max(2).optional().or(z.literal("")),
  addressZip: z.string().trim().max(12).optional().or(z.literal("")),
  addressNote: z.string().trim().max(160).optional().or(z.literal("")),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  cnpj: z.string().trim().max(20).optional().or(z.literal("")),
  legalName: z.string().trim().max(120).optional().or(z.literal("")),
});

export type RestaurantAddressInput = z.infer<typeof restaurantAddressSchema>;
