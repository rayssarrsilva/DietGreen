export const goalsSeed = [
  {
    slug: "manutencao",
    name: "Manutenção",
    shortDesc: "Manter o peso e a composição corporal atuais, sem superávit nem déficit.",
    longDesc:
      "Calorias na média do seu gasto total (sem ajuste), com proteína moderada — ideal pra quem treina algumas vezes por semana só pra saúde/condicionamento e não quer ganhar nem perder peso.",
    proteinGKgMin: 1.2,
    proteinGKgMax: 1.6,
    calorieAdjustmentPct: 0,
    fatPctOfCalories: 27,
    sortOrder: 0,
  },
  {
    slug: "ganhar-massa",
    name: "Ganhar massa",
    shortDesc: "Aumento geral de peso corporal, aceitando que parte do ganho seja gordura.",
    longDesc:
      "Superávit calórico moderado (TDEE +15%) para ganhar peso de forma geral (músculo + alguma gordura). Ideal para quem está muito abaixo do peso ou saindo de restrição calórica prolongada. Perfis vegetarianos/veganos costumam precisar de mais atenção à densidade calórica (oleaginosas, azeite, tubérculos) para atingir o superávit sem depender só de volume de comida.",
    proteinGKgMin: 1.6,
    proteinGKgMax: 2.2,
    calorieAdjustmentPct: 15,
    fatPctOfCalories: 27,
    sortOrder: 1,
  },
  {
    slug: "ganhar-musculo",
    name: "Ganhar músculo (hipertrofia)",
    shortDesc: "Superávit pequeno e controlado, priorizando massa magra.",
    longDesc:
      "Superávit calórico pequeno (TDEE +8%) com proteína alta, priorizando ganho de massa magra e minimizando gordura — superávits maiores tendem a acelerar o ganho de gordura sem necessariamente acelerar ganho de força/massa muscular na mesma proporção. Em perfis veganos/vegetarianos, o cardápio prioriza fontes proteicas completas (soja, combinações de leguminosa+cereal) para maximizar síntese proteica muscular.",
    proteinGKgMin: 1.6,
    proteinGKgMax: 2.2,
    calorieAdjustmentPct: 8,
    fatPctOfCalories: 27,
    sortOrder: 2,
  },
  {
    slug: "emagrecer",
    name: "Emagrecer",
    shortDesc: "Déficit calórico moderado e sustentável a longo prazo.",
    longDesc:
      "Déficit calórico moderado (TDEE -15%) — mais fácil de manter por mais tempo sem acelerar demais a perda de massa magra —, com proteína elevada para preservar músculo e fibra alta para saciedade. Em perfis sem carne, a fibra tende a ser naturalmente mais alta, o que ajuda na saciedade durante o déficit.",
    proteinGKgMin: 1.6,
    proteinGKgMax: 2.2,
    calorieAdjustmentPct: -15,
    fatPctOfCalories: 27,
    sortOrder: 3,
  },
  {
    slug: "bulking",
    name: "Bulking",
    shortDesc: "O maior superávit entre os objetivos de ganho — mas sem exagero.",
    longDesc:
      "Superávit calórico maior (TDEE +20%), priorizando volume de treino e ganho de peso mais rápido, aceitando mais ganho de gordura no processo. \"Agressivo\" aqui significa 15-20% acima da manutenção, não 30-40% — superávits muito além disso não aceleram proporcionalmente o ganho de músculo, só de gordura. Costuma ser usado em ciclos curtos seguidos de cutting.",
    proteinGKgMin: 1.6,
    proteinGKgMax: 2.2,
    calorieAdjustmentPct: 20,
    fatPctOfCalories: 27,
    sortOrder: 4,
  },
  {
    slug: "cutting",
    name: "Cutting",
    shortDesc: "Déficit mais agressivo, preservando o máximo de músculo possível.",
    longDesc:
      "Déficit calórico mais agressivo (TDEE -20%) que o de 'emagrecer', geralmente por tempo limitado, com proteína no topo da faixa recomendada e gordura um pouco mais baixa que os outros objetivos para preservar massa magra ao máximo durante a perda de gordura mais rápida. Referências de fisiculturismo trabalham com perda de ~0,5-1% do peso corporal por semana — o ritmo real depende de quanto a pessoa realmente come, não só dessa meta calculada.",
    proteinGKgMin: 2.0,
    proteinGKgMax: 2.4,
    calorieAdjustmentPct: -20,
    fatPctOfCalories: 23,
    sortOrder: 5,
  },
];
