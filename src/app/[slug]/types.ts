import type { Tables } from "@/lib/supabase/types";

export type ProductOptionGroupWithOptions = Tables<"product_option_groups"> & {
  product_options: Tables<"product_options">[];
};

export type ProductWithOptions = Tables<"products"> & {
  product_option_groups: ProductOptionGroupWithOptions[];
};

export function formatBRL(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
