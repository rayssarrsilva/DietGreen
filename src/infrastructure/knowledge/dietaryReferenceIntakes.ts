export interface ReferenceIntake {
  nutrient: string;
  unit: string;
  men: string;
  women: string;
  upperLimit: string | null;
  notes: string;
}

export const DRI_SOURCE =
  "Dietary Reference Intakes (National Academies of Sciences, Engineering, and Medicine — IOM/NASEM), valores para adultos de 19 anos ou mais, não gestantes; potássio e sódio pela revisão de 2019";

export const REFERENCE_INTAKES: ReferenceIntake[] = [
  { nutrient: "Proteína", unit: "g/kg/dia", men: "0,8 (RDA)", women: "0,8 (RDA)", upperLimit: null, notes: "RDA evita deficiência em sedentários; praticantes de exercício: 1,4–2,0 g/kg (ISSN 2017); idosos: 1,0–1,2 g/kg (PROT-AGE)" },
  { nutrient: "Fibra alimentar", unit: "g/dia", men: "38 (19–50 a) / 30 (51+)", women: "25 (19–50 a) / 21 (51+)", upperLimit: null, notes: "OMS (2023): pelo menos 25 g/dia" },
  { nutrient: "Água total (alimentos + bebidas)", unit: "L/dia", men: "3,7", women: "2,7", upperLimit: null, notes: "Ingestão adequada (AI); aumenta com calor e suor" },
  { nutrient: "Ácido alfa-linolênico (ômega-3 ALA)", unit: "g/dia", men: "1,6", women: "1,1", upperLimit: null, notes: "AI" },
  { nutrient: "Vitamina A", unit: "µg RAE/dia", men: "900", women: "700", upperLimit: "3000 µg (retinol pré-formado)", notes: "" },
  { nutrient: "Vitamina C", unit: "mg/dia", men: "90", women: "75", upperLimit: "2000 mg", notes: "Fumantes: +35 mg" },
  { nutrient: "Vitamina D", unit: "µg/dia (UI)", men: "15 µg = 600 UI (19–70 a); 20 µg = 800 UI (> 70 a)", women: "igual aos homens", upperLimit: "100 µg = 4000 UI", notes: "" },
  { nutrient: "Vitamina E", unit: "mg/dia", men: "15", women: "15", upperLimit: "1000 mg (de suplementos)", notes: "" },
  { nutrient: "Vitamina K", unit: "µg/dia", men: "120 (AI)", women: "90 (AI)", upperLimit: null, notes: "Quem usa varfarina deve manter ingestão constante, não eliminar" },
  { nutrient: "Tiamina (B1)", unit: "mg/dia", men: "1,2", women: "1,1", upperLimit: null, notes: "" },
  { nutrient: "Riboflavina (B2)", unit: "mg/dia", men: "1,3", women: "1,1", upperLimit: null, notes: "" },
  { nutrient: "Niacina (B3)", unit: "mg NE/dia", men: "16", women: "14", upperLimit: "35 mg (de suplementos/fortificação)", notes: "" },
  { nutrient: "Vitamina B6", unit: "mg/dia", men: "1,3 (19–50 a) / 1,7 (51+)", women: "1,3 (19–50 a) / 1,5 (51+)", upperLimit: "100 mg", notes: "" },
  { nutrient: "Folato", unit: "µg DFE/dia", men: "400", women: "400", upperLimit: "1000 µg (ácido fólico sintético)", notes: "Planejamento de gestação: orientação médica" },
  { nutrient: "Vitamina B12", unit: "µg/dia", men: "2,4", women: "2,4", upperLimit: null, notes: "Veganos precisam de fonte fortificada ou suplementação orientada" },
  { nutrient: "Colina", unit: "mg/dia", men: "550 (AI)", women: "425 (AI)", upperLimit: "3500 mg", notes: "" },
  { nutrient: "Cálcio", unit: "mg/dia", men: "1000 (19–70 a) / 1200 (> 70 a)", women: "1000 (19–50 a) / 1200 (51+)", upperLimit: "2500 mg (19–50 a) / 2000 mg (51+)", notes: "" },
  { nutrient: "Ferro", unit: "mg/dia", men: "8", women: "18 (19–50 a) / 8 (51+)", upperLimit: "45 mg", notes: "Vegetarianos: necessidade ~1,8 vez maior (menor absorção do ferro não heme)" },
  { nutrient: "Magnésio", unit: "mg/dia", men: "400 (19–30 a) / 420 (31+)", women: "310 (19–30 a) / 320 (31+)", upperLimit: "350 mg (só de suplementos)", notes: "" },
  { nutrient: "Zinco", unit: "mg/dia", men: "11", women: "8", upperLimit: "40 mg", notes: "Dietas ricas em fitatos (vegetarianas) podem exigir até 50% a mais" },
  { nutrient: "Selênio", unit: "µg/dia", men: "55", women: "55", upperLimit: "400 µg", notes: "Castanha-do-pará é muito rica e variável" },
  { nutrient: "Iodo", unit: "µg/dia", men: "150", women: "150", upperLimit: "1100 µg", notes: "No Brasil o sal é iodado (15–45 mg de iodo/kg, ANVISA RDC 23/2013)" },
  { nutrient: "Cobre", unit: "µg/dia", men: "900", women: "900", upperLimit: "10000 µg", notes: "" },
  { nutrient: "Fósforo", unit: "mg/dia", men: "700", women: "700", upperLimit: "4000 mg (até 70 a)", notes: "" },
  { nutrient: "Potássio", unit: "mg/dia", men: "3400 (AI)", women: "2600 (AI)", upperLimit: null, notes: "Doença renal: ajuste individual" },
  { nutrient: "Sódio", unit: "mg/dia", men: "1500 (AI); reduzir se acima de 2300", women: "igual", upperLimit: null, notes: "OMS: < 2000 mg de sódio/dia (= < 5 g de sal)" },
];

export function formatReferenceIntakesForPrompt(): string {
  const rows = REFERENCE_INTAKES.map(
    (r) =>
      `- ${r.nutrient} (${r.unit}): homens ${r.men}; mulheres ${r.women}${r.upperLimit ? `; limite superior ${r.upperLimit}` : ""}${r.notes ? `; ${r.notes}` : ""}`
  );
  return `Fonte: ${DRI_SOURCE}.\n${rows.join("\n")}`;
}
