"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MapPin, AtSign, Wallet } from "lucide-react";
import type { Tables } from "@/lib/supabase/types";

const DIAS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

const PAYMENT_LABELS: Record<string, string> = {
  dinheiro: "Dinheiro",
  pix: "Pix",
  cartao_entrega: "Cartão na entrega",
};

interface InfoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  restaurant: Tables<"restaurants">;
  settings: Tables<"restaurant_settings"> | null;
  businessHours: Pick<
    Tables<"business_hours">,
    "day_of_week" | "opens_at" | "closes_at" | "is_closed"
  >[];
}

export function InfoModal({ open, onOpenChange, restaurant, settings, businessHours }: InfoModalProps) {
  const paymentMethods = (settings?.payment_methods as string[] | null) ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{restaurant.name}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-5 text-sm">
          {restaurant.address && (
            <div className="flex gap-2">
              <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              <p>
                {restaurant.address}
                {restaurant.city ? ` — ${restaurant.city}` : ""}
              </p>
            </div>
          )}

          <div>
            <p className="mb-2 font-medium text-card-foreground">Horários</p>
            <ul className="flex flex-col gap-1">
              {DIAS.map((dia, index) => {
                const row = businessHours.find((h) => h.day_of_week === index);
                return (
                  <li key={dia} className="flex justify-between text-muted-foreground">
                    <span>{dia}</span>
                    <span>
                      {!row || row.is_closed || !row.opens_at || !row.closes_at
                        ? "Fechado"
                        : `${row.opens_at.slice(0, 5)} às ${row.closes_at.slice(0, 5)}`}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>

          {paymentMethods.length > 0 && (
            <div className="flex gap-2">
              <Wallet className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              <p>{paymentMethods.map((method) => PAYMENT_LABELS[method] ?? method).join(" · ")}</p>
            </div>
          )}

          {settings?.instagram && (
            <div className="flex gap-2">
              <AtSign className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              <p>{settings.instagram}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
