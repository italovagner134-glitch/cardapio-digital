import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { requireRestaurant } from "@/lib/restaurant-context";
import { ProductsManager } from "./ProductsManager";

export const metadata: Metadata = { title: "Produtos — Cardápio Digital" };

export default async function ProdutosPage() {
  const { supabase, restaurant } = await requireRestaurant();

  const [{ data: categories }, { data: products }] = await Promise.all([
    supabase
      .from("categories")
      .select("*")
      .eq("restaurant_id", restaurant.id)
      .order("sort_order", { ascending: true }),
    supabase
      .from("products")
      .select("*")
      .eq("restaurant_id", restaurant.id)
      .order("sort_order", { ascending: true }),
  ]);

  // product_option_groups não tem restaurant_id direto (só product_id) —
  // filtra pelos produtos já carregados.
  const productIds = (products ?? []).map((product) => product.id);

  const { data: optionGroups } =
    productIds.length > 0
      ? await supabase
          .from("product_option_groups")
          .select("*, product_options(*)")
          .in("product_id", productIds)
          .order("sort_order", { ascending: true })
          .order("sort_order", { ascending: true, referencedTable: "product_options" })
      : { data: [] };

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-8">
      <Link
        href="/app"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Voltar
      </Link>

      <h1 className="mt-4 font-heading text-2xl font-semibold text-foreground">Produtos</h1>
      <p className="mt-1 text-sm text-muted-foreground">{restaurant.name}</p>

      <div className="mt-6">
        <ProductsManager
          categories={categories ?? []}
          products={products ?? []}
          optionGroups={optionGroups ?? []}
        />
      </div>
    </div>
  );
}
