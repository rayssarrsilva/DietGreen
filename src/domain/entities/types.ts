export type NutrientCategory =
  | "PROTEIN"
  | "FIBER"
  | "VITAMIN"
  | "MINERAL"
  | "COMPLEX_CARB"
  | "GOOD_FAT";

export type FeasibilityTag =
  | "BAIXO_CUSTO"
  | "MEDIO_CUSTO"
  | "ALTO_CUSTO"
  | "FACIL_DE_ACHAR"
  | "ESPECIALIZADO";

export interface DietaryProfile {
  id: string;
  slug: string;
  name: string;
  shortDesc: string;
  longDesc: string;
  allowsFish: boolean;
  allowsWhiteMeat: boolean;
  allowsRedMeat: boolean;
  allowsDairy: boolean;
  allowsEggs: boolean;
  allowsHoney: boolean;
  sortOrder: number;
}

export interface Goal {
  id: string;
  slug: string;
  name: string;
  shortDesc: string;
  longDesc: string;
  proteinGKgMin: number;
  proteinGKgMax: number;
  calorieAdjustmentPct: number;
  sortOrder: number;
}

export interface FoodNutrition {
  kcal100g: number;
  protein100g: number;
  carbs100g: number;
  fat100g: number;
  fiber100g: number;
  sodium100gMg: number;
  sugar100gG: number;
}

export interface Food {
  id: string;
  slug: string;
  name: string;
  category: NutrientCategory;
  iconKey: string;
  containsAnimalProduct: boolean;
  isMeat: boolean;
  isFish: boolean;
  isDairy: boolean;
  isEgg: boolean;
  nutrition: FoodNutrition;
  highlightMicros: string[];
  feasibilityTags: FeasibilityTag[];
}

export interface FoodSubstitution {
  foodId: string;
  dietaryProfileSlug: string;
  replacesCategory: NutrientCategory;
  efficacyRank: number; 
  rationale: string;
}

export interface MacroTarget {
  kcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
}

export interface MealPlanDay {
  day: number;
  meals: {
    slot: "cafe_da_manha" | "almoco" | "lanche" | "jantar";
    options: {
      foodId: string;
      foodName: string;
      grams: number;
      kcal: number;
      proteinG: number;
    }[];
  }[];
}

export interface GeneratedPlan {
  days: MealPlanDay[];
  macroTarget: MacroTarget;
}
