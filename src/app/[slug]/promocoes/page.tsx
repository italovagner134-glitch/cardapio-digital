import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getStoreBySlug, getLivePromotions, getAllProducts } from "@/lib/supabase/store-queries";
import { PromotionsPageContent } from "./PromotionsPageContent";
import type { Product } from "@/types/store";

export const revalidate = 60;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const bundle = await getStoreBySlug(slug);
  return { title: bundle ? `Promoções — ${bundle.store.name}` : "Promoções" };
}

export default async function PromotionsPage({ params }: PageProps) {
  const { slug } = await params;
  const bundle = await getStoreBySlug(slug);
  if (!bundle) notFound();

  const [livePromotions, allProducts] = await Promise.all([
    getLivePromotions(bundle.store.id),
    getAllProducts(bundle.store.id),
  ]);

  const productById = new Map<string, Product>(allProducts.map((product) => [product.id, product]));

  const promotions = livePromotions
    .map((promo) => ({ promo, product: promo.product_id ? productById.get(promo.product_id) : undefined }))
    .filter((entry): entry is { promo: typeof entry.promo; product: Product } => !!entry.product);

  return <PromotionsPageContent promotions={promotions} />;
}
