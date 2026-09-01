type SubSeed = {
  dietaryProfileSlug: string;
  foodSlug: string;
  replacesCategory: "PROTEIN";
  efficacyRank: number;
  rationale: string;
};

function buildRanking(
  profileSlug: string,
  orderedFoodSlugs: string[],
  rationaleByFood: Record<string, string>
): SubSeed[] {
  return orderedFoodSlugs.map((foodSlug, idx) => ({
    dietaryProfileSlug: profileSlug,
    foodSlug,
    replacesCategory: "PROTEIN" as const,
    efficacyRank: idx + 1,
    rationale: rationaleByFood[foodSlug] ?? "Boa fonte proteica para o perfil.",
  }));
}

const R = {
  tofu: "Soja isolada tem PDCAAS 1.0 (proteína completa) e alta digestibilidade.",
  tempeh: "Fermentação aumenta biodisponibilidade dos aminoácidos da soja.",
  edamame: "Soja completa in natura, boa densidade de leucina.",
  pts: "Alta concentração proteica por grama e baixo custo.",
  seitan: "Muito rico em proteína, mas limitado em lisina — combinar com leguminosas.",
  lentilha: "Boa proteína vegetal, rica em ferro; combina com cereais p/ perfil completo.",
  graoDeBico: "Proteína vegetal versátil, boa fibra associada.",
  feijaoPreto: "Amplamente acessível, boa combinação com arroz para perfil de aminoácidos completo.",
  spirulina: "Densidade proteica altíssima, mas porção de uso é pequena.",
  ovo: "Proteína de altíssima qualidade biológica (referência PDCAAS 1.0), rica em leucina.",
  whey: "Absorção rápida e altíssima leucina — referência em síntese proteica muscular.",
  iogurte: "Caseína+whey do leite, boa leucina e cálcio.",
  cottage: "Alta proporção de caseína (absorção lenta, boa para saciedade).",
  atum: "Muito magro, alta proteína por caloria.",
  salmao: "Proteína completa + ômega-3 anti-inflamatório.",
  tilapia: "Proteína magra, leve e barata.",
  frango: "Referência clássica de proteína magra de alta qualidade.",
  peru: "Alternativa magra às aves vermelhas com perfil proteico similar ao frango.",
  carne: "Proteína completa + ferro heme de alta absorção.",
};

