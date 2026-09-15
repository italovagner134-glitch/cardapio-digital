import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Suspense } from "react";
import { getStoreBySlug, getAllProducts, getLivePromotions } from "@/lib/supabase/store-queries";
import { isOpenNow } from "@/lib/business-hours";
import { SearchPageContent } from "./SearchPageContent";

export const revalidate = 60;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const bundle = await getStoreBySlug(slug);
  return { title: bundle ? `Buscar — ${bundle.store.name}` : "Buscar" };
}

export default async function SearchPage({ params }: PageProps) {
  const { slug } = await params;
  const bundle = await getStoreBySlug(slug);
  if (!bundle) notFound();

  const [allProducts, livePromotions] = await Promise.all([
    getAllProducts(bundle.store.id),
    getLivePromotions(bundle.store.id),
  ]);

  const promotionByProductId = new Map(
    livePromotions.filter((promo) => promo.product_id).map((promo) => [promo.product_id as string, promo]),
  );
  // getAllProducts() traz tudo, disponível ou não — cada tela filtra do seu
  // jeito (Home filtra por categoria, Categoria filtra na query). Busca não
  // filtrava (G2): produto esgotado aparecia pesquisável e "+" habilitado.
  const searchableProducts = allProducts.filter((product) => product.is_available);
  const orderingDisabled = isOpenNow(bundle.businessHours) === false;

  return (
    // useSearchParams (pro ?q= inicial) pede Suspense.
    <Suspense fallback={null}>
      <SearchPageContent
        allProducts={searchableProducts}
        promotionByProductId={promotionByProductId}
        orderingDisabled={orderingDisabled}
      />
    </Suspense>
  );
}
