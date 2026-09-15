// M7 — esqueleto do Detalhe do produto.
export default function ProductLoading() {
  return (
    <div>
      <div className="h-16 border-b border-line" />
      <div className="aspect-square w-full animate-pulse bg-surface2" />
      <div className="flex flex-col gap-5 p-4">
        <div className="flex flex-col gap-2">
          <div className="h-6 w-2/3 animate-pulse rounded bg-surface2" />
          <div className="h-4 w-full animate-pulse rounded bg-surface2" />
        </div>
        <div className="h-6 w-24 animate-pulse rounded bg-surface2" />
        <div className="flex flex-col gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-11 animate-pulse rounded-xl bg-surface2" />
          ))}
        </div>
        <div className="h-12 w-full animate-pulse rounded-full bg-surface2" />
      </div>
    </div>
  );
}
