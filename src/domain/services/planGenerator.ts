import type {
  Food,
  FoodSubstitution,
  MacroTarget,
  GeneratedPlan,
  MealPlanDay,
  DailyTargetRange,
  DailyTotals,
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

const CATEGORY_NUTRITION_FIELD: Record<
  VarietyCategory,
  "protein100g" | "carbs100g" | "fat100g" | "fiber100g"
> = {
  PROTEIN: "protein100g",
  COMPLEX_CARB: "carbs100g",
  GOOD_FAT: "fat100g",
  FIBER: "fiber100g",
};

const GENERATION_ORDER: VarietyCategory[] = ["PROTEIN", "GOOD_FAT", "FIBER", "COMPLEX_CARB"];

const MAX_GRAMS_PER_ITEM: Record<VarietyCategory, number> = {
  PROTEIN: 300,
  GOOD_FAT: 50,
  FIBER: 250,
  COMPLEX_CARB: 400,
};

const MIN_OPTIONS_PER_CATEGORY = 5;
const MAX_OPTIONS_PER_CATEGORY = 20;

const DAILY_TARGET_MIN_RATIO = 0.85;

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

function grams(nutrientPer100g: number, targetNutrientGrams: number): number {
  if (nutrientPer100g <= 0 || targetNutrientGrams <= 0) return 0;
  return Math.round((targetNutrientGrams / nutrientPer100g) * 100);
}

function buildOption(food: Food, category: VarietyCategory, g: number) {
  const factor = g / 100;
  return {
    foodId: food.id,
    foodName: food.name,
    category,
    grams: g,
    kcal: Math.round(factor * food.nutrition.kcal100g),
    proteinG: Math.round(factor * food.nutrition.protein100g),
    carbsG: Math.round(factor * food.nutrition.carbs100g),
    fatG: Math.round(factor * food.nutrition.fat100g),
    fiberG: Math.round(factor * food.nutrition.fiber100g),
  };
}

function buildMealOptions(
  slotTargets: Record<VarietyCategory, number>,
  pickFood: (category: VarietyCategory) => Food | null
): MealPlanDay["meals"][number]["options"] {
  const remaining: Record<VarietyCategory, number> = { ...slotTargets };
  const options: MealPlanDay["meals"][number]["options"] = [];

  for (const category of GENERATION_ORDER) {
    const food = pickFood(category);
    if (!food) continue;

    const target = Math.max(remaining[category], slotTargets[category] * 0.15);
    const nutritionField = CATEGORY_NUTRITION_FIELD[category];
    const rawGrams = grams(food.nutrition[nutritionField], target);
    const cappedGrams = Math.min(rawGrams, MAX_GRAMS_PER_ITEM[category]);

    const option = buildOption(food, category, cappedGrams);
    options.push(option);

    remaining.PROTEIN -= option.proteinG;
    remaining.COMPLEX_CARB -= option.carbsG;
    remaining.GOOD_FAT -= option.fatG;
    remaining.FIBER -= option.fiberG;
  }

  return options;
}

function buildTargetRange(target: MacroTarget): DailyTargetRange {
  const range = (ideal: number) => ({
    min: Math.round(ideal * DAILY_TARGET_MIN_RATIO),
    ideal,
  });
  return {
    kcal: range(target.kcal),
    proteinG: range(target.proteinG),
    carbsG: range(target.carbsG),
    fatG: range(target.fatG),
    fiberG: range(target.fiberG),
  };
}

function sumDailyTotals(meals: MealPlanDay["meals"]): DailyTotals {
  return meals.reduce(
    (acc, meal) => {
      meal.options.forEach((opt) => {
        acc.kcal += opt.kcal;
        acc.proteinG += opt.proteinG;
        acc.carbsG += opt.carbsG;
        acc.fatG += opt.fatG;
        acc.fiberG += opt.fiberG;
      });
      return acc;
    },
    { kcal: 0, proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0 }
  );
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
    GENERATION_ORDER.map((category) => {
      const ranked = rankFoodsForCategory(pool, category, dietaryProfileSlug, substitutions);
      const desiredSize = clampOptionsCount(optionsPerCategory[category]);
      return [category, createRotator(ranked, desiredSize)];
    })
  ) as Record<VarietyCategory, () => Food | null>;

  const days: MealPlanDay[] = [];

  for (let d = 1; d <= daysCount; d++) {
    const meals = MEAL_SLOTS.map((slot) => {
      const slotShare = SLOT_KCAL_SHARE[slot];
      const slotTargets: Record<VarietyCategory, number> = {
        PROTEIN: macroTarget.proteinG * slotShare,
        COMPLEX_CARB: macroTarget.carbsG * slotShare,
        GOOD_FAT: macroTarget.fatG * slotShare,
        FIBER: macroTarget.fiberG * slotShare,
      };

      const options = buildMealOptions(slotTargets, (category) => rotators[category]());

      return { slot, options };
    });

    days.push({ day: d, totals: sumDailyTotals(meals), meals });
  }

  return { days, macroTarget, targetRange: buildTargetRange(macroTarget) };
}
