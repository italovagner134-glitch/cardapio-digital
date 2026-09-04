import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getStoreBySlug } from "@/lib/supabase/store-queries";
import { CartPageContent } from "./CartPageContent";

export const revalidate = 60;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const bundle = await getStoreBySlug(slug);
  return { title: bundle ? `Carrinho — ${bundle.store.name}` : "Carrinho" };
}

export default async function CartPage({ params }: PageProps) {
  const { slug } = await params;
  const bundle = await getStoreBySlug(slug);
  if (!bundle) notFound();

  return (
    <CartPageContent
      storeName={bundle.store.name}
      storeWhatsapp={bundle.store.whatsapp}
      minOrderCents={bundle.settings?.min_order_cents ?? 0}
    />
  );
}
