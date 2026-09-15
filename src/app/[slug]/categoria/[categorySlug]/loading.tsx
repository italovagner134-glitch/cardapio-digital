// M7 — esqueleto da Categoria: régua de chips + barra de ordenação + grid.
export default function CategoryLoading() {
  return (
    <div>
      <div className="h-16 border-b border-line" />
      <div className="flex gap-4 overflow-x-hidden px-4 py-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex shrink-0 flex-col items-center gap-1.5">
            <div className="size-14 animate-pulse rounded-2xl bg-surface2" />
            <div className="h-2.5 w-10 animate-pulse rounded bg-surface2" />
          </div>
        ))}
      </div>
      <div className="flex gap-2 px-4 py-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-7 w-20 animate-pulse rounded-full bg-surface2" />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 px-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="aspect-square animate-pulse rounded-2xl bg-surface2" />
        ))}
      </div>
    </div>
  );
}
