import Image from "next/image";
import { ImageOff } from "lucide-react";
import { formatBRL, type ProductWithOptions } from "./types";

interface ProductCardProps {
  product: ProductWithOptions;
  onSelect: () => void;
}

export function ProductCard({ product, onSelect }: ProductCardProps) {
  const disabled = !product.is_available;

  return (
    <button
      type="button"
      onClick={disabled ? undefined : onSelect}
      disabled={disabled}
      className={`flex w-full items-center gap-3 rounded-xl border border-tinta-900/10 bg-white p-3 text-left transition-colors ${
        disabled ? "cursor-default opacity-50" : "hover:border-pimenta-500/40"
      }`}
    >
      <div className="min-w-0 flex-1">
        <p className="font-medium text-tinta-900">{product.name}</p>
        {product.description && (
          <p className="mt-0.5 line-clamp-2 text-sm text-tinta-900/60">{product.description}</p>
        )}
        <p className="mt-1.5 font-mono text-sm text-tinta-900">
          {product.compare_at_price_cents && (
            <span className="mr-1.5 text-tinta-900/50 line-through">
              {formatBRL(product.compare_at_price_cents)}
            </span>
          )}
          {formatBRL(product.price_cents)}
        </p>
        {disabled && (
          <span className="mt-1 inline-block rounded-full bg-tinta-900/10 px-2 py-0.5 text-xs text-tinta-900/60">
            Esgotado
          </span>
        )}
      </div>

      <div className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-kraft-100">
        {product.image_url ? (
          <Image src={product.image_url} alt={product.name} fill sizes="80px" className="object-cover" />
        ) : (
          <div className="flex size-full items-center justify-center text-tinta-900/30">
            <ImageOff className="size-6" aria-hidden="true" />
          </div>
        )}
      </div>
    </button>
  );
}
