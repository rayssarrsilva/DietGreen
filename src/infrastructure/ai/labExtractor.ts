import type Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import type { ExtractedLabValue, TokenUsage } from "@/domain/entities/green";
import { getAnthropic } from "@/infrastructure/ai/anthropicClient";

export const SUPPORTED_ATTACHMENT_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp"] as const;
export type AttachmentType = (typeof SUPPORTED_ATTACHMENT_TYPES)[number];

const resultSchema = z.object({
  is_lab_report: z.boolean(),
  collected_at: z.string().nullable().optional(),
  lab_name: z.string().nullable().optional(),
  results: z
    .array(
      z.object({
        marker: z.string().min(1).max(120),
        value: z.number(),
        unit: z.string().max(40),
        ref_low: z.number().nullable().optional(),
        ref_high: z.number().nullable().optional(),
        ref_text: z.string().max(200).nullable().optional(),
      })
    )
    .max(120),
});

const TOOL: Anthropic.Tool = {
  name: "record_lab_results",
  description: "Registra os resultados numéricos lidos de um laudo de exame laboratorial.",
  input_schema: {
    type: "object",
    properties: {
      is_lab_report: { type: "boolean", description: "false se o arquivo não for um laudo de exame laboratorial" },
      collected_at: { type: ["string", "null"], description: "Data da coleta no formato AAAA-MM-DD, se visível" },
      lab_name: { type: ["string", "null"], description: "Nome do laboratório, se visível" },
      results: {
        type: "array",
        items: {
          type: "object",
          properties: {
            marker: { type: "string", description: "Nome do exame/analito como aparece no laudo" },
            value: { type: "number", description: "Resultado numérico (use ponto como separador decimal)" },
            unit: { type: "string" },
            ref_low: { type: ["number", "null"], description: "Limite inferior da faixa de referência do laudo" },
            ref_high: { type: ["number", "null"], description: "Limite superior da faixa de referência do laudo" },
            ref_text: { type: ["string", "null"], description: "Texto da referência quando não for uma faixa simples" },
          },
          required: ["marker", "value", "unit"],
        },
      },
    },
    required: ["is_lab_report", "results"],
  },
};

const INSTRUCTIONS = `Leia este laudo de exame laboratorial e registre com a ferramenta record_lab_results cada analito com resultado numérico.
Regras:
- Copie valores e unidades exatamente como no laudo; converta vírgula decimal para ponto (ex.: "13,5" → 13.5).
- Faixa de referência: use ref_low/ref_high quando for intervalo simples; se houver faixas por sexo/idade ou texto (ex.: "Desejável: < 190"), coloque em ref_text e preencha ref_low/ref_high apenas se for inequívoco.
- Ignore resultados não numéricos (ex.: "negativo"), hemograma qualitativo e observações.
- NÃO registre nome do paciente, CPF, número de pedido, médico solicitante ou qualquer dado pessoal.
- Se o arquivo não for um laudo laboratorial, chame a ferramenta com is_lab_report=false e results vazio.`;

export interface ExtractionResult {
  isLabReport: boolean;
  collectedAt: string | null;
  labName: string | null;
  values: ExtractedLabValue[];
  usage: TokenUsage;
}

export async function extractLabResults(input: {
  model: string;
  bytes: Buffer;
  mediaType: AttachmentType;
}): Promise<ExtractionResult> {
  const client = getAnthropic();
  const data = input.bytes.toString("base64");
  const fileBlock: Anthropic.ContentBlockParam =
    input.mediaType === "application/pdf"
      ? { type: "document", source: { type: "base64", media_type: "application/pdf", data } }
      : { type: "image", source: { type: "base64", media_type: input.mediaType, data } };

  const response = await client.messages.create({
    model: input.model,
    max_tokens: 4000,
    tools: [TOOL],
    tool_choice: { type: "tool", name: TOOL.name },
    messages: [{ role: "user", content: [fileBlock, { type: "text", text: INSTRUCTIONS }] }],
  });

  const usage: TokenUsage = {
    inputTokens: response.usage.input_tokens ?? 0,
    outputTokens: response.usage.output_tokens ?? 0,
    cacheWriteTokens: response.usage.cache_creation_input_tokens ?? 0,
    cacheReadTokens: response.usage.cache_read_input_tokens ?? 0,
  };

  const toolUse = response.content.find((b): b is Anthropic.ToolUseBlock => b.type === "tool_use");
  const parsed = resultSchema.safeParse(toolUse?.input);
  if (!parsed.success) {
    return { isLabReport: false, collectedAt: null, labName: null, values: [], usage };
  }
  const collectedAt = parsed.data.collected_at && /^\d{4}-\d{2}-\d{2}$/.test(parsed.data.collected_at) ? parsed.data.collected_at : null;
  return {
    isLabReport: parsed.data.is_lab_report,
    collectedAt,
    labName: parsed.data.lab_name ?? null,
    values: parsed.data.results.map((r) => ({
      marker: r.marker,
      value: r.value,
      unit: r.unit,
      labRangeLow: r.ref_low ?? null,
      labRangeHigh: r.ref_high ?? null,
      labRangeText: r.ref_text ?? null,
    })),
    usage,
  };
}
