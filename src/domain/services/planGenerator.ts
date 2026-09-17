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

// Ordem em que cada refeição é montada: proteína e gordura primeiro (fontes
// mais "limpas", nutricionalmente concentradas), depois a porção de fibra
// (vegetal/fruta — normalmente pouco concentrada, por isso vem antes do
// carboidrato), e o carboidrato por último, absorvendo o que sobrar da meta
// de carboidrato depois de descontar o que as outras 3 já trouxeram de
// brinde. É a mesma lógica que o macroCalculator já usa pra meta diária
// ("carboidrato = o que sobra") — ver nota grande abaixo em `buildMealOptions`.
const GENERATION_ORDER: VarietyCategory[] = ["PROTEIN", "GOOD_FAT", "FIBER", "COMPLEX_CARB"];

// Porção máxima realista (em gramas) de um único alimento numa refeição.
// Sem isso, um alimento pouco concentrado no macro que ele representa (ex.:
// maçã tem só 2,4g de fibra por 100g) precisaria de uma porção absurda
// (300-900g) só pra bater a meta daquele macro sozinho — e de quebra
// arrastava uma quantidade enorme de carboidrato/kcal "de brinde".
const MAX_GRAMS_PER_ITEM: Record<VarietyCategory, number> = {
  PROTEIN: 250,
  GOOD_FAT: 40,
  FIBER: 200,
  COMPLEX_CARB: 350,
};

const MIN_OPTIONS_PER_CATEGORY = 5;
const MAX_OPTIONS_PER_CATEGORY = 20;

// Piso aceitável de cada meta diária, como fração do valor ideal (issue #3):
// em vez de exigir o número exato, a pessoa vê que basta chegar em pelo
// menos 85% do ideal naquele dia.
const DAILY_TARGET_MIN_RATIO = 0.85;

// Teto a partir do qual o total do dia é sinalizado como "potencialmente
// excessivo" na tela — na prática, proteína/gordura/fibra nunca chegam
// perto disso porque `enforceHardCeiling` já impede matematicamente
// (ver abaixo); fica como sinalizador visual pra qualquer coisa que escape
// dessa blindagem.
const DAILY_TARGET_EXCESSIVE_RATIO = 1.75;

// Teto DURO (não uma expectativa, uma garantia): depois de gerado, nenhum
// macro do dia pode passar de 15% acima do ideal calculado pro perfil da
// pessoa. Simétrico ao piso de 85% (DAILY_TARGET_MIN_RATIO) — a faixa
// aceitável é sempre ideal ± 15%. `enforceHardCeiling`, no fim da geração
// do dia, corrige à força qualquer coisa que passe disso, então isso vale
// mesmo se a lógica de distribuição acima tiver algum caso não previsto.
const HARD_CEILING_RATIO = 1.15;

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

/**
 * Monta as 4 opções de uma refeição mirando a meta de GRAMAS de cada macro
 * (não numa fatia de kcal — era isso que causava o descontrole: um alimento
 * pouco concentrado no macro que representava exigia uma porção enorme pra
 * bater a fatia de kcal, e essa porção enorme trazia de brinde uma
 * quantidade grande dos OUTROS macros também, explodindo o total do dia).
 *
 * `slotTargets` já vem calculado por `generateMealPlan` como a fatia do que
 * SOBRA no orçamento do dia — não uma fração fixa da meta diária original —
 * então uma refeição que vier depois de outra que já passou do esperado
 * automaticamente recebe menos.
 *
 * Duas correções entram junto:
 * 1. Desconto residual dentro da própria refeição: proteína e gordura são
 *    resolvidas primeiro; o que elas trazem de carboidrato/fibra "de
 *    brinde" é descontado da meta dessas categorias antes de escolher as
 *    próximas porções. Fibra vem depois e carboidrato por último,
 *    absorvendo o restante — a mesma lógica de "carboidrato é o que sobra"
 *    que o macroCalculator já usa pra meta diária.
 * 2. Teto de porção realista (MAX_GRAMS_PER_ITEM): sem isso, um alimento
 *    fraco no macro (ex.: maçã pra fibra) pediria 300-900g pra fechar a
 *    conta sozinho.
 *
 * Se o orçamento de uma categoria já foi coberto (por essa mesma refeição
 * ou por uma refeição anterior do dia), a porção pode chegar a 0g — nesse
 * caso o item simplesmente não entra na refeição, em vez de forçar uma
 * porção artificial que só ia empurrar o total pra cima de novo.
 */
