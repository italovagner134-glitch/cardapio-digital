// M7: sem isto, navegar pra Buscar ficava "parado" até o servidor responder
// (o header/bottom nav já são reais, vêm do AppShell em [slug]/layout.tsx).
export default function SearchLoading() {
  return (
    <div>
      <div className="h-16 border-b border-line" />
      <div className="mx-4 mt-4 h-12 animate-pulse rounded-2xl bg-surface2" />
      <div className="mt-5 grid grid-cols-2 gap-3 px-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="aspect-square animate-pulse rounded-2xl bg-surface2" />
        ))}
      </div>
    </div>
  );
}
