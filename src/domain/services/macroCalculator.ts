import type { Goal, MacroTarget } from "@/domain/entities/types";

// Nível de atividade do dia a dia, SEM contar os treinos — os treinos entram
// à parte, pela frequência/duração/intensidade informadas (ver TRAINING_MET
// abaixo). Separar os dois evita contar a mesma coisa duas vezes, que era o
// problema do modelo antigo: uma pessoa sedentária que treina 2x/semana
// virava "moderado" e o TDEE era calculado como se ela treinasse quase
// todo dia, inflando a meta de calorias e, em cascata, proteína/fibra.
export type DailyActivityLevel = "sedentaria" | "pouco_ativa" | "ativa";

export type TrainingIntensity = "leve" | "moderada" | "intensa";

const BASELINE_ACTIVITY_MULTIPLIER: Record<DailyActivityLevel, number> = {
  sedentaria: 1.2,
  pouco_ativa: 1.3,
  ativa: 1.45,
};

// Pontuação de 0 a 1 usada só pra POSICIONAR a proteína dentro da faixa
// g/kg de cada objetivo (ver `activityScore` abaixo) — quanto mais ativa a
// pessoa (fora da academia + volume de treino), mais perto do topo da
// faixa do objetivo. Ex.: sedentária sem treino fica perto do mínimo da
// faixa; alguém ativa treinando bastante fica perto do máximo.
const DAILY_ACTIVITY_SCORE: Record<DailyActivityLevel, number> = {
  sedentaria: 0,
  pouco_ativa: 0.4,
  ativa: 0.7,
};

// Volume de treino (min/semana) a partir do qual a pontuação de treino
// satura em 1 — 300 min/semana (ex.: 5x60min) já é um volume considerável.
const TRAINING_VOLUME_FOR_MAX_SCORE_MIN = 300;

// MET (Metabolic Equivalent of Task) aproximado por intensidade de treino de
// força, com base no Compendium of Physical Activities: treino leve a
// moderado ~3.5 MET, moderado ~5 MET, vigoroso ~7 MET.
const TRAINING_MET: Record<TrainingIntensity, number> = {
  leve: 3.5,
  moderada: 5,
  intensa: 7,
};

// Classificação por passos médios diários (Tudor-Locke & Bassett, 2004),
// usada só quando a pessoa informa a média de passos — é um dado mais
// objetivo do que a autoavaliação de "sedentária/pouco ativa/ativa".
function activityFromSteps(steps: number): DailyActivityLevel {
  if (steps < 5000) return "sedentaria";
  if (steps < 7500) return "pouco_ativa";
  return "ativa";
}

/**
 * Combina atividade do dia a dia + volume de treino numa pontuação 0–1,
 * usada pra posicionar a proteína dentro da faixa g/kg do objetivo (ver
 * `calculateMacroTarget`). 0 = sedentária e sem treino → fica no piso da
 * faixa do objetivo; 1 = ativa e com bastante volume de treino → fica no
 * topo da faixa.
 */
function activityScore(bio: UserBiometrics): number {
  const dailyActivityLevel = bio.avgDailySteps
    ? activityFromSteps(bio.avgDailySteps)
    : bio.dailyActivityLevel;
  const baseScore = DAILY_ACTIVITY_SCORE[dailyActivityLevel];

  const weeklyTrainingMin = bio.trainingSessionsPerWeek * bio.trainingSessionDurationMin;
  const trainingScore =
    Math.min(weeklyTrainingMin / TRAINING_VOLUME_FOR_MAX_SCORE_MIN, 1) * 0.3;

  return Math.min(baseScore + trainingScore, 1);
}

export interface UserBiometrics {
  weightKg: number;
  heightCm: number;
  age: number;
  sex: "M" | "F" | "outro";
  /** Atividade fora da academia — não inclui os treinos. */
  dailyActivityLevel: DailyActivityLevel;
  trainingSessionsPerWeek: number;
  trainingSessionDurationMin: number;
  trainingIntensity: TrainingIntensity;
  /** Opcional — ainda não entra na conta de calorias, é guardado para uso futuro. */
  desiredWeightKg?: number;
  /** Opcional — se informado, substitui dailyActivityLevel por uma classificação mais objetiva. */
  avgDailySteps?: number;
}

export function calculateBMR(bio: UserBiometrics): number {
  const { weightKg, heightCm, age, sex } = bio;
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  if (sex === "M") return base + 5;
  if (sex === "F") return base - 161;
  return base - 78;
}

/**
 * TDEE = BMR × atividade do dia a dia (fora da academia) + calorias médias
 * dos treinos, diluídas ao longo da semana. Calcular os dois separadamente
 * (em vez de um único multiplicador "nível de atividade") é o que corrige
 * a distorção do modelo anterior.
 */
export function calculateTDEE(bio: UserBiometrics): number {
  const bmr = calculateBMR(bio);

  const dailyActivityLevel = bio.avgDailySteps
    ? activityFromSteps(bio.avgDailySteps)
    : bio.dailyActivityLevel;

  const baseline = bmr * BASELINE_ACTIVITY_MULTIPLIER[dailyActivityLevel];

  const met = TRAINING_MET[bio.trainingIntensity];
  const weeklyTrainingKcal =
    bio.trainingSessionsPerWeek *
    met *
    bio.weightKg *
    (bio.trainingSessionDurationMin / 60);
  const dailyTrainingKcal = weeklyTrainingKcal / 7;

  return baseline + dailyTrainingKcal;
}

/**
 * Calcula as metas diárias na ordem recomendada:
 * calorias → proteína → gordura → carboidrato → fibra.
 */
export function calculateMacroTarget(bio: UserBiometrics, goal: Goal): MacroTarget {
  // 1. Calorias
  const tdee = calculateTDEE(bio);
  const kcal = Math.round(tdee * (1 + goal.calorieAdjustmentPct / 100));

  // 2. Proteína — g/kg dentro da faixa do objetivo, posicionado pela
  // pontuação de atividade: quanto mais ativa/mais treino, mais perto do
  // topo da faixa (ex.: faixa 1.2-1.6 do objetivo "manutenção" — sedentária
  // sem treino fica perto de 1.2, ativa treinando bastante perto de 1.6).
  const proteinPerKg =
    goal.proteinGKgMin +
    (goal.proteinGKgMax - goal.proteinGKgMin) * activityScore(bio);
  const proteinG = Math.round(proteinPerKg * bio.weightKg);
  const proteinKcal = proteinG * 4;

  // 3. Gordura — 27% das calorias-alvo (dentro da faixa 20-35% geralmente
  // recomendada), com piso de 0.8g/kg pra não cair abaixo do mínimo
  // saudável em déficits mais agressivos
  const fatFromPct = Math.round((kcal * 0.27) / 9);
  const fatFloor = Math.round(bio.weightKg * 0.8);
  const fatG = Math.max(fatFromPct, fatFloor);
  const fatKcal = fatG * 9;

  // 4. Carboidrato — o que sobra das calorias-alvo depois de proteína e gordura
  const remainingKcal = Math.max(kcal - proteinKcal - fatKcal, 0);
  const carbsG = Math.round(remainingKcal / 4);

  // 5. Fibra — 14g por 1000kcal, sem piso fixo por idade/sexo: uma pessoa
  // com meta de 1.500kcal recebe ~21g, não um valor genérico de 28g "pra
  // todo mundo". A tolerância entre o mínimo aceitável e o ideal já é
  // tratada à parte (ver DailyTargetRange, em planGenerator.ts).
  const fiberG = Math.round((kcal / 1000) * 14);

  return { kcal, proteinG, carbsG, fatG, fiberG };
}