function buildMealOptions(
  slotTargets: Record<VarietyCategory, number>,
  pickFood: (category: VarietyCategory) => Food | null
): MealPlanDay["meals"][number]["options"] {
  const remaining: Record<VarietyCategory, number> = { ...slotTargets };
  const options: MealPlanDay["meals"][number]["options"] = [];

  for (const category of GENERATION_ORDER) {
    const target = Math.max(remaining[category], 0);
    if (target <= 0) continue;

    const food = pickFood(category);
    if (!food) continue;

    const nutritionField = CATEGORY_NUTRITION_FIELD[category];
    const rawGrams = grams(food.nutrition[nutritionField], target);
    const cappedGrams = Math.min(rawGrams, MAX_GRAMS_PER_ITEM[category]);
    if (cappedGrams <= 0) continue;

    const option = buildOption(food, category, cappedGrams);
    options.push(option);

    // Desconta o que essa porção já trouxe de cada macro da meta das
    // categorias ainda não processadas nesta refeição.
    remaining.PROTEIN -= option.proteinG;
    remaining.COMPLEX_CARB -= option.carbsG;
    remaining.GOOD_FAT -= option.fatG;
    remaining.FIBER -= option.fiberG;
  }

  return options;
}

type MacroField = "proteinG" | "carbsG" | "fatG" | "fiberG";

const CATEGORY_HOME_MACRO: Record<VarietyCategory, MacroField> = {
  PROTEIN: "proteinG",
  COMPLEX_CARB: "carbsG",
  GOOD_FAT: "fatG",
  FIBER: "fiberG",
};

function rescaleOption(
  option: MealPlanDay["meals"][number]["options"][number],
  scale: number
): void {
  option.grams = Math.round(option.grams * scale);
  option.kcal = Math.round(option.kcal * scale);
  option.proteinG = Math.round(option.proteinG * scale);
  option.carbsG = Math.round(option.carbsG * scale);
  option.fatG = Math.round(option.fatG * scale);
  option.fiberG = Math.round(option.fiberG * scale);
}

/**
 * Garantia matemática (não uma expectativa): depois de rodar, o total do
 * DIA inteiro pra `macroField` nunca ultrapassa `ideal × HARD_CEILING_RATIO`
 * — não "na prática", não "nos meus testes", por construção.
 *
 * Como funciona: se o total do dia passou do teto, primeiro reduz
 * proporcionalmente as porções de todas as categorias QUE NÃO SÃO a "dona"
 * desse macro (ex.: pra proteína, mexe em gordura/fibra/carboidrato, não
 * na categoria proteína em si — ela já foi calculada pra bater a meta
 * certinho, então "de brinde" vindo de outro lugar é o problema real). Se
 * mesmo reduzindo essas outras a zero ainda passar do teto (só aconteceria
 * se a própria categoria "dona" já estourasse sozinha, o que não deveria
 * ocorrer dado como ela é calculada, mas fica coberto mesmo assim), reduz
 * a categoria dona também, até bater exatamente no teto.
 */
function enforceHardCeiling(
  meals: MealPlanDay["meals"],
  homeCategory: VarietyCategory,
  ideal: number
): void {
  const macroField = CATEGORY_HOME_MACRO[homeCategory];
  const ceiling = ideal * HARD_CEILING_RATIO;
  const allOptions = meals.flatMap((m) => m.options);

  const total = allOptions.reduce((s, o) => s + o[macroField], 0);
  if (total <= ceiling) return;

  const others = allOptions.filter((o) => o.category !== homeCategory);
  const fromOthers = others.reduce((s, o) => s + o[macroField], 0);
  const fromHome = total - fromOthers;

  if (fromOthers > 0) {
    const maxAllowedFromOthers = Math.max(ceiling - fromHome, 0);
    const scale = Math.min(maxAllowedFromOthers / fromOthers, 1);
    others.forEach((opt) => rescaleOption(opt, scale));
  }

  const totalAfterFirstPass = allOptions.reduce((s, o) => s + o[macroField], 0);
  if (totalAfterFirstPass > ceiling) {
    // Só chega aqui se a própria categoria dona já estourasse o teto
    // sozinha (ou por arredondamento acumulado ficar um pouco acima) —
    // caso raro, mas coberto: reduz ela também. O clamp em 1 aqui é
    // crítico — sem ele, quando `fromHomeNow` é pequeno (ex.: por
    // arredondamento das outras categorias ter deixado só 1-2g de sobra),
    // `ceiling / fromHomeNow` pode passar de 1 e AUMENTAR a porção em vez
    // de reduzir, multiplicando o alimento por 5x, 10x etc.
    const homeOptions = allOptions.filter((o) => o.category === homeCategory);
    const fromHomeNow = homeOptions.reduce((s, o) => s + o[macroField], 0);
    if (fromHomeNow > 0) {
      const scale = Math.min(Math.max(ceiling / fromHomeNow, 0), 1);
      homeOptions.forEach((opt) => rescaleOption(opt, scale));
    }
  }
}

