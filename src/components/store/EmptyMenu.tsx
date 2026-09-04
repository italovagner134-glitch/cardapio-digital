import { UtensilsCrossed } from "lucide-react";

export function EmptyMenu() {
  return (
    <div className="flex flex-col items-center gap-3 px-4 py-20 text-center">
      <UtensilsCrossed size={40} className="text-muted" aria-hidden="true" />
      <p className="text-base font-semibold text-content">Cardápio em preparo</p>
      <p className="text-sm text-muted">Este restaurante ainda não publicou seus produtos.</p>
    </div>
  );
}
