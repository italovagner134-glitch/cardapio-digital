const DIACRITICS_REGEX = new RegExp("[\\u0300-\\u036f]", "g");

/** Gera um slug de URL a partir do nome do restaurante (ex: "/r/burger-house"). */
export function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(DIACRITICS_REGEX, "") // remove acentos (marcas diacríticas)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/[\s-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
