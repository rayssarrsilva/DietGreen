export const goalsSeed = [
  {
    slug: "ganhar-massa",
    name: "Ganhar massa",
    shortDesc: "Aumento geral de peso corporal, sem foco estrito em pureza do ganho.",
    longDesc:
      "Superávit calórico moderado para ganhar peso de forma geral (músculo + alguma gordura). Ideal para quem está muito abaixo do peso ou saindo de restrição calórica prolongada. Perfis vegetarianos/veganos costumam precisar de mais atenção à densidade calórica (oleaginosas, azeite, tubérculos) para atingir o superávit sem depender só de volume de comida.",
    proteinGKgMin: 1.6,
    proteinGKgMax: 2.0,
    calorieAdjustmentPct: 10,
    sortOrder: 1,
  },
  {
    slug: "ganhar-musculo",
    name: "Ganhar músculo (hipertrofia)",
    shortDesc: "Superávit menor e mais controlado, priorizando massa magra.",
    longDesc:
      "Superávit calórico pequeno com proteína mais alta, priorizando ganho de massa magra e minimizando gordura. Em perfis veganos/vegetarianos, o cardápio prioriza fontes proteicas completas (soja, combinações de leguminosa+cereal) para maximizar síntese proteica muscular.",
    proteinGKgMin: 1.8,
    proteinGKgMax: 2.2,
    calorieAdjustmentPct: 8,
    sortOrder: 2,
  },
  {
    slug: "emagrecer",
    name: "Emagrecer",
    shortDesc: "Déficit calórico moderado e sustentável a longo prazo.",
    longDesc:
      "Déficit calórico moderado (mais fácil de manter por mais tempo), com proteína elevada para preservar massa magra e fibra alta para saciedade. Em perfis sem carne, a fibra tende a ser naturalmente mais alta, o que ajuda na saciedade durante o déficit.",
    proteinGKgMin: 1.6,
    proteinGKgMax: 2.2,
    calorieAdjustmentPct: -15,
    sortOrder: 3,
  },
  {
    slug: "bulking",
    name: "Bulking",
    shortDesc: "Superávit calórico agressivo para ganho rápido de peso/força.",
    longDesc:
      "Superávit calórico mais agressivo, priorizando volume de treino e ganho de peso rápido, aceitando algum ganho de gordura no processo. Costuma ser usado em ciclos curtos seguidos de cutting.",
    proteinGKgMin: 1.6,
    proteinGKgMax: 2.0,
    calorieAdjustmentPct: 20,
    sortOrder: 4,
  },
  {
    slug: "cutting",
    name: "Cutting",
    shortDesc: "Déficit calórico mais agressivo, preservando o máximo de músculo.",
    longDesc:
      "Déficit calórico mais agressivo que o de 'emagrecer', geralmente por tempo limitado, com proteína no topo da faixa recomendada para preservar massa magra ao máximo durante a perda de gordura mais rápida.",
    proteinGKgMin: 2.0,
    proteinGKgMax: 2.4,
    calorieAdjustmentPct: -22,
    sortOrder: 5,
  },
];
