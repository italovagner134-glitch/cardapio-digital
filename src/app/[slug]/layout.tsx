import { notFound } from "next/navigation";
import { getStoreBySlug, getStoreCategories } from "@/lib/supabase/store-queries";
import { isOpenNow, getClosingTimeLabel, getLastOrderInstant, getNextOpeningLabel } from "@/lib/business-hours";
import { buildThemeVars } from "@/lib/theme";
import { StoreRefProvider } from "@/lib/store-context";
import { AppShell } from "@/components/store/AppShell";

interface LayoutProps {
  params: Promise<{ slug: string }>;
  children: React.ReactNode;
}

/**
 * Chrome comum de toda rota `/[slug]/*` (Parte 1 do prompt): tema aplicado
 * uma vez no root, StoreRefProvider (id+slug pro carrinho/rotas) e o
 * AppShell (header/bottom nav/overlays). Cada page.tsx só cuida do próprio
 * conteúdo — nenhuma delas precisa re-montar header/nav.
 */
export default async function StoreLayout({ params, children }: LayoutProps) {
  const { slug } = await params;
  const bundle = await getStoreBySlug(slug);

  if (!bundle) {
    notFound();
  }

  const { store, settings, businessHours } = bundle;
  const categories = await getStoreCategories(store.id);

  const isOpen = isOpenNow(businessHours);
  const closingTimeLabel = isOpen ? getClosingTimeLabel(businessHours) : null;
  const nextOpeningLabel = isOpen ? null : getNextOpeningLabel(businessHours);
  const lastOrderAt = getLastOrderInstant(businessHours, store.last_order_offset_min);

  return (
    <div className="min-h-dvh bg-bg text-content" style={buildThemeVars(store)}>
      <div className="relative mx-auto max-w-[480px] border-x border-line pb-24">
        <StoreRefProvider value={{ restaurantId: store.id, slug: store.slug }}>
          <AppShell
            store={store}
            settings={settings}
            businessHours={businessHours}
            categories={categories}
            lastOrderAtISO={lastOrderAt ? lastOrderAt.toISOString() : null}
            closingTimeLabel={closingTimeLabel}
            nextOpeningLabel={nextOpeningLabel}
          >
            {children}
          </AppShell>
        </StoreRefProvider>
      </div>
    </div>
  );
}
