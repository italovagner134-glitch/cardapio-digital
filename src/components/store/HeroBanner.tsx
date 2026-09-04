import Image from "next/image";

interface HeroBannerProps {
  storeName: string;
  coverUrl: string | null;
  logoUrl: string | null;
}

export function HeroBanner({ storeName, coverUrl, logoUrl }: HeroBannerProps) {
  return (
    <div className="relative aspect-[16/10] w-full overflow-hidden bg-surface">
      {coverUrl ? (
        <Image src={coverUrl} alt="" fill priority sizes="480px" className="object-cover" />
      ) : (
        <div className="relative flex size-full items-center justify-center bg-gradient-to-b from-surface to-bg">
          {logoUrl && (
            <Image
              src={logoUrl}
              alt=""
              fill
              className="scale-150 object-contain opacity-[0.06]"
              aria-hidden="true"
            />
          )}
        </div>
      )}

      {/* Vinheta no topo — legibilidade do header sobre a foto. */}
      <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/30 to-transparent" />

      {/* Fusão obrigatória com o fundo da página — a foto "derrete" no --bg. */}
      <div
        className="absolute inset-x-0 bottom-0 h-24"
        style={{ background: "linear-gradient(to top, var(--bg) 0%, transparent 100%)" }}
        aria-hidden="true"
      />

      <span className="sr-only">Capa de {storeName}</span>
    </div>
  );
}
