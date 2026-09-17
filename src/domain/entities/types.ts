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

// Uma faixa aceitável para uma meta diária: "ideal" é o valor calculado pro
// perfil da pessoa, "min" é o piso aceitável caso o cardápio gerado não
// bata o ideal exato naquele dia (issue #3 — mostrar range em vez de número
// rígido), e "excessive" é o teto a partir do qual vale sinalizar que o
// total ficou bem acima do calculado — sem tratar "abaixo do mínimo" como
// deficiência nem "acima do ideal" como automaticamente um problema.
export interface MacroRange {
  min: number;
  ideal: number;
  excessive: number;
}

export interface DailyTargetRange {
  kcal: MacroRange;
  proteinG: MacroRange;
  carbsG: MacroRange;
  fatG: MacroRange;
  fiberG: MacroRange;
}

// Soma real do que o cardápio gerado entrega num dia — usada para comparar
// com o DailyTargetRange e mostrar pra pessoa o que ela vai consumir de fato.
export interface DailyTotals {
  kcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
}

// As 4 categorias de variedade que o usuário controla na etapa de ajustes.
export type VarietyCategory = "PROTEIN" | "COMPLEX_CARB" | "GOOD_FAT" | "FIBER";

// Quantas opções distintas (5 a 20) o usuário quer que entrem no rodízio de
// cada categoria — quanto maior o número, mais variado fica o cardápio.
export type OptionsPerCategory = Record<VarietyCategory, number>;

export interface MealPlanDay {
  day: number;
  totals: DailyTotals;
  meals: {
    slot: "cafe_da_manha" | "almoco" | "lanche" | "jantar";
    options: {
      foodId: string;
      foodName: string;
      category: VarietyCategory;
      grams: number;
      kcal: number;
      proteinG: number;
      carbsG: number;
      fatG: number;
      fiberG: number;
    }[];
  }[];
}

export interface GeneratedPlan {
  days: MealPlanDay[];
  macroTarget: MacroTarget;
  targetRange: DailyTargetRange;
}
