import type { Tables } from "@/lib/supabase/types";

export type Store = Tables<"restaurants">;

/** Só os campos que `buildThemeVars` precisa — evita acoplar `lib/theme.ts`
 * ao tipo inteiro do restaurante. */
export type StoreTheme = Pick<
  Store,
  "theme_bg" | "theme_surface" | "theme_primary" | "theme_primary_soft" | "theme_text" | "theme_muted" | "theme_success"
>;

export type Category = Tables<"categories">;

export type ProductOption = Tables<"product_options">;

export type ProductOptionGroup = Tables<"product_option_groups"> & {
  product_options: ProductOption[];
};

export type Product = Tables<"products"> & {
  product_option_groups: ProductOptionGroup[];
};

export type BusinessHourRow = Pick<
  Tables<"business_hours">,
  "day_of_week" | "opens_at" | "closes_at" | "is_closed" | "position"
>;

/** M3: `pix_key` fica de fora do tipo público de propósito — a loja pública
 * (getStoreBySlug) nunca lê essa coluna; o dono edita o Pix dele só no
 * painel (app/app/configuracoes), que usa `Tables<"restaurant_settings">`
 * completo, não este tipo. */
export type StoreSettings = Omit<Tables<"restaurant_settings">, "pix_key">;

export type Promotion = Tables<"promotions">;
