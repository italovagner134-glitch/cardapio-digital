import type { Store } from "@/types/store";

type AddressFields = Pick<
  Store,
  "address_street" | "address_number" | "address_district" | "address_city" | "address_state" | "address_zip"
>;

/** true se a loja tem coordenadas OU endereço suficiente pra montar uma
 * rota — usado pra decidir se o card "Como chegar" do InfoSheet renderiza. */
export function hasLocation(store: Pick<Store, "latitude" | "longitude"> & AddressFields): boolean {
  if (store.latitude != null && store.longitude != null) return true;
  return !!(store.address_street && store.address_city);
}

/** "Rua Exemplo, 123" — primeira linha do card de endereço. */
export function formatAddressLine1(store: AddressFields): string {
  if (!store.address_street) return "";
  return store.address_number ? `${store.address_street}, ${store.address_number}` : store.address_street;
}

/** "Centro, Pará de Minas/MG · 35660-000" — segunda linha, em --muted. */
export function formatAddressLine2(store: AddressFields): string {
  const parts: string[] = [];
  const cityState =
    store.address_city && store.address_state
      ? `${store.address_city}/${store.address_state}`
      : store.address_city ?? "";
  if (store.address_district) parts.push(store.address_district);
  if (cityState) parts.push(cityState);
  const line = parts.join(", ");
  return store.address_zip ? [line, store.address_zip].filter(Boolean).join(" · ") : line;
}

/** Endereço completo numa linha só — usado como destino do link de rota
 * quando a loja não tem lat/lng cadastrado, e pro "Copiar endereço". */
export function formatFullAddress(store: AddressFields): string {
  return [formatAddressLine1(store), formatAddressLine2(store)].filter(Boolean).join(" — ");
}

/**
 * Link universal do Google Maps: abre o app nativo no Android/iPhone (e o
 * navegador no desktop) já com a rota traçada a partir da localização atual
 * do cliente, em modo carro — sem o site pedir permissão de GPS, quem
 * calcula a rota é o app de mapas, que já tem essa permissão.
 */
export function buildDirectionsUrl(store: Pick<Store, "latitude" | "longitude"> & AddressFields): string {
  const dest =
    store.latitude != null && store.longitude != null
      ? `${store.latitude},${store.longitude}`
      : encodeURIComponent(formatFullAddress(store));
  return `https://www.google.com/maps/dir/?api=1&destination=${dest}&travelmode=driving`;
}

export function buildWazeUrl(store: Pick<Store, "latitude" | "longitude">): string | null {
  if (store.latitude == null || store.longitude == null) return null;
  return `https://waze.com/ul?ll=${store.latitude},${store.longitude}&navigate=yes`;
}

/** Só faz sentido em iPhone/iPad/Mac — quem chama decide se mostra a opção
 * checando `/iPhone|iPad|Mac/.test(navigator.platform)` antes. */
export function buildAppleMapsUrl(store: Pick<Store, "latitude" | "longitude">): string | null {
  if (store.latitude == null || store.longitude == null) return null;
  return `https://maps.apple.com/?daddr=${store.latitude},${store.longitude}&dirflg=d`;
}
