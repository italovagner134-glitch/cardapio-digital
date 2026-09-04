const DIACRITICS_REGEX = new RegExp("[\\u0300-\\u036f]", "g");

/** Normaliza texto pra busca: minúsculas, sem acentos. */
export function normalizeSearch(value: string): string {
  return value.normalize("NFD").replace(DIACRITICS_REGEX, "").toLowerCase();
}

export function matchesSearch(query: string, ...fields: (string | null | undefined)[]): boolean {
  const normalizedQuery = normalizeSearch(query.trim());
  if (!normalizedQuery) return true;
  return fields.some((field) => field && normalizeSearch(field).includes(normalizedQuery));
}
