// M7 — perfil.tsx agora busca a loja no servidor (só pra pegar o WhatsApp,
// ver ProfilePageContent/G4); este esqueleto cobre essa espera.
export default function ProfileLoading() {
  return (
    <div>
      <div className="h-16 border-b border-line" />
      <div className="flex flex-col gap-4 p-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-1.5">
            <div className="h-3.5 w-16 animate-pulse rounded bg-surface2" />
            <div className="h-11 animate-pulse rounded-xl bg-surface2" />
          </div>
        ))}
        <div className="h-11 animate-pulse rounded-full bg-surface2" />
      </div>
    </div>
  );
}
