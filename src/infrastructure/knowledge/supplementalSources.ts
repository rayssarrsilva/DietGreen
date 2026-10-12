export type SupplementalNutrient =
  | "vitaminB12"
  | "vitaminD"
  | "folate"
  | "selenium"
  | "vitaminE"
  | "vitaminK"
  | "omega3EpaDha"
  | "omega3Ala";

export interface SupplementalFood {
  name: string;
  diet: "animal" | "vegetarian" | "vegan";
  values: Partial<Record<SupplementalNutrient, number>>;
}

export const SUPPLEMENTAL_UNITS: Record<SupplementalNutrient, string> = {
  vitaminB12: "µg",
  vitaminD: "µg",
  folate: "µg DFE",
  selenium: "µg",
  vitaminE: "mg",
  vitaminK: "µg",
  omega3EpaDha: "g",
  omega3Ala: "g",
};

export const SUPPLEMENTAL_SOURCE =
  "Valores aproximados por 100 g baseados no USDA FoodData Central (domínio público). Variam com espécie, cultivo, solo e preparo; a TACO não mede esses nutrientes.";

export const SUPPLEMENTAL_FOODS: SupplementalFood[] = [
  { name: "Fígado bovino, cozido", diet: "animal", values: { vitaminB12: 70, folate: 253, vitaminD: 1.2, selenium: 36 } },
  { name: "Fígado de frango, cozido", diet: "animal", values: { vitaminB12: 17, folate: 578, selenium: 82 } },
  { name: "Mariscos/vôngoles, cozidos", diet: "animal", values: { vitaminB12: 99, selenium: 64 } },
  { name: "Sardinha em conserva (óleo, com espinha)", diet: "animal", values: { vitaminB12: 8.9, vitaminD: 4.8, selenium: 53, omega3EpaDha: 1.0 } },
  { name: "Salmão de cativeiro, cozido", diet: "animal", values: { vitaminB12: 2.8, vitaminD: 10.9, selenium: 41, omega3EpaDha: 2.3 } },
  { name: "Cavala/sarda, cozida", diet: "animal", values: { vitaminB12: 15, vitaminD: 16, selenium: 52, omega3EpaDha: 1.2 } },
  { name: "Atum em conserva (água)", diet: "animal", values: { vitaminB12: 2.5, vitaminD: 1.7, selenium: 80, omega3EpaDha: 0.27 } },
  { name: "Carne bovina magra, cozida", diet: "animal", values: { vitaminB12: 2.6, selenium: 30 } },
  { name: "Peito de frango, cozido", diet: "animal", values: { vitaminB12: 0.3, selenium: 27 } },
  { name: "Ovo inteiro", diet: "vegetarian", values: { vitaminB12: 0.9, vitaminD: 2.0, selenium: 31, folate: 47 } },
  { name: "Gema de ovo", diet: "vegetarian", values: { vitaminB12: 2.0, vitaminD: 5.4, selenium: 56 } },
  { name: "Leite de vaca integral", diet: "vegetarian", values: { vitaminB12: 0.45 } },
  { name: "Iogurte natural", diet: "vegetarian", values: { vitaminB12: 0.4 } },
  { name: "Queijo muçarela", diet: "vegetarian", values: { vitaminB12: 2.3, selenium: 17 } },
  { name: "Cogumelos expostos ao sol/UV", diet: "vegan", values: { vitaminD: 10 } },
  { name: "Lentilha, cozida", diet: "vegan", values: { folate: 181 } },
  { name: "Grão-de-bico, cozido", diet: "vegan", values: { folate: 172 } },
  { name: "Feijão-preto, cozido", diet: "vegan", values: { folate: 149 } },
  { name: "Edamame (soja verde), cozido", diet: "vegan", values: { folate: 311, vitaminK: 27 } },
  { name: "Amendoim", diet: "vegan", values: { folate: 240, vitaminE: 8.3 } },
  { name: "Espinafre cru", diet: "vegan", values: { folate: 194, vitaminK: 483, vitaminE: 2.0 } },
  { name: "Couve crua", diet: "vegan", values: { vitaminK: 390, folate: 62 } },
  { name: "Brócolis cozido", diet: "vegan", values: { vitaminK: 141, folate: 108 } },
  { name: "Salsa fresca", diet: "vegan", values: { vitaminK: 1640, folate: 152 } },
  { name: "Aspargo cozido", diet: "vegan", values: { folate: 149, vitaminK: 50 } },
  { name: "Abacate", diet: "vegan", values: { folate: 81, vitaminE: 2.1, vitaminK: 21 } },
  { name: "Castanha-do-pará", diet: "vegan", values: { selenium: 1917, vitaminE: 5.7 } },
  { name: "Semente de girassol", diet: "vegan", values: { vitaminE: 35, selenium: 53, folate: 227 } },
  { name: "Amêndoa", diet: "vegan", values: { vitaminE: 25.6 } },
  { name: "Avelã", diet: "vegan", values: { vitaminE: 15 } },
  { name: "Azeite de oliva", diet: "vegan", values: { vitaminE: 14.4, vitaminK: 60 } },
  { name: "Linhaça", diet: "vegan", values: { omega3Ala: 22.8 } },
  { name: "Chia", diet: "vegan", values: { omega3Ala: 17.8 } },
  { name: "Nozes", diet: "vegan", values: { omega3Ala: 9.1 } },
  { name: "Óleo de alga (fonte vegana de EPA/DHA)", diet: "vegan", values: { omega3EpaDha: 40 } },
  { name: "Arroz integral, cozido", diet: "vegan", values: { selenium: 9.8 } },
];
