// M7 — esqueleto do Carrinho enquanto getStoreBySlug resolve.
export default function CartLoading() {
  return (
    <div>
      <div className="h-16 border-b border-line" />
      <div className="flex flex-col gap-3 p-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl bg-surface2" />
        ))}
      </div>
      <div className="mx-4 mt-2 h-16 animate-pulse rounded-2xl bg-surface2" />
      <div className="p-4">
        <div className="h-12 w-full animate-pulse rounded-full bg-surface2" />
      </div>
    </div>
  );
}
