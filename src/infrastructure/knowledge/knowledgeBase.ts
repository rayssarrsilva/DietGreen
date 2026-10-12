import tacoData from "./data/taco.json";
import { KNOWLEDGE_ARTICLES, type KnowledgeArticle } from "./articles";
import {
  SUPPLEMENTAL_FOODS,
  SUPPLEMENTAL_SOURCE,
  SUPPLEMENTAL_UNITS,
  type SupplementalFood,
  type SupplementalNutrient,
} from "./supplementalSources";
import { Bm25Index } from "./textSearch";

export const TACO_SOURCE =
  "TACO — Tabela Brasileira de Composição de Alimentos, 4ª edição revisada e ampliada (NEPA/UNICAMP, 2011); valores por 100 g de parte comestível";

export type TacoNutrient =
  | "kcal"
  | "protein"
  | "lipids"
  | "cholesterol"
  | "carbohydrates"
  | "dietaryFiber"
  | "calcium"
  | "magnesium"
  | "manganese"
  | "phosphorus"
  | "iron"
  | "sodium"
  | "potassium"
  | "copper"
  | "zinc"
  | "rae"
  | "thiamin"
  | "riboflavin"
  | "pyridoxine"
  | "niacin"
  | "vitaminC";

export const TACO_UNITS: Record<TacoNutrient, string> = {
  kcal: "kcal",
  protein: "g",
  lipids: "g",
  cholesterol: "mg",
  carbohydrates: "g",
  dietaryFiber: "g",
  calcium: "mg",
  magnesium: "mg",
  manganese: "mg",
  phosphorus: "mg",
  iron: "mg",
  sodium: "mg",
  potassium: "mg",
  copper: "mg",
  zinc: "mg",
  rae: "µg RAE",
  thiamin: "mg",
  riboflavin: "mg",
  pyridoxine: "mg",
  niacin: "mg",
  vitaminC: "mg",
};

export interface TacoFood {
  id: number;
  name: string;
  category: string;
  per100g: Partial<Record<TacoNutrient, number>>;
}

export type DietFilter = "any" | "vegetarian" | "vegan" | "pescatarian" | "no_red_meat";

const TACO: TacoFood[] = tacoData as TacoFood[];

const ANIMAL_CATEGORIES = new Set(["Carnes e derivados", "Pescados e frutos do mar", "Leite e derivados", "Ovos e derivados"]);
const RED_MEAT_HINT = /(boi|bovin|porco|suin|carneiro|cordeiro|vitela|cabrito|linguica|salame|presunto|mortadela|bacon|toucinho|charque|lombo|picanha|alcatra|costela|cupim|fraldinha|maminha|patinho|acem|musculo|lagarto|contrafile|file mignon|fígado|figado|coracao|lingua|bucho|mocoto|hamburguer)/i;
const POULTRY_HINT = /(frango|galinha|peru|chester|pato|codorna)/i;
const MIXED_ANIMAL_HINT = /(carne|frango|peixe|camarao|atum|sardinha|bacalhau|presunto|ovo|queijo|leite|manteiga|requeijao|creme de leite|bacon|linguica|salsicha|mortadela|iogurte|mel)/i;

function passesDiet(food: TacoFood, diet: DietFilter): boolean {
  if (diet === "any") return true;
  const isMeatCategory = food.category === "Carnes e derivados";
  const isFish = food.category === "Pescados e frutos do mar";
  if (diet === "vegan") {
    if (ANIMAL_CATEGORIES.has(food.category)) return false;
    return !MIXED_ANIMAL_HINT.test(food.name);
  }
  if (diet === "vegetarian") {
    if (isMeatCategory || isFish) return false;
    return !/(carne|frango|peixe|camarao|atum|sardinha|bacalhau|presunto|bacon|linguica|salsicha|mortadela)/i.test(food.name);
  }
  if (diet === "pescatarian") return !isMeatCategory;
  if (diet === "no_red_meat") {
    if (isMeatCategory) return POULTRY_HINT.test(food.name) && !RED_MEAT_HINT.test(food.name);
    return true;
  }
  return true;
}

function supplementalPassesDiet(food: SupplementalFood, diet: DietFilter): boolean {
  if (diet === "any" || diet === "pescatarian" || diet === "no_red_meat") {
    if (diet === "no_red_meat" && /bovin/i.test(food.name)) return false;
    return true;
  }
  if (diet === "vegetarian") return food.diet !== "animal";
  return food.diet === "vegan";
}

const articleIndex = new Bm25Index<KnowledgeArticle>(
  KNOWLEDGE_ARTICLES.map((a) => ({
    item: a,
    fields: [
      { text: a.title, weight: 3 },
      { text: a.tags.join(" "), weight: 3 },
      { text: a.body, weight: 1 },
    ],
  }))
);

