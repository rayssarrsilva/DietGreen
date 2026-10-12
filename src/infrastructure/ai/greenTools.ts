import type Anthropic from "@anthropic-ai/sdk";
import type { GreenRepository } from "@/domain/repositories/greenInterfaces";
import type { MealPlanRepository } from "@/domain/repositories/interfaces";
import { findMarker } from "@/domain/services/labClassifier";
import { LAB_MARKERS } from "@/infrastructure/knowledge/labMarkers";
import {
  foodsRichIn,
  lookupFoods,
  RICH_IN_NUTRIENTS,
  searchArticles,
  type DietFilter,
} from "@/infrastructure/knowledge/knowledgeBase";

export interface ToolContext {
  userId: string;
  greenRepo: GreenRepository;
  mealPlans: MealPlanRepository;
  canReadLabs: boolean;
}

const DIETS: DietFilter[] = ["any", "vegetarian", "vegan", "pescatarian", "no_red_meat"];

export const GREEN_TOOLS: Anthropic.Tool[] = [
  {
    name: "search_knowledge",
    description:
      "Busca na base curada de nutrição do DietGreen (diretrizes, consensos e estudos). Use antes de responder dúvidas de nutrição, objetivos físicos, vitaminas, minerais, condições de saúde e mitos.",
    input_schema: {
      type: "object",
      properties: { query: { type: "string", description: "Termos de busca em português" } },
      required: ["query"],
    },
  },
  {
    name: "lookup_foods",
    description:
      "Retorna a composição nutricional por 100 g de alimentos pelo nome (TACO/UNICAMP; B12, vitamina D, folato, selênio, vitaminas E e K e ômega-3 pela tabela complementar USDA). Use antes de citar números de um alimento.",
    input_schema: {
      type: "object",
      properties: { query: { type: "string", description: "Nome do alimento, ex.: 'feijão preto cozido'" } },
      required: ["query"],
    },
  },
  {
    name: "foods_rich_in",
    description: "Lista os alimentos com maior teor de um nutriente por 100 g, filtrando por perfil alimentar.",
    input_schema: {
      type: "object",
      properties: {
        nutrient: { type: "string", enum: [...RICH_IN_NUTRIENTS] },
        diet: { type: "string", enum: DIETS },
        limit: { type: "integer", minimum: 3, maximum: 15 },
      },
      required: ["nutrient", "diet"],
    },
  },
  {
    name: "get_lab_reference",
    description:
      "Retorna metas de diretriz, unidade, limiares de alerta e estratégias alimentares para um marcador de exame de sangue (ex.: 'ferritina', 'vitamina D', 'LDL').",
    input_schema: {
      type: "object",
      properties: { marker: { type: "string" } },
      required: ["marker"],
    },
  },
  {
    name: "get_my_lab_results",
    description: "Retorna os resultados de exames que a pessoa salvou no DietGreen (se ela autorizou o armazenamento).",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "get_my_meal_plan",
    description: "Retorna o resumo do cardápio mais recente que a pessoa gerou no DietGreen (perfil, objetivo e metas diárias).",
    input_schema: { type: "object", properties: {} },
  },
];

function str(value: unknown): string {
  return typeof value === "string" ? value.slice(0, 200) : "";
}

export async function executeGreenTool(name: string, input: unknown, ctx: ToolContext): Promise<string> {
  const args = (input ?? {}) as Record<string, unknown>;
  switch (name) {
    case "search_knowledge": {
      const hits = searchArticles(str(args.query), 3);
      if (hits.length === 0) return "Nada encontrado na base curada para esses termos.";
      return hits
        .map(
          (h) =>
            `## ${h.title}\n${h.body}\nFontes: ${h.sources.join("; ")}${h.reviewedByProfessional ? "\n(Revisado por nutricionista)" : ""}`
        )
        .join("\n\n");
    }
    case "lookup_foods":
      return lookupFoods(str(args.query));
    case "foods_rich_in": {
      const diet = DIETS.includes(args.diet as DietFilter) ? (args.diet as DietFilter) : "any";
      const limit = typeof args.limit === "number" ? args.limit : 10;
      return foodsRichIn(str(args.nutrient), diet, limit);
    }
    case "get_lab_reference": {
      const ref = findMarker(str(args.marker), LAB_MARKERS);
      if (!ref) {
        return `Marcador não está na base de referência. Marcadores disponíveis: ${LAB_MARKERS.map((m) => m.label).join(", ")}. Para outros, use apenas a faixa do laudo e oriente avaliação médica.`;
      }
      return JSON.stringify({
        marcador: ref.label,
        unidade_canonica: ref.unit,
        meta_diretriz: ref.guideline,
        alerta_critico: ref.critical,
        nota: ref.notes,
        se_baixo: ref.foodFocusLow,
        se_alto: ref.foodFocusHigh,
      });
    }
    case "get_my_lab_results": {
      if (!ctx.canReadLabs) return "A pessoa não autorizou guardar exames, então não há resultados salvos.";
      const reports = await ctx.greenRepo.listLabReports(ctx.userId);
      if (reports.length === 0) return "Nenhum exame salvo.";
      return JSON.stringify(
        reports.slice(0, 3).map((r) => ({
          coleta: r.collectedAt,
          laboratorio: r.labName,
          resultados: r.values.map((v) => ({
            marcador: v.marker,
            valor: v.value,
            unidade: v.unit,
            faixa_laudo: v.labRangeText ?? [v.labRangeLow, v.labRangeHigh].filter((x) => x !== null).join("–"),
            situacao_laudo: v.labStatus,
            situacao_diretriz: v.guidelineStatus,
            critico: v.critical,
          })),
        }))
      );
    }
    case "get_my_meal_plan": {
      const plans = await ctx.mealPlans.listByUser(ctx.userId);
      const latest = plans[0];
      if (!latest) return "A pessoa ainda não gerou cardápio no DietGreen.";
      const t = latest.plan.macroTarget;
      return JSON.stringify({
        perfil: latest.dietaryProfileSlug,
        objetivo: latest.goalSlug,
        dias: latest.daysCount,
        gerado_em: latest.createdAt.toISOString().slice(0, 10),
        metas_diarias: {
          calorias_manutencao: t.maintenanceCalories,
          calorias_alvo: t.targetCalories,
          proteina_g: t.proteinG,
          carboidrato_g: t.carbsG,
          gordura_g: t.fatG,
          fibra_g: t.fiberG,
        },
      });
    }
    default:
      return `Ferramenta desconhecida: ${name}`;
  }
}
