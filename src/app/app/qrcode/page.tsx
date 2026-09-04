import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { requireRestaurant } from "@/lib/restaurant-context";
import { QrCodeManager } from "./QrCodeManager";

export const metadata: Metadata = { title: "QR Code — Cardápio Digital" };

export default async function QrCodePage() {
  const { restaurant } = await requireRestaurant();

  return (
    <div className="mx-auto max-w-md px-4 py-10 sm:px-8">
      <Link
        href="/app"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Voltar
      </Link>

      <h1 className="mt-4 font-heading text-2xl font-semibold text-foreground">QR Code</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Aponte a câmera pra ver o cardápio de {restaurant.name}.
      </p>

      <div className="mt-6">
        <QrCodeManager slug={restaurant.slug} />
      </div>
    </div>
  );
}
