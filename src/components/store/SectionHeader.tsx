interface SectionHeaderProps {
  icon: React.ReactNode;
  title: string;
  onSeeAllClick?: () => void;
  /** "Ver todos" (categoria, masculino) por padrão — "Promoções de hoje"
   * (Parte 3.3) precisa de "Ver todas". */
  seeAllLabel?: string;
}

export function SectionHeader({ icon, title, onSeeAllClick, seeAllLabel = "Ver todos" }: SectionHeaderProps) {
  return (
    <div className="mt-6 mb-3 flex items-center justify-between px-4">
      <div className="flex items-center gap-2">
        {icon}
        <h2 className="text-base font-bold text-content">{title}</h2>
      </div>
      {onSeeAllClick && (
        <button
          type="button"
          onClick={onSeeAllClick}
          className="text-[13px] font-semibold text-primary transition-transform duration-150 active:scale-95"
        >
          {seeAllLabel}
        </button>
      )}
    </div>
  );
}
