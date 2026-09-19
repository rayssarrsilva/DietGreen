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
// excessivo" na tela — pra proteína/fibra isso na prática quase nunca
// dispara, porque `enforceMacroCeiling` já os mantém sob controle; fica
// como sinalizador visual genérico pra qualquer coisa fora do esperado.
const DAILY_TARGET_EXCESSIVE_RATIO = 1.75;

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
 * Monta as 4 opções de uma refeição em duas etapas:
 *
 * 1. Proteína, gordura e fibra miram a meta de GRAMAS do próprio macro
 *    (não numa fatia de kcal — um alimento pouco concentrado no macro que
 *    representa exigiria uma porção enorme pra bater uma fatia de kcal, e
 *    essa porção enorme traria de brinde uma quantidade grande dos OUTROS
 *    macros também). `macroSlotTargets` já vem como a fatia do que SOBRA
 *    no orçamento do DIA (não uma fração fixa da meta diária original),
 *    então uma refeição que vier depois de outra que passou do esperado
 *    automaticamente recebe menos.
 *
 * 2. Carboidrato fecha a CONTA CALÓRICA da refeição — não uma meta de
 *    gramas de carboidrato. `mealKcalTarget` é a meta calórica desta
 *    refeição (fatia fixa da meta calórica do dia); o carboidrato recebe
 *    exatamente o que falta pra bater esse total, depois de proteína +
 *    gordura + fibra já entrarem. É a mesma lógica que o `macroCalculator`
 *    usa pra meta diária ("carboidrato = calorias restantes"), só que
 *    aplicada por refeição — é isso que garante que o total de kcal do
 *    dia não desabe pra 800-1100kcal quando as outras categorias entregam
 *    menos que o esperado (o carboidrato absorve a diferença).
 *
 * Teto de porção realista (MAX_GRAMS_PER_ITEM) em ambas as etapas: sem
 * isso, um alimento fraco no macro/kcal que precisa cobrir pediria uma
 * porção absurda (300-900g) pra fechar a conta sozinho — melhor a porção
 * ficar plausível e a meta ficar um pouco abaixo do ideal (comunicado pela
 * faixa mínimo-ideal) do que servir uma quantidade irreal de comida.
 *
 * Se o orçamento de proteína/gordura/fibra já foi coberto (por essa mesma
 * refeição ou por uma refeição anterior do dia), a porção pode chegar a 0g
 * — nesse caso o item simplesmente não entra na refeição, em vez de forçar
 * uma porção artificial que só ia empurrar o total pra cima de novo.
 */
function buildMealOptions(
  macroSlotTargets: Record<VarietyCategory, number>,
  mealKcalTarget: number,
  pickFood: (category: VarietyCategory) => Food | null,
  pickLowFiberCarb: () => Food | null
): MealPlanDay["meals"][number]["options"] {
  const remaining: Record<VarietyCategory, number> = { ...macroSlotTargets };
  const options: MealPlanDay["meals"][number]["options"] = [];
  let kcalSoFar = 0;

  for (const category of ["PROTEIN", "GOOD_FAT", "FIBER"] as const) {
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
    kcalSoFar += option.kcal;

    remaining.PROTEIN -= option.proteinG;
    remaining.COMPLEX_CARB -= option.carbsG;
    remaining.GOOD_FAT -= option.fatG;
    remaining.FIBER -= option.fiberG;
  }

  // Carboidrato fecha o que falta de CALORIAS nesta refeição. Se o
  // orçamento de fibra do dia já foi coberto (`remaining.FIBER <= 0` —
  // proteína/gordura/fibra já entregaram o suficiente), prefere um
  // carboidrato de fibra mais baixa, pra não empilhar mais fibra "de
  // brinde" em cima de uma massa grande de grão só porque ele também
  // precisa fechar bastante caloria. Isso protege a fibra SEM reduzir a
  // porção (que reduziria a caloria também) — troca o alimento, não o tamanho.
  const carbTargetKcal = Math.max(mealKcalTarget - kcalSoFar, 0);
  const carbFood = remaining.FIBER <= 0 ? pickLowFiberCarb() : pickFood("COMPLEX_CARB");
  if (carbFood && carbTargetKcal > 0) {
    const rawGrams = grams(carbFood.nutrition.kcal100g, carbTargetKcal);
    const cappedGrams = Math.min(rawGrams, MAX_GRAMS_PER_ITEM.COMPLEX_CARB);
    if (cappedGrams > 0) {
      options.push(buildOption(carbFood, "COMPLEX_CARB", cappedGrams));
    }
  }

  return options;
}

