// Só o miolo da home (hero + status + busca + chips + carrosséis) —
// header/bottom nav/overlays já são reais, vêm do AppShell em
// [slug]/layout.tsx (que resolve antes deste Suspense boundary entrar em
// jogo, já que o fetch dele é o mesmo getStoreBySlug cacheado por página).
export default function StoreLoading() {
  return (
    <div>
      {/* Hero */}
      <div className="aspect-[16/10] w-full animate-pulse bg-surface2" />

      {/* Status bar */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex flex-col gap-2">
          <div className="h-4 w-28 animate-pulse rounded bg-surface2" />
          <div className="h-3 w-20 animate-pulse rounded bg-surface2" />
        </div>
        <div className="h-8 w-32 animate-pulse rounded-full bg-surface2" />
      </div>

      {/* Busca */}
      <div className="mx-4 h-12 animate-pulse rounded-2xl bg-surface2" />

      {/* Chips */}
      <div className="mt-5 flex gap-4 px-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-1.5">
            <div className="size-14 animate-pulse rounded-full bg-surface2" />
            <div className="h-2.5 w-10 animate-pulse rounded bg-surface2" />
          </div>
        ))}
      </div>

      {/* Carrossel 1 */}
      <div className="mt-6 mb-3 h-5 w-32 animate-pulse rounded bg-surface2 mx-4" />
      <div className="flex gap-3 px-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="aspect-square w-[44vw] max-w-[180px] shrink-0 animate-pulse rounded-2xl bg-surface2" />
        ))}
      </div>

      {/* Carrossel 2 */}
      <div className="mt-6 mb-3 h-5 w-40 animate-pulse rounded bg-surface2 mx-4" />
      <div className="flex gap-3 px-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="aspect-square w-[44vw] max-w-[180px] shrink-0 animate-pulse rounded-2xl bg-surface2" />
        ))}
      </div>
    </div>
  );
}
