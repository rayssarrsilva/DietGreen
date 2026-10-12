export interface KnowledgeArticle {
  slug: string;
  title: string;
  tags: string[];
  body: string;
  sources: string[];
  reviewedBy: string | null;
}

export const KNOWLEDGE_ARTICLES: KnowledgeArticle[] = [
  {
    slug: "balanco-energetico",
    title: "Gasto energético, calorias e balanço energético",
    tags: ["calorias", "tmb", "get", "metabolismo", "mifflin", "gasto", "deficit", "superavit", "kcal"],
    body: `O peso corporal muda conforme o balanço entre energia ingerida e gasta. O gasto energético total (GET) soma metabolismo basal (~60–70%), efeito térmico dos alimentos (~10%) e atividade física (exercício + NEAT, que é o movimento do dia a dia).
Estimativa mais validada da taxa metabólica basal em adultos: Mifflin-St Jeor. Homens: 10 × peso (kg) + 6,25 × altura (cm) − 5 × idade + 5. Mulheres: mesma conta − 161. Multiplica-se por um fator de atividade: 1,2 sedentário; 1,375 leve; 1,55 moderado; 1,725 muito ativo; 1,9 extremamente ativo.
São estimativas com erro de ±10% ou mais; o ajuste real vem acompanhando peso e medidas por 2–3 semanas. O corpo também se adapta: em déficit prolongado o gasto cai um pouco (adaptação metabólica), por isso metas são reavaliadas.`,
    sources: ["Mifflin MD et al., Am J Clin Nutr 1990", "Frankenfield D et al., J Am Diet Assoc 2005 (validação)", "Hall KD et al., Lancet 2011"],
    reviewedBy: null,
  },
  {
    slug: "emagrecimento-cutting",
    title: "Emagrecer e cutting: perder gordura preservando músculo",
    tags: ["emagrecer", "cutting", "perder peso", "perder gordura", "secar", "definicao", "deficit", "dieta"],
    body: `Perda de gordura exige déficit calórico sustentado. Ritmo prudente: cerca de 0,5–1% do peso corporal por semana; mais rápido aumenta perda de massa muscular, fome e abandono.
Para preservar músculo: treino de força mantido, proteína alta (1,6–2,2 g/kg; atletas magros em déficit podem ir a 2,3–3,1 g/kg de massa magra), sono adequado e déficit moderado.
Saciedade: priorizar alimentos in natura, verduras e legumes em volume, leguminosas, frutas inteiras, proteína em todas as refeições e fibras; reduzir bebidas açucaradas, álcool e ultraprocessados.
NEAT (passos, ficar em pé) faz diferença grande no gasto. Dietas muito restritivas (muito baixas em calorias) só com acompanhamento profissional. "Cutting" é a fase de déficit para revelar a musculatura depois de um período de ganho.`,
    sources: ["Helms ER et al., J Int Soc Sports Nutr 2014", "ISSN Position Stand: protein and exercise (Jäger et al., 2017)", "Guia Alimentar para a População Brasileira (MS, 2014)"],
    reviewedBy: null,
  },
  {
    slug: "ganho-massa-bulking",
    title: "Ganhar massa muscular e bulking",
    tags: ["ganhar massa", "bulking", "hipertrofia", "massa muscular", "engordar", "superavit", "crescer"],
    body: `Hipertrofia depende principalmente de treino de força com sobrecarga progressiva; a dieta dá o suporte. Um superávit leve (~5–10% acima da manutenção, algo como 200–500 kcal) com ganho de ~0,25–0,5% do peso por semana minimiza ganho de gordura; iniciantes conseguem ganhar um pouco mais rápido.
Proteína: 1,6–2,2 g/kg/dia distribuída em 3–5 refeições com ~0,25–0,4 g/kg cada. Carboidratos sustentam o volume de treino (3–7 g/kg conforme a carga). Gorduras: 20–35% das calorias.
"Bulking sujo" (comer de tudo em grande excesso) acelera ganho de gordura sem acelerar músculo. Iniciantes com sobrepeso podem fazer recomposição corporal (ganhar músculo e perder gordura ao mesmo tempo) com proteína alta e leve déficit ou manutenção.`,
    sources: ["Iraki J et al., Sports 2019 (bodybuilding off-season)", "ISSN Position Stand: protein and exercise (2017)", "Morton RW et al., Br J Sports Med 2018 (meta-análise de proteína)"],
    reviewedBy: null,
  },
  {
    slug: "reducao-localizada",
    title: "Perder gordura em um lugar específico (barriga, braço, coxa)",
    tags: ["barriga", "gordura localizada", "reducao localizada", "pochete", "flancos", "culote", "papada", "queimar gordura", "abdomen", "lugar especifico"],
    body: `Não existe alimento nem dieta que tire gordura de um ponto específico. A redução localizada é um mito testado em estudos: treinar uma região (ex.: abdominais) não reduz mais a gordura daquela região do que de outras.
De onde a gordura sai primeiro e por último é definido por genética, sexo, hormônios e idade. Com déficit calórico consistente o corpo inteiro perde gordura; as áreas "teimosas" costumam ser as últimas.
O que é possível: perder gordura total (dieta + atividade) e desenvolver músculos de regiões específicas com treino direcionado, o que muda o formato daquela área. Chás, termogênicos, cremes e alimentos "queima-gordura" não produzem perda localizada.`,
    sources: ["Vispute SS et al., J Strength Cond Res 2011", "Ramírez-Campillo R et al., J Strength Cond Res 2013", "Ramos-Campo DJ et al., Scand J Med Sci Sports 2021 (revisão sistemática)"],
    reviewedBy: null,
  },
  {
    slug: "hipertrofia-regioes",
    title: "Desenvolver músculos de regiões específicas (glúteo, braço, peito, perna)",
    tags: ["gluteo", "bumbum", "braco", "biceps", "triceps", "peito", "perna", "coxa", "ombro", "costas", "regiao", "especifica", "aumentar"],
    body: `Músculo cresce onde é treinado: o direcionamento vem do treino (exercícios para a região, ~10–20 séries semanais por grupo muscular, progressão de carga, técnica e descanso). A alimentação é a mesma para qualquer região: energia suficiente (manutenção ou leve superávit), proteína de 1,6–2,2 g/kg/dia distribuída no dia, carboidrato para render no treino e sono de 7–9 h.
Não existe alimento específico para glúteo, braço ou peito. Refeições com 20–40 g de proteína de qualidade (ou ~2–3 g de leucina) maximizam a síntese muscular por refeição; fontes: carnes, ovos, laticínios, soja/tofu, combinações de leguminosas com cereais.
Para ganhar uma região e perder gordura em outra, combine treino direcionado com controle calórico geral.`,
    sources: ["Schoenfeld BJ et al., J Sports Sci 2017 (volume de treino)", "ISSN Position Stand: protein and exercise (2017)"],
    reviewedBy: null,
  },
  {
    slug: "proteina",
    title: "Proteína: quanto, quando e de onde",
    tags: ["proteina", "whey", "quantidade", "g/kg", "leucina", "aminoacidos", "refeicao"],
    body: `RDA para adultos sedentários: 0,8 g/kg/dia. Para quem treina: 1,4–2,0 g/kg/dia (ISSN), com benefícios até ~2,2 g/kg para hipertrofia; em déficit calórico, valores mais altos ajudam a preservar massa magra. Idosos: 1,0–1,2 g/kg (mais se ativos ou doentes).
Distribuição: 3–5 refeições com 0,25–0,4 g/kg (≈20–40 g) a cada 3–4 h. O total diário importa mais que o horário exato; uma refeição com proteína nas horas ao redor do treino é suficiente.
Qualidade: proteínas animais e soja têm todos os aminoácidos essenciais em boa proporção; outras vegetais se complementam (feijão + arroz). Quem tem doença renal crônica precisa de orientação individual antes de aumentar proteína. Pó (whey, proteína vegetal) é só comida em outra forma: útil por praticidade, não obrigatório.`,
    sources: ["Jäger R et al., ISSN Position Stand: protein and exercise, 2017", "Morton RW et al., Br J Sports Med 2018", "Bauer J et al., PROT-AGE, J Am Med Dir Assoc 2013", "IOM DRI Macronutrients 2005"],
    reviewedBy: null,
  },
  {
    slug: "proteina-vegetal",
    title: "Proteína em dietas vegetarianas e veganas",
    tags: ["vegano", "vegetariano", "proteina vegetal", "soja", "tofu", "leguminosas", "seitan", "plant based"],
    body: `É possível atingir as metas de proteína sem carne. Principais fontes: soja e derivados (tofu, tempeh, PTS, edamame), lentilha, grão-de-bico, feijões, ervilha, seitan, amendoim e sementes; vegetarianos também contam com ovos e laticínios.
Proteínas vegetais isoladas têm menos leucina e lisina e digestibilidade um pouco menor, então vale mirar o topo das faixas recomendadas (~10% a mais) e combinar fontes ao longo do dia (cereal + leguminosa, como arroz com feijão).
Estudos mostram ganho de força e massa semelhante com proteína vegetal bem planejada quando a quantidade total é suficiente.`,
    sources: ["Hevia-Larraín V et al., Sports Med 2021", "Academy of Nutrition and Dietetics: Position on Vegetarian Diets, 2016", "Mariotti F, Gardner CD, Nutrients 2019"],
    reviewedBy: null,
  },
  {
    slug: "carboidratos-treino",
    title: "Carboidratos, energia e treino",
    tags: ["carboidrato", "carbo", "pre treino", "pos treino", "glicogenio", "energia", "low carb", "arroz", "batata"],
    body: `Carboidrato é o principal combustível de treinos intensos. Referências para atletas (ACSM/AND/DC 2016): 3–5 g/kg/dia para treino moderado (~1 h/dia), 5–7 g/kg para 1–3 h/dia e mais para cargas de endurance muito altas. Praticantes recreativos geralmente ficam bem com quantidades menores.
Pré-treino (1–4 h antes): refeição com carboidrato fácil de digerir e alguma proteína, pouca gordura e fibra se o estômago for sensível. Pós-treino: proteína e carboidrato na refeição seguinte; a "janela anabólica" de 30 minutos não é rígida.
Prefira carboidratos com fibras (grãos integrais, tubérculos, leguminosas, frutas). Dietas low carb podem funcionar para emagrecer quando geram déficit, mas não são superiores quando calorias e proteína são iguais, e podem reduzir desempenho em treinos de alta intensidade.`,
    sources: ["Thomas DT et al., ACSM/AND/DC Joint Position: Nutrition and Athletic Performance, 2016", "Kerksick CM et al., ISSN Position Stand: nutrient timing, 2017", "Hall KD, Guo J, Gastroenterology 2017"],
    reviewedBy: null,
  },
  {
    slug: "gorduras",
    title: "Gorduras: boas, saturadas e trans",
    tags: ["gordura", "lipidios", "saturada", "trans", "azeite", "abacate", "oleaginosas", "hormonios"],
    body: `Faixa aceitável: 20–35% das calorias. Gordura saturada abaixo de 10% das calorias (menos em quem tem colesterol alto); gordura trans industrial deve ser evitada (proibida no Brasil desde 2023 em óleos parcialmente hidrogenados).
Priorize insaturadas: azeite, abacate, castanhas, amendoim, sementes, peixes. Dietas muito pobres em gordura (bem abaixo de 20%) podem prejudicar absorção de vitaminas A, D, E e K e o bem-estar hormonal; dietas muito ricas aumentam densidade calórica.
Trocar saturada por poli-insaturada reduz risco cardiovascular; trocar por açúcar e refinados não traz esse benefício.`,
    sources: ["IOM DRI Macronutrients 2005", "OMS, Diretriz de ácidos graxos saturados e trans, 2023", "ANVISA RDC 332/2019 (gordura trans)", "SBC, Atualização da Diretriz de Gorduras e Saúde Cardiovascular, 2021"],
    reviewedBy: null,
  },
  {
    slug: "fibras",
    title: "Fibras alimentares",
    tags: ["fibra", "intestino", "constipacao", "intestino preso", "saciedade", "aveia", "psyllium", "microbiota"],
    body: `Meta: pelo menos 25 g/dia (OMS); DRI: 38 g homens e 25 g mulheres até 50 anos. Fibras solúveis (aveia, feijões, frutas, chia, psyllium) ajudam colesterol, glicemia e saciedade; insolúveis (cascas, grãos integrais, verduras) ajudam o trânsito intestinal.
Aumente aos poucos e beba água junto, para evitar gases e desconforto. Fontes práticas: feijão diário, frutas inteiras com casca, legumes e verduras em metade do prato, grãos integrais, sementes.`,
    sources: ["OMS, Carbohydrate intake guideline, 2023", "IOM DRI 2005", "Reynolds A et al., Lancet 2019"],
    reviewedBy: null,
  },
  {
    slug: "hidratacao",
    title: "Hidratação",
    tags: ["agua", "hidratacao", "litros", "sede", "urina", "suor", "eletrolitos"],
    body: `Ingestão adequada de água total (bebidas + alimentos): ~3,7 L/dia para homens e ~2,7 L/dia para mulheres; cerca de 20% vem dos alimentos. A necessidade sobe com calor, suor e treino.
Sinais práticos: urina amarelo-clara e sede controlada. Em treinos longos ou muito suados, repor sódio além da água. Beber água em excesso extremo em curto tempo pode causar hiponatremia (sódio baixo), que é perigosa.`,
    sources: ["IOM DRI Water and Electrolytes, 2005", "ACSM Position Stand: Exercise and fluid replacement, 2007"],
    reviewedBy: null,
  },
  {
    slug: "ferro",
    title: "Ferro e anemia ferropriva",
    tags: ["ferro", "anemia", "ferritina", "cansaco", "hemoglobina", "feijao", "carne vermelha", "vitamina c"],
    body: `Necessidade: 8 mg/dia homens e mulheres após a menopausa; 18 mg/dia mulheres de 19–50 anos; vegetarianos precisam ~1,8 vez mais pela menor absorção do ferro vegetal.
Ferro heme (carnes, fígado, frango, peixes) é bem absorvido. Ferro não heme (feijões, lentilha, grão-de-bico, tofu, folhas verde-escuras, farinhas fortificadas) é absorvido melhor com vitamina C na mesma refeição (laranja, acerola, limão, pimentão, goiaba).
Atrapalham a absorção quando consumidos junto: café, chá preto/mate (polifenóis), cálcio (laticínios) e fitatos (reduzidos ao deixar feijões de molho e germinar). Prefira tomar café longe das refeições principais.
Ferritina baixa confirma estoques baixos; anemia tem outras causas (B12, folato, doenças). Suplementar ferro sem exame pode causar sobrecarga: só com orientação.`,
    sources: ["IOM DRI 2001", "OMS, diretriz sobre ferritina, 2020", "Hurrell R, Egli I, Am J Clin Nutr 2010"],
    reviewedBy: null,
  },
  {
    slug: "vitamina-b12",
    title: "Vitamina B12",
    tags: ["b12", "cobalamina", "vegano", "metformina", "omeprazol", "formigamento", "anemia megaloblastica"],
    body: `Necessidade: 2,4 µg/dia. Presente naturalmente apenas em alimentos de origem animal (fígado, mariscos, peixes, carnes, ovos, laticínios). Algas, cogumelos e alimentos fermentados não são fontes confiáveis de B12 ativa.
Veganos precisam de alimentos fortificados ou suplementação orientada; vegetarianos com pouco ovo/laticínio também têm risco. Idosos absorvem menos (menos acidez gástrica). Metformina e inibidores de bomba de prótons reduzem a absorção.
Deficiência causa anemia megaloblástica e sintomas neurológicos (formigamento, alteração de memória) que podem se tornar permanentes se não tratados: por isso a reposição é decisão médica ou nutricional.`,
    sources: ["IOM DRI 1998", "NIH Office of Dietary Supplements: Vitamin B12 Fact Sheet", "Academy of Nutrition and Dietetics: Vegetarian Diets, 2016"],
    reviewedBy: null,
  },
  {
    slug: "vitamina-d",
    title: "Vitamina D",
    tags: ["vitamina d", "sol", "exposicao solar", "ossos", "25 oh", "colecalciferol"],
    body: `A maior parte da vitamina D vem da síntese na pele pela exposição solar (UVB). Poucos alimentos têm quantidades relevantes: peixes gordos (salmão, sardinha, cavala), gema de ovo, fígado e cogumelos expostos à luz UV. No Brasil, laticínios geralmente não são fortificados.
Recomendação dietética: 600 UI (15 µg)/dia até 70 anos e 800 UI acima; limite superior 4000 UI/dia. Em exames, a SBPC/ML e a SBEM consideram ≥ 20 ng/mL adequado para a população geral e 30–60 ng/mL para grupos de risco.
Como dificilmente a alimentação corrige deficiência sozinha, reposição em cápsulas/gotas deve ser prescrita e acompanhada; excesso causa hipercalcemia.`,
    sources: ["IOM DRI Calcium and Vitamin D, 2011", "SBPC/ML e SBEM, posicionamento 2017", "Demay MB et al., Endocrine Society Guideline, 2024"],
    reviewedBy: null,
  },
  {
    slug: "calcio",
    title: "Cálcio e saúde óssea",
    tags: ["calcio", "ossos", "osteoporose", "leite", "laticinios", "sem lactose", "tofu"],
    body: `Necessidade: 1000 mg/dia para a maioria dos adultos e 1200 mg/dia para mulheres acima de 50 e homens acima de 70.
Fontes: leite, iogurte e queijos (sem lactose têm o mesmo cálcio); tofu preparado com sulfato de cálcio; sardinha com espinha; bebidas vegetais fortificadas; brócolis, couve e repolho (boa absorção). Espinafre tem cálcio, mas o oxalato reduz muito a absorção.
Vitamina D, proteína adequada e treino de força ajudam os ossos. Excesso de suplementos de cálcio pode favorecer cálculos renais.`,
    sources: ["IOM DRI Calcium and Vitamin D, 2011", "Weaver CM et al., Am J Clin Nutr 1999 (biodisponibilidade)"],
    reviewedBy: null,
  },
  {
    slug: "omega-3",
    title: "Ômega-3 (EPA, DHA e ALA)",
    tags: ["omega 3", "omega-3", "epa", "dha", "ala", "peixe", "linhaca", "chia", "triglicerideos"],
    body: `EPA e DHA (peixes gordos e óleo de algas) são as formas com efeito cardiovascular e cerebral documentado; ALA (linhaça, chia, nozes, óleo de canola) é essencial, mas o corpo converte menos de ~10% em EPA e menos ainda em DHA.
Recomendação prática: peixe, de preferência gordo (sardinha, salmão, cavala), cerca de 2 vezes por semana. Veganos podem usar ALA diariamente e, se quiserem EPA/DHA, óleo de algas com orientação. Doses altas de EPA/DHA para triglicerídeos são tratamento e devem ser prescritas.`,
    sources: ["AHA Science Advisory (Rimm EB et al., Circulation 2018)", "Burdge GC, Calder PC, Reprod Nutr Dev 2005", "IOM DRI 2005"],
    reviewedBy: null,
  },
  {
    slug: "zinco-selenio-iodo",
    title: "Zinco, selênio e iodo",
    tags: ["zinco", "selenio", "iodo", "castanha do para", "imunidade", "tireoide", "sal iodado"],
    body: `Zinco (11 mg homens, 8 mg mulheres): carnes, ostras e frutos do mar, ovos, sementes de abóbora, castanhas, feijões e grão-de-bico. Em dietas vegetarianas, deixar leguminosas de molho, germinar e fermentar reduz fitatos e melhora a absorção.
Selênio (55 µg): castanha-do-pará é extremamente rica e variável (uma unidade pode ter de dezenas a mais de 100 µg); 1–2 por dia costumam bastar e o limite superior é 400 µg. Também em peixes, ovos e carnes.
Iodo (150 µg): no Brasil o sal de cozinha é iodado (15–45 mg/kg), o que cobre a maioria; também laticínios, ovos e frutos do mar. Sal marinho "gourmet" não iodado e excesso de algas (kelp) podem gerar falta ou excesso.`,
    sources: ["IOM DRI 2000/2001", "ANVISA RDC 23/2013", "NIH ODS Fact Sheets (zinco, selênio, iodo)"],
    reviewedBy: null,
  },
  {
    slug: "magnesio-potassio",
    title: "Magnésio e potássio",
    tags: ["magnesio", "potassio", "caibra", "pressao", "banana", "feijao", "castanhas"],
    body: `Magnésio (400–420 mg homens, 310–320 mg mulheres): sementes de abóbora, castanhas, amêndoas, amendoim, feijões, aveia, cacau, folhas verde-escuras e grãos integrais.
Potássio (3400 mg homens, 2600 mg mulheres): feijões, batata, banana, abacate, folhas, tomate, laranja, iogurte. Dieta rica em potássio e pobre em sódio ajuda a controlar a pressão (padrão DASH).
Quem tem doença renal ou usa certos remédios para pressão pode precisar limitar potássio, inclusive evitar "sal light"/substitutos à base de cloreto de potássio: orientação individual.`,
    sources: ["IOM DRI 1997", "NASEM DRI Sodium and Potassium, 2019", "Appel LJ et al., NEJM 1997 (DASH)"],
    reviewedBy: null,
  },
  {
    slug: "folato",
    title: "Folato e ácido fólico",
    tags: ["folato", "acido folico", "b9", "gestacao", "anemia", "folhas"],
    body: `Necessidade: 400 µg DFE/dia. Fontes: feijões, lentilha, grão-de-bico, edamame, folhas verde-escuras, brócolis, aspargo, abacate, laranja, fígado. No Brasil, farinhas de trigo e milho são fortificadas com ácido fólico e ferro por norma da ANVISA.
Mulheres que planejam engravidar devem conversar com o médico sobre suplementação antes da concepção (previne defeitos do tubo neural). Excesso de ácido fólico sintético pode mascarar deficiência de B12.`,
    sources: ["IOM DRI 1998", "ANVISA RDC 150/2017 (fortificação de farinhas)", "OMS, recomendação de ácido fólico periconcepcional"],
    reviewedBy: null,
  },
  {
    slug: "glicemia-diabetes",
    title: "Alimentação para glicemia, pré-diabetes e diabetes",
    tags: ["diabetes", "pre diabetes", "glicemia", "glicose", "hba1c", "insulina", "resistencia insulina", "indice glicemico"],
    body: `Pilares com evidência: perda de 5–10% do peso quando há excesso (reduz progressão do pré-diabetes), fibras (legumes, verduras, feijões, grãos integrais), carboidrato distribuído ao longo do dia e combinado com proteína e gordura boa, menos açúcar e bebidas açucaradas, e atividade física regular (incluindo força).
Índice glicêmico ajuda na escolha (aveia e feijões em vez de pão branco e refrigerante), mas porção e contexto da refeição importam mais.
Quem usa insulina ou sulfonilureias tem risco de hipoglicemia ao mudar a dieta ou jejuar: ajustes só com a equipe de saúde.`,
    sources: ["Sociedade Brasileira de Diabetes, Diretriz 2024", "ADA Standards of Care 2025", "Knowler WC et al., NEJM 2002 (DPP)"],
    reviewedBy: null,
  },
  {
    slug: "colesterol-triglicerides",
    title: "Alimentação para colesterol e triglicerídeos",
    tags: ["colesterol", "ldl", "hdl", "triglicerideos", "dislipidemia", "aveia", "fitoesterois", "gordura no sangue"],
    body: `LDL alto: reduzir gordura saturada (carnes gordas, embutidos, manteiga, queijos gordos, frituras) e eliminar trans; aumentar fibra solúvel (≈3 g/dia de beta-glucana, por exemplo de aveia/cevada, reduz o LDL), leguminosas, soja, oleaginosas e azeite. Fitoesteróis (~2 g/dia) reduzem LDL em torno de 8–10%, mas são complemento.
Triglicerídeos altos: cortar açúcar, bebidas açucaradas e álcool, reduzir farinhas refinadas, perder peso se houver excesso, peixes gordos.
HDL baixo melhora com atividade física, perda de peso e parar de fumar. O colesterol dos ovos afeta pouco o LDL da maioria das pessoas; o padrão alimentar geral pesa mais.`,
    sources: ["SBC, Atualização da Diretriz Brasileira de Dislipidemias, 2017", "SBC, Diretriz de Gorduras e Saúde Cardiovascular, 2021", "EFSA claims beta-glucan/fitoesteróis"],
    reviewedBy: null,
  },
  {
    slug: "acido-urico-gota",
    title: "Ácido úrico e gota",
    tags: ["acido urico", "gota", "purinas", "cerveja", "frutose"],
    body: `Reduzir: vísceras (fígado, rim), alguns frutos do mar e peixes muito ricos em purinas (sardinha, anchova, mariscos em excesso), cerveja e destilados, bebidas açucaradas e excesso de frutose adicionada.
Ajudam: laticínios magros, hidratação, perda de peso gradual, padrão DASH/mediterrâneo. Leguminosas e vegetais ricos em purina não aumentam o risco de gota como as fontes animais. Jejum prolongado e perda de peso muito rápida podem desencadear crises.`,
    sources: ["American College of Rheumatology Gout Guideline, 2020", "Choi HK et al., NEJM 2004"],
    reviewedBy: null,
  },
  {
    slug: "sodio-pressao",
    title: "Sal, sódio e pressão arterial",
    tags: ["sal", "sodio", "pressao alta", "hipertensao", "dash", "temperos", "ultraprocessados"],
    body: `OMS: menos de 2000 mg de sódio por dia, o que equivale a menos de 5 g de sal (uma colher de chá rasa). A maior parte do sódio vem de ultraprocessados, embutidos, temperos prontos, salgadinhos e fast-food.
Estratégias: cozinhar com ervas, alho, cebola, limão e especiarias; ler rótulos (a lupa frontal indica "alto em sódio"); padrão DASH rico em frutas, verduras, laticínios magros e leguminosas.`,
    sources: ["OMS, Guideline: Sodium intake, 2012/2023", "Sociedade Brasileira de Cardiologia, Diretrizes de Hipertensão, 2020"],
    reviewedBy: null,
  },
  {
    slug: "guia-alimentar-brasileiro",
    title: "Guia Alimentar para a População Brasileira",
    tags: ["guia alimentar", "in natura", "ultraprocessado", "processado", "comida de verdade", "nova"],
    body: `O guia oficial do Ministério da Saúde recomenda: fazer de alimentos in natura ou minimamente processados a base da alimentação (arroz, feijão, legumes, verduras, frutas, ovos, carnes, leite); usar óleos, sal e açúcar em pequenas quantidades ao cozinhar; limitar processados (conservas, queijos, pães artesanais) e evitar ultraprocessados (refrigerantes, salgadinhos, biscoitos recheados, embutidos, macarrão instantâneo).
Também valoriza comer com regularidade, com atenção, em companhia, e desenvolver habilidades culinárias.`,
    sources: ["Ministério da Saúde, Guia Alimentar para a População Brasileira, 2ª ed., 2014"],
    reviewedBy: null,
  },
  {
    slug: "acucar",
    title: "Açúcar e açúcares livres",
    tags: ["acucar", "doce", "refrigerante", "acucares livres", "adocante"],
    body: `OMS: açúcares livres (adicionados + mel, xaropes e sucos) abaixo de 10% das calorias diárias, idealmente abaixo de 5% (cerca de 25 g para uma dieta de 2000 kcal). O açúcar das frutas inteiras e do leite não entra nessa conta.
Bebidas açucaradas são a principal fonte e não saciam. Adoçantes aprovados pela ANVISA são seguros dentro da ingestão diária aceitável, mas a OMS (2023) não os recomenda como estratégia de controle de peso a longo prazo.`,
    sources: ["OMS, Guideline: Sugars intake, 2015", "OMS, Guideline: Non-sugar sweeteners, 2023"],
    reviewedBy: null,
  },
  {
    slug: "cafeina-alcool",
    title: "Cafeína e álcool",
    tags: ["cafe", "cafeina", "alcool", "cerveja", "vinho", "energetico", "pre treino"],
    body: `Cafeína: para adultos saudáveis, até ~400 mg/dia (cerca de 3–4 xícaras de café coado) é considerado seguro; gestantes até 200 mg/dia. Melhora desempenho em exercício, mas pode atrapalhar o sono se consumida à tarde/noite. Energéticos e pré-treinos podem ter quantidades altas.
Álcool: a OMS afirma que não há nível seguro de consumo para a saúde. Tem 7 kcal/g sem nutrientes, prejudica sono, recuperação e síntese de proteína muscular, e eleva triglicerídeos e ácido úrico.`,
    sources: ["EFSA, Scientific Opinion on caffeine safety, 2015", "OMS, declaração sobre álcool, 2023", "Parr EB et al., PLoS One 2014"],
    reviewedBy: null,
  },
  {
    slug: "dietas-da-moda",
    title: "Jejum intermitente, cetogênica, detox e dietas da moda",
    tags: ["jejum intermitente", "jejum", "cetogenica", "keto", "detox", "low carb", "dieta da moda", "paleo"],
    body: `Jejum intermitente funciona para emagrecer na medida em que reduz calorias; estudos comparando com restrição contínua mostram resultados semelhantes. Pode ser útil para quem se adapta, mas não é superior.
Cetogênica tem indicações médicas (ex.: epilepsia refratária); para emagrecer, resultados se igualam a outras dietas no longo prazo quando calorias são equivalentes.
Dietas "detox", sucos detox e chás milagrosos não têm evidência: fígado e rins fazem a desintoxicação. Dietas muito restritivas, de baixíssimas calorias ou que eliminam grupos inteiros sem motivo exigem acompanhamento profissional. Pessoas com diabetes em uso de medicação, gestantes e quem tem histórico de transtorno alimentar não devem jejuar sem orientação.`,
    sources: ["Lowe DA et al., JAMA Intern Med 2020", "Trepanowski JF et al., JAMA Intern Med 2017", "Gardner CD et al., JAMA 2018 (DIETFITS)"],
    reviewedBy: null,
  },
  {
    slug: "suplementos",
    title: "Suplementos: o que a evidência diz (sem dosagens)",
    tags: ["suplemento", "creatina", "whey", "cafeina", "multivitaminico", "bcaa", "termogenico", "colageno"],
    body: `A Green não indica doses de suplementos: prescrição é de nutricionista ou médico. Panorama geral da evidência:
Com evidência forte para desempenho/composição corporal: creatina monohidratada (a mais estudada; geralmente segura em pessoas saudáveis), cafeína, proteína em pó como forma prática de atingir a meta diária.
Evidência fraca ou desnecessária quando a proteína total é adequada: BCAA, glutamina, termogênicos, "queimadores de gordura".
Multivitamínicos não substituem alimentação e não previnem doenças em quem não tem deficiência. No Brasil, suplementos são regulados pela ANVISA (RDC 243/2018); produtos sem registro/notificação ou com promessas milagrosas devem ser evitados.`,
    sources: ["Kreider RB et al., ISSN Position Stand: creatine, 2017", "Kerksick CM et al., ISSN exercise & sports nutrition review, 2018", "ANVISA RDC 243/2018", "USPSTF, vitamin supplementation, 2022"],
    reviewedBy: null,
  },
  {
    slug: "sono-recuperacao",
    title: "Sono, recuperação e resultados",
    tags: ["sono", "recuperacao", "descanso", "cortisol", "fome", "ansiedade comer"],
    body: `Dormir pouco (menos de ~7 h) aumenta fome e preferência por alimentos calóricos, piora a recuperação muscular e, em déficit calórico, aumenta a proporção de massa magra perdida. Adultos: 7–9 h por noite.
Rotina regular, menos cafeína à tarde, menos álcool e refeições mais leves perto de dormir ajudam.`,
    sources: ["Nedeltcheva AV et al., Ann Intern Med 2010", "Hirshkowitz M et al., National Sleep Foundation, 2015"],
    reviewedBy: null,
  },
  {
    slug: "vegetarianos-nutrientes-criticos",
    title: "Nutrientes de atenção em dietas vegetarianas e veganas",
    tags: ["vegano", "vegetariano", "nutrientes criticos", "deficiencia", "plant based"],
    body: `Dietas vegetarianas bem planejadas são adequadas em todas as fases da vida. Nutrientes de atenção: vitamina B12 (veganos precisam de fortificados ou suplemento orientado), ferro (vitamina C junto, longe de café/chá), zinco (molho/germinação de leguminosas), cálcio (tofu com cálcio, bebidas fortificadas, couve, brócolis), ômega-3 (linhaça, chia, nozes; óleo de algas se indicado), iodo (sal iodado), vitamina D (sol) e proteína (soja e leguminosas diariamente).
Exames periódicos (B12, ferritina, vitamina D) ajudam a ajustar.`,
    sources: ["Academy of Nutrition and Dietetics: Position on Vegetarian Diets, 2016", "Sociedade Vegetariana Brasileira, Guia Alimentar de Dietas Vegetarianas para Adultos, 2012"],
    reviewedBy: null,
  },
  {
    slug: "anemias",
    title: "Tipos de anemia e alimentação",
    tags: ["anemia", "hemoglobina", "vcm", "cansaco", "palidez", "megaloblastica", "ferropriva"],
    body: `Anemia é hemoglobina baixa (OMS: < 13 g/dL homens, < 12 g/dL mulheres não gestantes). As causas mais ligadas à nutrição são falta de ferro (glóbulos pequenos, VCM baixo, ferritina baixa) e falta de B12 ou folato (glóbulos grandes, VCM alto). Também existem anemias por doenças crônicas, perdas de sangue e causas genéticas.
Por isso a alimentação ajuda, mas o tratamento depende da causa definida pelo médico; suplementar ferro sem necessidade pode fazer mal.`,
    sources: ["OMS, Hemoglobin concentrations for the diagnosis of anaemia, 2011/2024", "Camaschella C, NEJM 2015"],
    reviewedBy: null,
  },
  {
    slug: "idosos-sarcopenia",
    title: "Proteína e músculo após os 60 (sarcopenia)",
    tags: ["idoso", "sarcopenia", "envelhecimento", "massa muscular", "60 anos", "terceira idade"],
    body: `Com a idade o músculo responde menos à proteína (resistência anabólica). Recomendação de consenso: 1,0–1,2 g/kg/dia para idosos saudáveis e 1,2–1,5 g/kg/dia para ativos ou com doenças agudas/crônicas (exceto doença renal avançada sem acompanhamento).
Distribuir 25–30 g de proteína por refeição e combinar com treino de força é a estratégia mais eficaz contra sarcopenia. Vitamina D e cálcio adequados protegem ossos.`,
    sources: ["Bauer J et al., PROT-AGE Study Group, 2013", "Deutz NE et al., ESPEN Expert Group, Clin Nutr 2014"],
    reviewedBy: null,
  },
  {
    slug: "rotulos",
    title: "Como ler rótulos de alimentos no Brasil",
    tags: ["rotulo", "tabela nutricional", "lupa", "rotulagem", "ingredientes", "porcao"],
    body: `Desde 2022 (ANVISA RDC 429/2020 e IN 75/2020), a tabela nutricional mostra valores por 100 g ou 100 mL e por porção, e a lupa frontal alerta quando o produto é alto em açúcar adicionado, gordura saturada ou sódio.
A lista de ingredientes vem em ordem decrescente de quantidade: se açúcar, gordura ou farinha refinada aparecem primeiro, eles predominam. Ingredientes com nomes que você não usaria em casa (xarope de glicose, gordura vegetal, aromatizantes, emulsificantes) indicam ultraprocessado.`,
    sources: ["ANVISA RDC 429/2020", "ANVISA IN 75/2020"],
    reviewedBy: null,
  },
  {
    slug: "vitaminas-lipossoluveis",
    title: "Vitaminas A, E e K e excesso de vitaminas",
    tags: ["vitamina a", "vitamina e", "vitamina k", "varfarina", "toxicidade", "excesso", "lipossoluveis"],
    body: `Vitaminas A, D, E e K são lipossolúveis: precisam de gordura na refeição para absorção e se acumulam no corpo, por isso suplementos em excesso podem intoxicar (limites superiores: vitamina A pré-formada 3000 µg/dia; vitamina E de suplementos 1000 mg/dia; vitamina D 4000 UI/dia).
Fontes: vitamina A em fígado, ovos, laticínios e carotenoides de cenoura, abóbora, manga e folhas; vitamina E em sementes de girassol, amêndoas, avelã, azeite; vitamina K em folhas verde-escuras (couve, espinafre, salsa) e brócolis.
Quem usa varfarina deve manter ingestão de vitamina K estável (não eliminar folhas) e avisar o médico antes de mudanças grandes.`,
    sources: ["IOM DRI 2000/2001", "NIH ODS Fact Sheets"],
    reviewedBy: null,
  },
  {
    slug: "interacoes-alimento-medicamento",
    title: "Interações entre alimentos e medicamentos (visão geral)",
    tags: ["interacao", "medicamento", "remedio", "levotiroxina", "varfarina", "toranja", "grapefruit"],
    body: `Exemplos conhecidos: levotiroxina costuma ser tomada em jejum e afastada de cálcio, ferro e café; varfarina exige ingestão estável de vitamina K; toranja (grapefruit) interage com algumas estatinas e anti-hipertensivos; laticínios e ferro reduzem absorção de alguns antibióticos (tetraciclinas, quinolonas); álcool interage com muitos remédios.
A Green só dá a visão geral: horários e combinações com medicamentos devem ser confirmados com médico ou farmacêutico, que conhecem a prescrição completa.`,
    sources: ["Bula/monografias ANVISA", "Bushra R et al., Oman Med J 2011 (revisão de interações)"],
    reviewedBy: null,
  },
  {
    slug: "tireoide",
    title: "Tireoide e alimentação",
    tags: ["tireoide", "hipotireoidismo", "hipertireoidismo", "iodo", "selenio", "tsh", "bocio", "soja"],
    body: `Iodo é essencial para os hormônios da tireoide; no Brasil o sal iodado cobre a maioria das pessoas, e excesso de iodo (suplementos, algas) também faz mal. Selênio adequado (1–2 castanhas-do-pará) contribui.
Vegetais crucíferos e soja em quantidades normais, especialmente cozidos, não causam problemas em quem tem iodo suficiente. Dieta não substitui tratamento: alterações de TSH/T4 são avaliadas pelo médico.`,
    sources: ["American Thyroid Association, Iodine deficiency & Thyroid and diet", "ANVISA RDC 23/2013"],
    reviewedBy: null,
  },
  {
    slug: "gestacao",
    title: "Gestação e amamentação",
    tags: ["gravida", "gestante", "gestacao", "amamentacao", "lactante", "bebe"],
    body: `Gestação e amamentação mudam necessidades de energia, ferro, folato, iodo, ômega-3 e outros nutrientes, e algumas restrições alimentares se aplicam (peixes ricos em mercúrio, carnes e ovos crus, queijos não pasteurizados, álcool; cafeína até 200 mg/dia). Planos alimentares nessas fases devem ser feitos com nutricionista e obstetra; a Green oferece apenas informações gerais.`,
    sources: ["OMS, recomendações de cuidado pré-natal, 2016", "EFSA caffeine 2015", "Ministério da Saúde, Caderneta da Gestante"],
    reviewedBy: null,
  },
  {
    slug: "transtornos-alimentares",
    title: "Relação difícil com a comida e transtornos alimentares",
    tags: ["compulsao", "anorexia", "bulimia", "transtorno alimentar", "culpa", "restricao", "vomitar", "purgacao"],
    body: `Sinais de alerta: restrição extrema, medo intenso de engordar, culpa ou compensação depois de comer (vômito, laxantes, exercício excessivo), episódios de comer descontrolado, pensamentos constantes sobre comida e corpo.
Nesses casos, metas de calorias, pesagens frequentes e dietas restritivas pioram o quadro; o caminho é acompanhamento com psicólogo, psiquiatra e nutricionista (UBS e CAPS atendem pelo SUS). Em sofrimento intenso, o CVV atende 24 h pelo 188 (ligação gratuita) ou cvv.org.br; em emergência, SAMU 192.`,
    sources: ["APA Practice Guideline: Eating Disorders, 2023", "Ministério da Saúde (RAPS/CAPS)"],
    reviewedBy: null,
  },
  {
    slug: "pre-pos-treino",
    title: "O que comer antes e depois do treino",
    tags: ["pre treino", "pos treino", "antes do treino", "depois do treino", "janela anabolica", "jejum treino"],
    body: `Antes (1–3 h): refeição com carboidrato e proteína moderada, pouca gordura/fibra se houver desconforto (ex.: pão com ovos, iogurte com fruta e aveia, arroz com frango). Se o intervalo for curto (30–60 min), algo leve como banana.
Depois: refeição completa com proteína (20–40 g) e carboidrato nas horas seguintes. O total do dia importa mais que minutos exatos. Treinar em jejum é possível para treinos leves, mas pode reduzir desempenho em treinos intensos.`,
    sources: ["Kerksick CM et al., ISSN Position Stand: nutrient timing, 2017", "Schoenfeld BJ, Aragon AA, J Int Soc Sports Nutr 2018"],
    reviewedBy: null,
  },
];
