/**
 * Toda URL de dentro da loja pública nasce aqui — nenhuma string de rota
 * solta pelos componentes. Cada rota real de PARTE 1 do prompt tem um
 * helper; overlays (menu/info) não são rotas, são query params (ver
 * lib/use-overlay-param.ts) então não entram aqui.
 */
export const routes = {
  home: (slug: string) => `/${slug}`,
  category: (slug: string, categorySlug: string) => `/${slug}/categoria/${categorySlug}`,
  promotions: (slug: string) => `/${slug}/promocoes`,
  product: (slug: string, productSlug: string) => `/${slug}/produto/${productSlug}`,
  search: (slug: string, q?: string) =>
    q ? `/${slug}/busca?q=${encodeURIComponent(q)}` : `/${slug}/busca`,
  cart: (slug: string) => `/${slug}/carrinho`,
  orders: (slug: string) => `/${slug}/pedidos`,
  profile: (slug: string) => `/${slug}/perfil`,
} as const;