function buildTargetRange(target: MacroTarget): DailyTargetRange {
  const range = (ideal: number) => ({
    min: Math.round(ideal * DAILY_TARGET_MIN_RATIO),
    ideal,
    excessive: Math.round(ideal * DAILY_TARGET_EXCESSIVE_RATIO),
  });
  return {
    kcal: range(target.targetCalories),
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

// Pool de carboidratos ordenado do MENOS fibroso pro mais fibroso — usado
// quando a meta de fibra da refeição já foi coberta por proteína/gordura/
// fibra, pra fechar a conta calórica sem empilhar ainda mais fibra "de
// brinde" (ex.: prefere arroz branco/tapioca a aveia/quinoa nesse caso).
function rankCarbsByFiberAscending(foods: Food[]): Food[] {
  return [...foods]
    .filter((f) => f.category === "COMPLEX_CARB")
    .sort((a, b) => a.nutrition.fiber100g - b.nutrition.fiber100g);
}

function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

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

const HARD_CEILING_RATIO = 1.15;

// Quanto de caloria do DIA a blindagem de proteína/fibra pode "gastar" pra
// cortar o excesso — no máximo 6% do alvo por chamada. Sem esse limite, um
// corte agressivo (pra zerar um excesso grande) podia derrubar o dia pra
// bem menos calorias do que o ideal, recriando o problema de dias de
// 800-1100kcal que motivou trocar o desenho de gramas-por-macro por
// calorias-primeiro. Com o limite, a correção é parcial nesses casos
// raros — melhor um excesso um pouco maior do que uma caloria muito baixa.
const MAX_KCAL_LOSS_RATIO_PER_CEILING = 0.06;

/**
 * Blindagem final pra proteína e fibra: reduz proporcionalmente as
 * categorias que NÃO são a "dona" desse macro sempre que o total do dia
 * passa de `ideal × HARD_CEILING_RATIO` — o excesso "de brinde" vindo de
 * outras categorias é o problema real, não a categoria que existe pra
 * entregar aquele macro.
 *
 * O corte tem um orçamento de caloria (`MAX_KCAL_LOSS_RATIO_PER_CEILING`):
 * se zerar o excesso custaria mais caloria do que isso, a correção fica
 * parcial (chega o mais perto possível do teto dentro do orçamento) em vez
 * de aplicar o corte inteiro. Tentei devolver a caloria cortada pra outro
 * alimento antes, mas isso criava um efeito cascata pior — o alimento
 * escolhido pra receber a caloria de volta podia ser muito concentrado
 * num OUTRO macro (ex.: um óleo quase sem fibra, mas 100% gordura).
 */
function enforceMacroCeiling(
  meals: MealPlanDay["meals"],
  homeCategory: VarietyCategory,
  macroField: "proteinG" | "fiberG",
  ideal: number,
  dailyTargetCalories: number
): void {
  const allOptions = meals.flatMap((m) => m.options);
  const ceiling = ideal * HARD_CEILING_RATIO;

  const total = allOptions.reduce((s, o) => s + o[macroField], 0);
  if (total <= ceiling) return;

  const others = allOptions.filter((o) => o.category !== homeCategory);
  const fromOthers = others.reduce((s, o) => s + o[macroField], 0);
  const fromHome = total - fromOthers;
  if (fromOthers <= 0) return;

  const maxAllowedFromOthers = Math.max(ceiling - fromHome, 0);
  let scale = Math.min(maxAllowedFromOthers / fromOthers, 1);
  if (scale >= 1) return;

  const kcalBefore = others.reduce((s, o) => s + o.kcal, 0);
  const kcalLossAtFullCorrection = kcalBefore * (1 - scale);
  const maxKcalLossAllowed = dailyTargetCalories * MAX_KCAL_LOSS_RATIO_PER_CEILING;

  if (kcalLossAtFullCorrection > maxKcalLossAllowed && kcalBefore > 0) {
    scale = 1 - maxKcalLossAllowed / kcalBefore;
  }

  others.forEach((opt) => rescaleOption(opt, scale));
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

  // Rotator separado pro caso "fibra já coberta" (ver comentário grande em
  // `buildMealOptions`) — mesmo tamanho de variedade escolhido pelo usuário
  // pra COMPLEX_CARB, só que ordenado do menos pro mais fibroso.
  const lowFiberCarbRotator = createRotator(
    rankCarbsByFiberAscending(pool),
    clampOptionsCount(optionsPerCategory.COMPLEX_CARB)
  );

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

      const macroSlotTargets: Record<VarietyCategory, number> = {
        PROTEIN: Math.max(remainingDay.PROTEIN, 0) * shareOfRemaining,
        COMPLEX_CARB: Math.max(remainingDay.COMPLEX_CARB, 0) * shareOfRemaining,
        GOOD_FAT: Math.max(remainingDay.GOOD_FAT, 0) * shareOfRemaining,
        FIBER: Math.max(remainingDay.FIBER, 0) * shareOfRemaining,
      };
      // Meta calórica da refeição: fatia FIXA da meta calórica do dia — é
      // a restrição principal (ver `buildMealOptions`), então não precisa
      // ser "o que sobra" como as metas de macro acima.
      const mealKcalTarget = macroTarget.targetCalories * slotShare;

      const options = buildMealOptions(
        macroSlotTargets,
        mealKcalTarget,
        (category) => rotators[category](),
        () => lowFiberCarbRotator()
      );

      options.forEach((opt) => {
        remainingDay.PROTEIN -= opt.proteinG;
        remainingDay.COMPLEX_CARB -= opt.carbsG;
        remainingDay.GOOD_FAT -= opt.fatG;
        remainingDay.FIBER -= opt.fiberG;
      });
      remainingSlotShare -= slotShare;

      return { slot, options };
    });

    // Blindagem final pra proteína e fibra — ver `enforceMacroCeiling` acima.
    // Não mexe em gordura/carboidrato porque o carboidrato já é a categoria
    // que fecha a conta calórica (não faz sentido limitá-la aqui), e a
    // gordura já tem um teto de porção realista (MAX_GRAMS_PER_ITEM) que
    // cumpre esse papel.
    enforceMacroCeiling(meals, "PROTEIN", "proteinG", macroTarget.proteinG, macroTarget.targetCalories);
    enforceMacroCeiling(meals, "FIBER", "fiberG", macroTarget.fiberG, macroTarget.targetCalories);

    days.push({ day: d, totals: sumDailyTotals(meals), meals });
  }

  return { days, macroTarget, targetRange: buildTargetRange(macroTarget) };
}
