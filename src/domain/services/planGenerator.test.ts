import { describe, expect, it } from "vitest";
import { generateMealPlan } from "./planGenerator";
import type { Food, MacroTarget, FoodSubstitution } from "@/domain/entities/types";

function makeFood(overrides: Partial<Food> & Pick<Food, "id" | "name" | "category">): Food {
  return {
    slug: overrides.id,
    iconKey: "leaf",
    containsAnimalProduct: false,
    isMeat: false,
    isFish: false,
    isDairy: false,
    isEgg: false,
    highlightMicros: [],
    feasibilityTags: [],
    nutrition: {
      kcal100g: 100,
      protein100g: 5,
      carbs100g: 10,
      fat100g: 2,
      fiber100g: 2,
      sodium100gMg: 10,
      sugar100gG: 1,
    },
    ...overrides,
  };
}

const foods: Food[] = [
  makeFood({ id: "chicken", name: "Chicken breast", category: "PROTEIN", nutrition: { kcal100g: 165, protein100g: 31, carbs100g: 0, fat100g: 3.6, fiber100g: 0, sodium100gMg: 70, sugar100gG: 0 } }),
  makeFood({ id: "tofu", name: "Tofu", category: "PROTEIN", nutrition: { kcal100g: 76, protein100g: 8, carbs100g: 1.9, fat100g: 4.8, fiber100g: 0.3, sodium100gMg: 7, sugar100gG: 0.5 } }),
  makeFood({ id: "lentils", name: "Lentils", category: "PROTEIN", nutrition: { kcal100g: 116, protein100g: 9, carbs100g: 20, fat100g: 0.4, fiber100g: 8, sodium100gMg: 2, sugar100gG: 2 } }),
  makeFood({ id: "rice", name: "White rice", category: "COMPLEX_CARB", nutrition: { kcal100g: 130, protein100g: 2.7, carbs100g: 28, fat100g: 0.3, fiber100g: 0.4, sodium100gMg: 1, sugar100gG: 0 } }),
  makeFood({ id: "potato", name: "Potato", category: "COMPLEX_CARB", nutrition: { kcal100g: 87, protein100g: 1.9, carbs100g: 20, fat100g: 0.1, fiber100g: 1.8, sodium100gMg: 6, sugar100gG: 0.9 } }),
  makeFood({ id: "oats", name: "Oats", category: "COMPLEX_CARB", nutrition: { kcal100g: 389, protein100g: 17, carbs100g: 66, fat100g: 7, fiber100g: 10, sodium100gMg: 2, sugar100gG: 1 } }),
  makeFood({ id: "olive-oil", name: "Olive oil", category: "GOOD_FAT", nutrition: { kcal100g: 884, protein100g: 0, carbs100g: 0, fat100g: 100, fiber100g: 0, sodium100gMg: 0, sugar100gG: 0 } }),
  makeFood({ id: "butter", name: "Butter", category: "GOOD_FAT", nutrition: { kcal100g: 717, protein100g: 0.9, carbs100g: 0.1, fat100g: 81, fiber100g: 0, sodium100gMg: 11, sugar100gG: 0.1 } }),
  makeFood({ id: "almonds", name: "Almonds", category: "GOOD_FAT", nutrition: { kcal100g: 579, protein100g: 21, carbs100g: 22, fat100g: 50, fiber100g: 12, sodium100gMg: 1, sugar100gG: 4 } }),
  makeFood({ id: "broccoli", name: "Broccoli", category: "FIBER", nutrition: { kcal100g: 34, protein100g: 2.8, carbs100g: 7, fat100g: 0.4, fiber100g: 2.6, sodium100gMg: 33, sugar100gG: 1.7 } }),
  makeFood({ id: "lettuce", name: "Lettuce", category: "FIBER", nutrition: { kcal100g: 15, protein100g: 1.4, carbs100g: 2.9, fat100g: 0.2, fiber100g: 1.3, sodium100gMg: 28, sugar100gG: 0.8 } }),
  makeFood({ id: "apple", name: "Apple", category: "FIBER", nutrition: { kcal100g: 52, protein100g: 0.3, carbs100g: 14, fat100g: 0.2, fiber100g: 2.4, sodium100gMg: 1, sugar100gG: 10 } }),
];

const substitutions: FoodSubstitution[] = [];

const target: MacroTarget = {
  maintenanceCalories: 2000,
  targetCalories: 2000,
  calorieAdjustmentPct: 0,
  goalSlug: "manutencao",
  proteinG: 100,
  carbsG: 220,
  fatG: 60,
  fiberG: 30,
};

function generate() {
  return generateMealPlan({
    dietaryProfileSlug: "onivoro",
    macroTarget: target,
    availableFoods: foods,
    substitutions,
    feasibilityFilter: [],
    selectedFoodIds: [],
    daysCount: 1,
    optionsPerCategory: { PROTEIN: 5, COMPLEX_CARB: 5, GOOD_FAT: 5, FIBER: 5 },
  });
}

describe("generateMealPlan", () => {
  it("never collapses a day's calories far below the target", () => {
    for (let i = 0; i < 30; i++) {
      const plan = generate();
      expect(plan.days[0].totals.kcal).toBeGreaterThan(target.targetCalories * 0.7);
    }
  });

  it("never lets a day's protein or fiber run away far past the ideal", () => {
    for (let i = 0; i < 30; i++) {
      const plan = generate();
      expect(plan.days[0].totals.proteinG).toBeLessThan(target.proteinG * 1.4);
      expect(plan.days[0].totals.fiberG).toBeLessThan(target.fiberG * 2.2);
    }
  });

  it("never produces a negative or absurd portion size", () => {
    for (let i = 0; i < 10; i++) {
      const plan = generate();
      plan.days[0].meals.forEach((meal) => {
        meal.options.forEach((option) => {
          expect(option.grams).toBeGreaterThan(0);
          expect(option.grams).toBeLessThan(1000);
        });
      });
    }
  });

  it("builds a min-ideal-excessive range around each macro target", () => {
    const plan = generate();
    expect(plan.targetRange.proteinG.min).toBeLessThan(plan.targetRange.proteinG.ideal);
    expect(plan.targetRange.proteinG.ideal).toBeLessThan(plan.targetRange.proteinG.excessive);
  });
});
