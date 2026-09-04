"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";

interface MenuSearchProps {
  /** Query já com debounce de 250ms aplicado. */
  onQueryChange: (query: string) => void;
}

export function MenuSearch({ onQueryChange }: MenuSearchProps) {
  const [value, setValue] = useState("");

  useEffect(() => {
    const timeout = setTimeout(() => onQueryChange(value), 250);
    return () => clearTimeout(timeout);
  }, [value, onQueryChange]);

  return (
    <div className="relative mx-4">
      <input
        type="search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Buscar no cardápio"
        aria-label="Buscar no cardápio"
        className="h-12 w-full rounded-2xl border border-line bg-surface px-4 pr-11 text-sm text-content placeholder:text-muted outline-none transition-colors duration-200 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
      />
      <Search
        size={18}
        aria-hidden="true"
        className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted"
      />
    </div>
  );
}