const tacoIndex = new Bm25Index<TacoFood>(
  TACO.map((f) => ({ item: f, fields: [{ text: f.name, weight: 2 }, { text: f.category, weight: 1 }] }))
);

const supplementalIndex = new Bm25Index<SupplementalFood>(
  SUPPLEMENTAL_FOODS.map((f) => ({ item: f, fields: [{ text: f.name, weight: 1 }] }))
);

export interface ArticleHit {
  title: string;
  body: string;
  sources: string[];
  reviewedByProfessional: boolean;
}

export function searchArticles(query: string, limit = 3): ArticleHit[] {
  return articleIndex.search(query, limit).map(({ item }) => ({
    title: item.title,
    body: item.body,
    sources: item.sources,
    reviewedByProfessional: Boolean(item.reviewedBy),
  }));
}

function formatTaco(food: TacoFood): string {
  const parts = (Object.keys(food.per100g) as TacoNutrient[]).map(
    (k) => `${k}=${food.per100g[k]}${TACO_UNITS[k] === "kcal" ? "" : TACO_UNITS[k]}`
  );
  return `${food.name} [${food.category}]: ${parts.join(", ")}`;
}

function formatSupplemental(food: SupplementalFood): string {
  const parts = (Object.keys(food.values) as SupplementalNutrient[]).map(
    (k) => `${k}=${food.values[k]}${SUPPLEMENTAL_UNITS[k]}`
  );
  return `${food.name}: ${parts.join(", ")}`;
}

export function lookupFoods(query: string, limit = 6): string {
  const taco = tacoIndex.search(query, limit).map((h) => formatTaco(h.item));
  const extra = supplementalIndex.search(query, 3).map((h) => formatSupplemental(h.item));
  if (taco.length === 0 && extra.length === 0) return "Nenhum alimento encontrado nas tabelas para essa busca.";
  const blocks: string[] = [];
  if (taco.length) blocks.push(`Fonte: ${TACO_SOURCE}\n${taco.join("\n")}`);
  if (extra.length) blocks.push(`Fonte: ${SUPPLEMENTAL_SOURCE}\n${extra.join("\n")}`);
  return blocks.join("\n\n");
}

export const RICH_IN_NUTRIENTS = [
  ...(Object.keys(TACO_UNITS) as TacoNutrient[]),
  ...(Object.keys(SUPPLEMENTAL_UNITS) as SupplementalNutrient[]),
] as const;

export function foodsRichIn(nutrient: string, diet: DietFilter, limit = 10): string {
  const safeLimit = Math.min(Math.max(limit, 3), 15);
  if (nutrient in TACO_UNITS) {
    const key = nutrient as TacoNutrient;
    const ranked = TACO.filter((f) => passesDiet(f, diet) && typeof f.per100g[key] === "number")
      .filter((f) => !/(desidratad|em p[oó]\b|, p[oó]\b|liofilizad|instantane)/i.test(f.name))
      .sort((a, b) => (b.per100g[key] ?? 0) - (a.per100g[key] ?? 0))
      .slice(0, safeLimit);
    return `Fonte: ${TACO_SOURCE}\nMaiores teores de ${nutrient} (${TACO_UNITS[key]} por 100 g), filtro de dieta: ${diet}\n${ranked
      .map((f) => `- ${f.name}: ${f.per100g[key]} ${TACO_UNITS[key]}`)
      .join("\n")}\nObservação: porções usuais diferem de 100 g; temperos e itens consumidos em pequena quantidade aparecem altos por 100 g.`;
  }
  if (nutrient in SUPPLEMENTAL_UNITS) {
    const key = nutrient as SupplementalNutrient;
    const ranked = SUPPLEMENTAL_FOODS.filter((f) => supplementalPassesDiet(f, diet) && typeof f.values[key] === "number")
      .sort((a, b) => (b.values[key] ?? 0) - (a.values[key] ?? 0))
      .slice(0, safeLimit);
    return `Fonte: ${SUPPLEMENTAL_SOURCE}\nMaiores teores de ${nutrient} (${SUPPLEMENTAL_UNITS[key]} por 100 g), filtro de dieta: ${diet}\n${ranked
      .map((f) => `- ${f.name}: ${f.values[key]} ${SUPPLEMENTAL_UNITS[key]}`)
      .join("\n")}`;
  }
  return `Nutriente desconhecido. Use um destes: ${RICH_IN_NUTRIENTS.join(", ")}`;
}

export const KNOWLEDGE_STATS = {
  articles: KNOWLEDGE_ARTICLES.length,
  tacoFoods: TACO.length,
  supplementalFoods: SUPPLEMENTAL_FOODS.length,
};
