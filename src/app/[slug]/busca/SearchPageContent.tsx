"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { SolidHeader } from "@/components/store/SolidHeader";
import { ProductCard } from "@/components/store/ProductCard";
import { matchesSearch } from "@/lib/search";
import type { Product, Promotion } from "@/types/store";

interface SearchPageContentProps {
  allProducts: Product[];
  promotionByProductId: Map<string, Promotion>;
}

export function SearchPageContent({ allProducts, promotionByProductId }: SearchPageContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState(searchParams.get("q") ?? "");

  // Estado dedicado de busca (Parte 1) — chega aqui já com foco pronto pra
  // digitar, seja vindo do drawer ou de um link com ?q=.
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const isSearching = query.trim().length > 0;
  const results = isSearching
    ? allProducts.filter((product) => matchesSearch(query, product.name, product.description))
    : [];

  return (
    <div>
      <SolidHeader title="Buscar" onBack={() => router.back()} />

      <div className="relative mx-4 mt-4">
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar no cardápio"
          aria-label="Buscar no cardápio"
          className="h-12 w-full rounded-2xl border border-line bg-surface px-4 pr-11 text-sm text-content placeholder:text-muted outline-none transition-colors duration-200 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
        />
        {query ? (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label="Limpar busca"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted"
          >
            <X size={18} aria-hidden="true" />
          </button>
        ) : (
          <Search size={18} aria-hidden="true" className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted" />
        )}
      </div>

      {!isSearching ? (
        <p className="px-4 py-16 text-center text-sm text-muted">Digite pra encontrar um item do cardápio.</p>
      ) : results.length === 0 ? (
        <p className="px-4 py-16 text-center text-sm text-muted">Nenhum item encontrado para &ldquo;{query}&rdquo;</p>
      ) : (
        <div className="mt-5 grid grid-cols-2 gap-3 px-4">
          {results.map((product) => (
            <ProductCard key={product.id} product={product} promotion={promotionByProductId.get(product.id)} />
          ))}
        </div>
      )}
    </div>
  );
}
