import type Anthropic from "@anthropic-ai/sdk";
import type { TokenUsage } from "@/domain/entities/green";
import { getAnthropic } from "@/infrastructure/ai/anthropicClient";

export interface GreenTurnResult {
  text: string;
  usage: TokenUsage;
  apiCalls: number;
}

function addUsage(total: TokenUsage, usage: Anthropic.Usage): void {
  total.inputTokens += usage.input_tokens ?? 0;
  total.outputTokens += usage.output_tokens ?? 0;
  total.cacheWriteTokens += usage.cache_creation_input_tokens ?? 0;
  total.cacheReadTokens += usage.cache_read_input_tokens ?? 0;
}

export async function runGreenTurn(options: {
  model: string;
  system: Anthropic.TextBlockParam[];
  messages: Anthropic.MessageParam[];
  maxTokens: number;
  tools: Anthropic.Tool[];
  executeTool: (name: string, input: unknown) => Promise<string>;
  onText: (delta: string) => void;
  maxToolRounds?: number;
  signal?: AbortSignal;
}): Promise<GreenTurnResult> {
  const client = getAnthropic();
  const messages = [...options.messages];
  const usage: TokenUsage = { inputTokens: 0, outputTokens: 0, cacheWriteTokens: 0, cacheReadTokens: 0 };
  const maxRounds = options.maxToolRounds ?? 3;
  let text = "";
  let apiCalls = 0;

  for (let round = 0; round <= maxRounds; round += 1) {
    const lastRound = round === maxRounds;
    if (text && !text.endsWith("\n")) {
      text += "\n\n";
      options.onText("\n\n");
    }
    const stream = client.messages.stream(
      {
        model: options.model,
        max_tokens: options.maxTokens,
        system: options.system,
        messages,
        tools: options.tools,
        ...(lastRound ? { tool_choice: { type: "none" as const } } : {}),
      },
      { signal: options.signal }
    );
    stream.on("text", (delta) => {
      text += delta;
      options.onText(delta);
    });
    const final = await stream.finalMessage();
    apiCalls += 1;
    addUsage(usage, final.usage);

    if (final.stop_reason !== "tool_use" || lastRound) break;

    const toolUses = final.content.filter((block): block is Anthropic.ToolUseBlock => block.type === "tool_use");
    messages.push({ role: "assistant", content: final.content });
    const results: Anthropic.ToolResultBlockParam[] = [];
    for (const toolUse of toolUses) {
      let content: string;
      try {
        content = await options.executeTool(toolUse.name, toolUse.input);
      } catch (err) {
        console.error("green tool failed", toolUse.name, err);
        content = "A ferramenta falhou; responda sem esse dado e avise se faltar informação.";
      }
      results.push({ type: "tool_result", tool_use_id: toolUse.id, content: content.slice(0, 12000) });
    }
    messages.push({ role: "user", content: results });
  }

  return { text: text.trim(), usage, apiCalls };
}
