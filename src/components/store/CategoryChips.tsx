"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Tag } from "lucide-react";
import { CATEGORY_ICONS, UtensilsIcon, type CategoryIconKey } from "./icons";
import { useLongPress } from "@/lib/use-long-press";
import { routes } from "@/lib/routes";
import { useStoreRef } from "@/lib/store-context";
import type { Category } from "@/types/store";

/** Sentinela do chip virtual "Promoções" (Parte 3.3) — não existe na tabela
 * categories, então não pode ser um uuid de verdade. */
export const PROMOTIONS_CHIP_KEY = "promotions";

interface CategoryChipsProps {
  categories: Category[];
  activeKey: string | null;
  onSelectCategory: (category: Category) => void;
  hasLivePromotions: boolean;
  onSelectPromotions: () => void;
}

function ChipButton({
  active,
  label,
  icon,
  dot,
  onTap,
  onLongPress,
  chipRef,
}: {
  active: boolean;
  label: string;
  icon: React.ReactNode;
  dot?: boolean;
  onTap: () => void;
  onLongPress?: () => void;
  chipRef: (element: HTMLButtonElement | null) => void;
}) {
  const longPress = useLongPress(onTap, onLongPress ?? onTap);

  return (
    <button
      ref={chipRef}
      type="button"
      {...longPress}
      className="flex shrink-0 snap-start flex-col items-center gap-1.5 transition-transform duration-150 active:scale-95"
    >
      <span
        className="relative flex size-14 items-center justify-center border bg-surface text-primary transition-[border-radius,box-shadow,border-color] duration-[220ms] ease-[cubic-bezier(.4,0,.2,1)]"
        style={{
          borderRadius: active ? "9999px" : "1rem",
          borderWidth: active ? 2 : 1,
          borderColor: active ? "var(--primary)" : "var(--border)",
          boxShadow: active ? "0 0 0 4px color-mix(in srgb, var(--primary) 12%, transparent)" : "none",
        }}
      >
        {icon}
        {dot && (
          <span className="absolute right-0.5 top-0.5 flex size-2.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-60" />
            <span className="relative inline-flex size-2.5 rounded-full bg-primary" />
          </span>
        )}
      </span>
      <span className={`text-[11px] font-medium ${active ? "font-semibold text-primary" : "text-muted"}`}>
        {label}
      </span>
    </button>
  );
}

/**
 * Só renderiza e centraliza os chips. O scroll-spy entre seções (qual
 * categoria está visível enquanto o usuário rola manualmente) é
 * responsabilidade de quem renderiza as seções — este componente não tem
 * acesso a elas, só reage a `activeKey` mudando.
 *
 * Toque curto rola até a seção (via onSelectCategory); toque longo abre a
 * página da categoria (Parte 2.1/2.2) — ver lib/use-long-press.ts.
 */
export function CategoryChips({
  categories,
  activeKey,
  onSelectCategory,
  hasLivePromotions,
  onSelectPromotions,
}: CategoryChipsProps) {
  const router = useRouter();
  const { slug } = useStoreRef();
  const chipRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const stripRef = useRef<HTMLDivElement>(null);

  // Só a régua de chips (eixo horizontal) pode se mover aqui — nunca a
  // página. `scrollIntoView({ block: "nearest" })` parecia inofensivo, mas
  // como a régua é `position: sticky`, o navegador calcula a posição
  // "nearest" a partir do lugar onde o elemento estaria SEM o sticky (perto
  // do topo da página), então ele brigava com o scroll até a seção
  // (StoreHome.handleChipSelect) e puxava a tela de volta pra cima a cada
  // toque. Rolar só `scrollLeft` do próprio container evita tocar no eixo
  // vertical.
  useEffect(() => {
    if (!activeKey) return;
    const strip = stripRef.current;
    const chip = chipRefs.current.get(activeKey);
    if (!strip || !chip) return;

    const target = chip.offsetLeft + chip.offsetWidth / 2 - strip.clientWidth / 2;
    strip.scrollTo({ left: target, behavior: "smooth" });
  }, [activeKey]);

  if (categories.length === 0 && !hasLivePromotions) return null;

  return (
    <div
      ref={stripRef}
      className="sticky top-16 z-30 flex gap-4 overflow-x-auto scrollbar-none bg-bg/95 px-4 py-3 backdrop-blur-md snap-x snap-mandatory"
    >
      {hasLivePromotions && (
        <ChipButton
          active={activeKey === PROMOTIONS_CHIP_KEY}
          label="Promoções"
          icon={<Tag size={22} aria-hidden="true" />}
          dot
          onTap={onSelectPromotions}
          chipRef={(element) => {
            if (element) chipRefs.current.set(PROMOTIONS_CHIP_KEY, element);
            else chipRefs.current.delete(PROMOTIONS_CHIP_KEY);
          }}
        />
      )}

      {categories.map((category) => {
        const Icon = CATEGORY_ICONS[category.icon_key as CategoryIconKey] ?? UtensilsIcon;

        return (
          <ChipButton
            key={category.id}
            active={category.id === activeKey}
            label={category.name}
            icon={<Icon size={24} />}
            onTap={() => onSelectCategory(category)}
            onLongPress={() => router.push(routes.category(slug, category.slug))}
            chipRef={(element) => {
              if (element) chipRefs.current.set(category.id, element);
              else chipRefs.current.delete(category.id);
            }}
          />
        );
      })}
    </div>
  );
}
