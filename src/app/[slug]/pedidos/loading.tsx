// M7 — /pedidos é 100% client (histórico vem do localStorage, sem fetch no
// servidor), então este esqueleto raramente chega a aparecer; mantido pela
// mesma convenção das outras rotas caso o JS da página demore a hidratar.
export default function OrdersLoading() {
  return (
    <div>
      <div className="h-16 border-b border-line" />
      <div className="flex flex-col gap-3 p-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-2xl bg-surface2" />
        ))}
      </div>
    </div>
  );
}
