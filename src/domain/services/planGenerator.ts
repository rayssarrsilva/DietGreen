import type {
  Food,
  FoodSubstitution,
  MacroTarget,
  GeneratedPlan,
  MealPlanDay,
  FeasibilityTag,
  VarietyCategory,
  OptionsPerCategory,
} from "@/domain/entities/types";

const MEAL_SLOTS: MealPlanDay["meals"][number]["slot"][] = [
  "cafe_da_manha",
  "almoco",
  "lanche",
  "jantar",
];

const SLOT_KCAL_SHARE: Record<string, number> = {
  cafe_da_manha: 0.25,
  almoco: 0.35,
  lanche: 0.15,
  jantar: 0.25,
};

const CATEGORY_KCAL_SHARE: Record<VarietyCategory, number> = {
  PROTEIN: 0.35,
  COMPLEX_CARB: 0.35,
  GOOD_FAT: 0.15,
  FIBER: 0.15,
};

const VARIETY_CATEGORIES: VarietyCategory[] = [
  "PROTEIN",
  "COMPLEX_CARB",
  "GOOD_FAT",
  "FIBER",
];

const MIN_OPTIONS_PER_CATEGORY = 5;
const MAX_OPTIONS_PER_CATEGORY = 20;

export interface PlanGeneratorInput {
  dietaryProfileSlug: string;
  macroTarget: MacroTarget;
  availableFoods: Food[];
  substitutions: FoodSubstitution[];
  feasibilityFilter: FeasibilityTag[];
  selectedFoodIds: string[];
  daysCount: number;
  optionsPerCategory: OptionsPerCategory;
}

function grams(food: Food, targetKcalForFood: number): number {
  if (food.nutrition.kcal100g <= 0) return 0;
  return Math.round((targetKcalForFood / food.nutrition.kcal100g) * 100);
}

function buildOption(food: Food, category: VarietyCategory, targetKcal: number) {
  const g = grams(food, targetKcal);
  return {
    foodId: food.id,
    foodName: food.name,
    category,
    grams: g,
    kcal: Math.round((g / 100) * food.nutrition.kcal100g),
    proteinG: Math.round((g / 100) * food.nutrition.protein100g),
  };
}

function rankFoodsForCategory(
  foods: Food[],
  category: VarietyCategory,
  profileSlug: string,
  substitutions: FoodSubstitution[]
): Food[] {
  const rankMap = new Map<string, number>();
  substitutions
    .filter(
      (s) => s.dietaryProfileSlug === profileSlug && s.replacesCategory === category
    )
    .forEach((s) => rankMap.set(s.foodId, s.efficacyRank));

  return [...foods]
    .filter((f) => f.category === category)
    .sort((a, b) => (rankMap.get(a.id) ?? 999) - (rankMap.get(b.id) ?? 999));
}

function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Cria um "saco embaralhado" para uma categoria: a cada chamada devolve o
 * próximo alimento do pool sem repetir nenhum até que todos os `poolSize`
 * alimentos já tenham saído uma vez. Isso é o que resolve a issue #4 — antes,
 * o rodízio era feito com `(dia + slot) % tamanho`, que repete o mesmo padrão
 * rapidinho quando o pool é pequeno. Agora a repetição só acontece depois de
 * esgotar as `optionsPerCategory` opções escolhidas pelo usuário.
 */
function createRotator(rankedPool: Food[], desiredSize: number): () => Food | null {
  if (rankedPool.length === 0) {
    return () => null;
  }

  const size = Math.min(
    Math.max(desiredSize, MIN_OPTIONS_PER_CATEGORY),
    rankedPool.length
  );
  const pool = rankedPool.slice(0, size);

  let bag: Food[] = [];
  let lastFoodId: string | null = null;

  function refill() {
    bag = shuffle(pool);
    // Evita repetir o mesmo alimento duas vezes seguidas na virada do saco.
    if (lastFoodId && bag.length > 1 && bag[0].id === lastFoodId) {
      [bag[0], bag[1]] = [bag[1], bag[0]];
    }
  }

  return function next(): Food | null {
    if (bag.length === 0) refill();
    const food = bag.shift()!;
    lastFoodId = food.id;
    return food;
  };
}

function clampOptionsCount(value: number): number {
  if (!Number.isFinite(value)) return MIN_OPTIONS_PER_CATEGORY;
  return Math.min(Math.max(Math.round(value), MIN_OPTIONS_PER_CATEGORY), MAX_OPTIONS_PER_CATEGORY);
}

export function generateMealPlan(input: PlanGeneratorInput): GeneratedPlan {
  const {
    macroTarget,
    availableFoods,
    substitutions,
    dietaryProfileSlug,
    feasibilityFilter,
    selectedFoodIds,
    daysCount,
    optionsPerCategory,
  } = input;

  const pool = availableFoods.filter((f) => {
    const isSelected =
      selectedFoodIds.length === 0 || selectedFoodIds.includes(f.id);
    const passesFeasibility =
      feasibilityFilter.length === 0 ||
      f.feasibilityTags.some((t) => feasibilityFilter.includes(t));
    return isSelected && passesFeasibility;
  });

  const rotators = Object.fromEntries(
    VARIETY_CATEGORIES.map((category) => {
      const ranked = rankFoodsForCategory(pool, category, dietaryProfileSlug, substitutions);
      const desiredSize = clampOptionsCount(optionsPerCategory[category]);
      return [category, createRotator(ranked, desiredSize)];
    })
  ) as Record<VarietyCategory, () => Food | null>;

  const days: MealPlanDay[] = [];

  for (let d = 1; d <= daysCount; d++) {
    const meals = MEAL_SLOTS.map((slot) => {
      const slotKcal = macroTarget.kcal * SLOT_KCAL_SHARE[slot];

      const options: MealPlanDay["meals"][number]["options"] = [];

      for (const category of VARIETY_CATEGORIES) {
        const food = rotators[category]();
        if (!food) continue;
        const targetKcal = slotKcal * CATEGORY_KCAL_SHARE[category];
        options.push(buildOption(food, category, targetKcal));
      }

      return { slot, options };
    });

    days.push({ day: d, meals });
  }

  return { days, macroTarget };
}
