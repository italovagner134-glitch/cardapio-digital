import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getStoreBySlug,
  getCategoryBySlug,
  getStoreCategories,
  getCategoryProductsPage,
  getLivePromotions,
} from "@/lib/supabase/store-queries";
import { isOpenNow } from "@/lib/business-hours";
import { CategoryPageContent } from "./CategoryPageContent";

export const revalidate = 60;

interface PageProps {
  params: Promise<{ slug: string; categorySlug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, categorySlug } = await params;
  const bundle = await getStoreBySlug(slug);
  if (!bundle) return {};

  const category = await getCategoryBySlug(bundle.store.id, categorySlug);
  return { title: category ? `${category.name} — ${bundle.store.name}` : "Categoria" };
}

const PAGE_SIZE = 20;

export default async function CategoryPage({ params }: PageProps) {
  const { slug, categorySlug } = await params;
  const bundle = await getStoreBySlug(slug);
  if (!bundle) notFound();

  const category = await getCategoryBySlug(bundle.store.id, categorySlug);
  if (!category) notFound();

  const [{ products, total }, chips, livePromotions] = await Promise.all([
    getCategoryProductsPage(category.id, { sort: "featured", limit: PAGE_SIZE, offset: 0 }),
    getStoreCategories(bundle.store.id),
    getLivePromotions(bundle.store.id),
  ]);

  const promotionByProductId = new Map(
    livePromotions.filter((promo) => promo.product_id).map((promo) => [promo.product_id as string, promo]),
  );
  // Mesmo critério da Home/Detalhe do produto: loja fechada desabilita o
  // "+" (G1 — antes esta tela deixava adicionar com a loja fechada).
  const orderingDisabled = isOpenNow(bundle.businessHours) === false;

  return (
    <CategoryPageContent
      category={category}
      chips={chips}
      initialProducts={products}
      total={total}
      promotionByProductId={promotionByProductId}
      orderingDisabled={orderingDisabled}
    />
  );
}
