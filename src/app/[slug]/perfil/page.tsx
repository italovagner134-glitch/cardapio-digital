import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getStoreBySlug } from "@/lib/supabase/store-queries";
import { ProfilePageContent } from "./ProfilePageContent";

export const revalidate = 60;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const bundle = await getStoreBySlug(slug);
  return { title: bundle ? `Perfil — ${bundle.store.name}` : "Perfil" };
}

export default async function ProfilePage({ params }: PageProps) {
  const { slug } = await params;
  const bundle = await getStoreBySlug(slug);
  if (!bundle) notFound();

  return <ProfilePageContent storeWhatsapp={bundle.store.whatsapp} />;
}