export const substitutionsSeed: SubSeed[] = [
  ...buildRanking(
    "vegano",
    ["tofu-firme", "tempeh", "edamame", "proteina-soja-texturizada", "lentilha-cozida", "grao-de-bico-cozido", "feijao-preto-cozido", "seitan", "spirulina", "sementes-abobora"],
    { "tofu-firme": R.tofu, tempeh: R.tempeh, edamame: R.edamame, "proteina-soja-texturizada": R.pts, "lentilha-cozida": R.lentilha, "grao-de-bico-cozido": R.graoDeBico, "feijao-preto-cozido": R.feijaoPreto, seitan: R.seitan, spirulina: R.spirulina }
  ),
  ...buildRanking(
    "vegetariano",
    ["ovo-inteiro", "whey-protein", "iogurte-grego-natural", "queijo-cottage", "tofu-firme", "tempeh", "lentilha-cozida", "grao-de-bico-cozido", "edamame", "seitan"],
    { "ovo-inteiro": R.ovo, "whey-protein": R.whey, "iogurte-grego-natural": R.iogurte, "queijo-cottage": R.cottage, "tofu-firme": R.tofu, tempeh: R.tempeh, "lentilha-cozida": R.lentilha, "grao-de-bico-cozido": R.graoDeBico, edamame: R.edamame, seitan: R.seitan }
  ),
  ...buildRanking(
    "lactovegetariano",
    ["iogurte-grego-natural", "queijo-cottage", "whey-protein", "tofu-firme", "tempeh", "lentilha-cozida", "grao-de-bico-cozido", "edamame", "feijao-preto-cozido", "seitan"],
    { "iogurte-grego-natural": R.iogurte, "queijo-cottage": R.cottage, "whey-protein": R.whey, "tofu-firme": R.tofu, tempeh: R.tempeh, "lentilha-cozida": R.lentilha, "grao-de-bico-cozido": R.graoDeBico, edamame: R.edamame, "feijao-preto-cozido": R.feijaoPreto, seitan: R.seitan }
  ),
  ...buildRanking(
    "ovovegetariano",
    ["ovo-inteiro", "tofu-firme", "tempeh", "lentilha-cozida", "grao-de-bico-cozido", "edamame", "feijao-preto-cozido", "seitan", "proteina-soja-texturizada", "spirulina"],
    { "ovo-inteiro": R.ovo, "tofu-firme": R.tofu, tempeh: R.tempeh, "lentilha-cozida": R.lentilha, "grao-de-bico-cozido": R.graoDeBico, edamame: R.edamame, "feijao-preto-cozido": R.feijaoPreto, seitan: R.seitan, "proteina-soja-texturizada": R.pts }
  ),
  ...buildRanking(
    "pescetariano",
    ["atum-enlatado", "salmao", "tilapia", "ovo-inteiro", "iogurte-grego-natural", "tofu-firme", "tempeh", "lentilha-cozida", "grao-de-bico-cozido", "feijao-preto-cozido"],
    { "atum-enlatado": R.atum, salmao: R.salmao, tilapia: R.tilapia, "ovo-inteiro": R.ovo, "iogurte-grego-natural": R.iogurte, "tofu-firme": R.tofu, tempeh: R.tempeh, "lentilha-cozida": R.lentilha, "grao-de-bico-cozido": R.graoDeBico, "feijao-preto-cozido": R.feijaoPreto }
  ),
  ...buildRanking(
    "pollotariano",
    ["frango-peito-grelhado", "peru-moido", "ovo-inteiro", "iogurte-grego-natural", "whey-protein", "tofu-firme", "lentilha-cozida", "grao-de-bico-cozido", "edamame", "feijao-preto-cozido"],
    { "frango-peito-grelhado": R.frango, "peru-moido": R.peru, "ovo-inteiro": R.ovo, "iogurte-grego-natural": R.iogurte, "whey-protein": R.whey, "tofu-firme": R.tofu, "lentilha-cozida": R.lentilha, "grao-de-bico-cozido": R.graoDeBico, edamame: R.edamame, "feijao-preto-cozido": R.feijaoPreto }
  ),
  ...buildRanking(
    "carne-vermelha",
    ["carne-bovina-magra", "ovo-inteiro", "iogurte-grego-natural", "queijo-cottage", "whey-protein", "lentilha-cozida", "grao-de-bico-cozido", "feijao-preto-cozido", "tofu-firme", "edamame"],
    { "carne-bovina-magra": R.carne, "ovo-inteiro": R.ovo, "iogurte-grego-natural": R.iogurte, "queijo-cottage": R.cottage, "whey-protein": R.whey, "lentilha-cozida": R.lentilha, "grao-de-bico-cozido": R.graoDeBico, "feijao-preto-cozido": R.feijaoPreto, "tofu-firme": R.tofu }
  ),
  ...buildRanking(
    "flexitariano",
    ["frango-peito-grelhado", "ovo-inteiro", "atum-enlatado", "whey-protein", "iogurte-grego-natural", "tofu-firme", "tempeh", "lentilha-cozida", "grao-de-bico-cozido", "carne-bovina-magra"],
    { "frango-peito-grelhado": R.frango, "ovo-inteiro": R.ovo, "atum-enlatado": R.atum, "whey-protein": R.whey, "iogurte-grego-natural": R.iogurte, "tofu-firme": R.tofu, tempeh: R.tempeh, "lentilha-cozida": R.lentilha, "grao-de-bico-cozido": R.graoDeBico, "carne-bovina-magra": R.carne }
  ),
  ...buildRanking(
    "onivoro",
    ["ovo-inteiro", "frango-peito-grelhado", "carne-bovina-magra", "atum-enlatado", "whey-protein", "iogurte-grego-natural", "salmao", "tofu-firme", "lentilha-cozida", "grao-de-bico-cozido"],
    { "ovo-inteiro": R.ovo, "frango-peito-grelhado": R.frango, "carne-bovina-magra": R.carne, "atum-enlatado": R.atum, "whey-protein": R.whey, "iogurte-grego-natural": R.iogurte, salmao: R.salmao, "tofu-firme": R.tofu, "lentilha-cozida": R.lentilha, "grao-de-bico-cozido": R.graoDeBico }
  ),
];
