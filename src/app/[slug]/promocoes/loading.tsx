// M7 — esqueleto de Promoções.
export default function PromotionsLoading() {
  return (
    <div>
      <div className="h-16 border-b border-line" />
      <div className="flex flex-col gap-3 p-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex h-28 gap-3 rounded-2xl border border-line bg-surface p-2">
            <div className="w-[40%] shrink-0 animate-pulse rounded-xl bg-surface2" />
            <div className="flex flex-1 flex-col justify-center gap-2 py-2">
              <div className="h-4 w-3/4 animate-pulse rounded bg-surface2" />
              <div className="h-3 w-1/2 animate-pulse rounded bg-surface2" />
              <div className="h-4 w-1/3 animate-pulse rounded bg-surface2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
