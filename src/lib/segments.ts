import type { CategoryIconKey } from "@/components/store/icons";

/** Precisa bater com o check constraint de `restaurants.segment`. */
export const SEGMENTS = [
  "hamburgueria",
  "pizzaria",
  "acai",
  "japonesa",
  "padaria",
  "lanchonete",
  "generico",
] as const;

export type Segment = (typeof SEGMENTS)[number];

export interface SegmentCategoryTemplate {
  name: string;
  icon: CategoryIconKey;
  style: "list" | "carousel";
}

/**
 * Ponto de partida do cardápio por tipo de negócio — usado no cadastro da
 * loja pra pré-popular categorias (o dono continua livre pra renomear,
 * reordenar, ocultar e criar as dele por cima, ver CategoryChips/Parte 2.3).
 * A UI de onboarding que consome isto ainda não existe — ver TODO no
 * relatório final; isto aqui é só a fonte de dados.
 */
export const SEGMENT_TEMPLATES: Record<Segment, SegmentCategoryTemplate[]> = {
  hamburgueria: [
    { name: "Destaques", icon: "star", style: "carousel" },
    { name: "Artesanais", icon: "burger", style: "list" },
    { name: "Smash", icon: "burger", style: "list" },
    { name: "Combos", icon: "combo", style: "carousel" },
    { name: "Porções", icon: "fries", style: "list" },
    { name: "Bebidas", icon: "drink", style: "list" },
    { name: "Sobremesas", icon: "dessert", style: "list" },
  ],
  pizzaria: [
    { name: "Destaques", icon: "star", style: "carousel" },
    { name: "Pizzas Salgadas", icon: "pizza", style: "list" },
    { name: "Pizzas Doces", icon: "pizza", style: "list" },
    { name: "Bordas Recheadas", icon: "pizza", style: "list" },
    { name: "Bebidas", icon: "drink", style: "list" },
    { name: "Sobremesas", icon: "dessert", style: "list" },
  ],
  acai: [
    { name: "Destaques", icon: "star", style: "carousel" },
    { name: "Copos", icon: "icecream", style: "list" },
    { name: "Tigelas", icon: "icecream", style: "list" },
    { name: "Adicionais", icon: "fries", style: "list" },
    { name: "Bebidas", icon: "drink", style: "list" },
  ],
  japonesa: [
    { name: "Destaques", icon: "star", style: "carousel" },
    { name: "Combinados", icon: "combo", style: "carousel" },
    { name: "Sushis e Sashimis", icon: "utensils", style: "list" },
    { name: "Yakisoba", icon: "utensils", style: "list" },
    { name: "Bebidas", icon: "drink", style: "list" },
    { name: "Sobremesas", icon: "dessert", style: "list" },
  ],
  padaria: [
    { name: "Destaques", icon: "star", style: "carousel" },
    { name: "Pães", icon: "utensils", style: "list" },
    { name: "Salgados", icon: "fries", style: "list" },
    { name: "Doces e Bolos", icon: "dessert", style: "list" },
    { name: "Bebidas", icon: "drink", style: "list" },
  ],
  lanchonete: [
    { name: "Destaques", icon: "star", style: "carousel" },
    { name: "Lanches", icon: "burger", style: "list" },
    { name: "Porções", icon: "fries", style: "list" },
    { name: "Bebidas", icon: "drink", style: "list" },
    { name: "Sobremesas", icon: "dessert", style: "list" },
  ],
  generico: [
    { name: "Destaques", icon: "star", style: "carousel" },
    { name: "Cardápio", icon: "utensils", style: "list" },
    { name: "Bebidas", icon: "drink", style: "list" },
    { name: "Sobremesas", icon: "dessert", style: "list" },
  ],
};