function buildTargetRange(target: MacroTarget): DailyTargetRange {
  const range = (ideal: number) => ({
    min: Math.round(ideal * DAILY_TARGET_MIN_RATIO),
    ideal,
    excessive: Math.round(ideal * DAILY_TARGET_EXCESSIVE_RATIO),
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
    GENERATION_ORDER.map((category) => {
      const ranked = rankFoodsForCategory(pool, category, dietaryProfileSlug, substitutions);
      const desiredSize = clampOptionsCount(optionsPerCategory[category]);
      return [category, createRotator(ranked, desiredSize)];
    })
  ) as Record<VarietyCategory, () => Food | null>;

  const days: MealPlanDay[] = [];

  for (let d = 1; d <= daysCount; d++) {
    // Orçamento do DIA inteiro (não da refeição isolada) — cada refeição
    // desconta daqui o que realmente entregou, então se o almoço passar do
    // esperado, o jantar automaticamente recebe uma fatia menor pro resto
    // do dia se corrigir sozinho, em vez de cada refeição mirar sempre a
    // mesma fatia fixa sem saber o que já foi consumido antes.
    const remainingDay: Record<VarietyCategory, number> = {
      PROTEIN: macroTarget.proteinG,
      COMPLEX_CARB: macroTarget.carbsG,
      GOOD_FAT: macroTarget.fatG,
      FIBER: macroTarget.fiberG,
    };
    let remainingSlotShare = 1;

    const meals = MEAL_SLOTS.map((slot) => {
      const slotShare = SLOT_KCAL_SHARE[slot];
      const shareOfRemaining = remainingSlotShare > 0 ? slotShare / remainingSlotShare : 0;

      const slotTargets: Record<VarietyCategory, number> = {
        PROTEIN: Math.max(remainingDay.PROTEIN, 0) * shareOfRemaining,
        COMPLEX_CARB: Math.max(remainingDay.COMPLEX_CARB, 0) * shareOfRemaining,
        GOOD_FAT: Math.max(remainingDay.GOOD_FAT, 0) * shareOfRemaining,
        FIBER: Math.max(remainingDay.FIBER, 0) * shareOfRemaining,
      };

      const options = buildMealOptions(slotTargets, (category) => rotators[category]());

      options.forEach((opt) => {
        remainingDay.PROTEIN -= opt.proteinG;
        remainingDay.COMPLEX_CARB -= opt.carbsG;
        remainingDay.GOOD_FAT -= opt.fatG;
        remainingDay.FIBER -= opt.fiberG;
      });
      remainingSlotShare -= slotShare;

      return { slot, options };
    });

    // Blindagem final — garantida por construção, não por expectativa: ver
    // `enforceHardCeiling` acima. Roda pras 4 categorias, com prioridade
    // pra proteína e fibra primeiro (as que mais preocupam em excesso).
    enforceHardCeiling(meals, "PROTEIN", macroTarget.proteinG);
    enforceHardCeiling(meals, "FIBER", macroTarget.fiberG);
    enforceHardCeiling(meals, "GOOD_FAT", macroTarget.fatG);
    enforceHardCeiling(meals, "COMPLEX_CARB", macroTarget.carbsG);

    days.push({ day: d, totals: sumDailyTotals(meals), meals });
  }

  return { days, macroTarget, targetRange: buildTargetRange(macroTarget) };
}
