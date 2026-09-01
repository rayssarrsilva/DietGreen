import type {
  Food,
  FoodSubstitution,
  MacroTarget,
  GeneratedPlan,
  MealPlanDay,
  FeasibilityTag,
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

export interface PlanGeneratorInput {
  dietaryProfileSlug: string;
  macroTarget: MacroTarget;
  availableFoods: Food[]; 
  substitutions: FoodSubstitution[]; 
  feasibilityFilter: FeasibilityTag[]; 
  selectedFoodIds: string[]; 
  daysCount: number;
  optionsPerMeal: number; 
}

function grams(food: Food, targetKcalForFood: number): number {
  if (food.nutrition.kcal100g <= 0) return 0;
  return Math.round((targetKcalForFood / food.nutrition.kcal100g) * 100);
}

function rankFoodsForCategory(
  foods: Food[],
  category: string,
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

export function generateMealPlan(input: PlanGeneratorInput): GeneratedPlan {
  const {
    macroTarget,
    availableFoods,
    substitutions,
    dietaryProfileSlug,
    feasibilityFilter,
    selectedFoodIds,
    daysCount,
    optionsPerMeal,
  } = input;

  const pool = availableFoods.filter((f) => {
    const isSelected =
      selectedFoodIds.length === 0 || selectedFoodIds.includes(f.id);
    const passesFeasibility =
      feasibilityFilter.length === 0 ||
      f.feasibilityTags.some((t) => feasibilityFilter.includes(t));
    return isSelected && passesFeasibility;
  });

  const categories = [
    "PROTEIN",
    "COMPLEX_CARB",
    "GOOD_FAT",
    "FIBER",
  ] as const;

  const rankedByCategory = Object.fromEntries(
    categories.map((c) => [
      c,
      rankFoodsForCategory(pool, c, dietaryProfileSlug, substitutions),
    ])
  ) as Record<(typeof categories)[number], Food[]>;

  const days: MealPlanDay[] = [];

  for (let d = 1; d <= daysCount; d++) {
    const meals = MEAL_SLOTS.map((slot) => {
      const slotKcal = macroTarget.kcal * SLOT_KCAL_SHARE[slot];

      const proteinKcal = slotKcal * 0.35;
      const carbKcal = slotKcal * 0.4;
      const fatKcal = slotKcal * 0.25;

      const options: MealPlanDay["meals"][number]["options"] = [];

      const proteinFoods = rankedByCategory.PROTEIN.slice(
        0,
        Math.max(optionsPerMeal, 1)
      );
      proteinFoods.forEach((food, idx) => {

        if ((d + MEAL_SLOTS.indexOf(slot) + idx) % proteinFoods.length === idx) {
          const g = grams(food, proteinKcal);
          options.push({
            foodId: food.id,
            foodName: food.name,
            grams: g,
            kcal: Math.round((g / 100) * food.nutrition.kcal100g),
            proteinG: Math.round((g / 100) * food.nutrition.protein100g),
          });
        }
      });

      const carbFood = rankedByCategory.COMPLEX_CARB[
        (d + MEAL_SLOTS.indexOf(slot)) % Math.max(rankedByCategory.COMPLEX_CARB.length, 1)
      ];
      if (carbFood) {
        const g = grams(carbFood, carbKcal);
        options.push({
          foodId: carbFood.id,
          foodName: carbFood.name,
          grams: g,
          kcal: Math.round((g / 100) * carbFood.nutrition.kcal100g),
          proteinG: Math.round((g / 100) * carbFood.nutrition.protein100g),
        });
      }

      const fatFood = rankedByCategory.GOOD_FAT[
        (d + MEAL_SLOTS.indexOf(slot)) % Math.max(rankedByCategory.GOOD_FAT.length, 1)
      ];
      if (fatFood) {
        const g = grams(fatFood, fatKcal);
        options.push({
          foodId: fatFood.id,
          foodName: fatFood.name,
          grams: g,
          kcal: Math.round((g / 100) * fatFood.nutrition.kcal100g),
          proteinG: Math.round((g / 100) * fatFood.nutrition.protein100g),
        });
      }

      return { slot, options };
    });

    days.push({ day: d, meals });
  }

  return { days, macroTarget };
}
