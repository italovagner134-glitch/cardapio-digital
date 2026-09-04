import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getStoreBySlug, getProductBySlug, getLivePromotions } from "@/lib/supabase/store-queries";
import { isOpenNow } from "@/lib/business-hours";
import { ProductDetailContent } from "./ProductDetailContent";

export const revalidate = 60;

interface PageProps {
  params: Promise<{ slug: string; productSlug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, productSlug } = await params;
  const bundle = await getStoreBySlug(slug);
  if (!bundle) return {};

  const product = await getProductBySlug(bundle.store.id, productSlug);
  return {
    title: product ? `${product.name} — ${bundle.store.name}` : "Produto",
    description: product?.description ?? undefined,
    openGraph: product?.image_url ? { images: [product.image_url] } : undefined,
  };
}

export default async function ProductPage({ params }: PageProps) {
  const { slug, productSlug } = await params;
  const bundle = await getStoreBySlug(slug);
  if (!bundle) notFound();

  const product = await getProductBySlug(bundle.store.id, productSlug);
  if (!product) notFound();

  const livePromotions = await getLivePromotions(bundle.store.id);
  const promotion = livePromotions.find((promo) => promo.product_id === product.id);
  const orderingDisabled = isOpenNow(bundle.businessHours) === false;

  return <ProductDetailContent product={product} promotion={promotion} orderingDisabled={orderingDisabled} />;
}
