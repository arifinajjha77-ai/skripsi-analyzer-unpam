import OpenAI from "openai";
import { DEFAULT_MODEL, INTERNAL_FALLBACK_MODEL } from "./models";

let client: OpenAI | null = null;

export function hasOpenAIKey(): boolean {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

export function getOpenAIClient(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return null;
  client ??= new OpenAI({ apiKey });
  return client;
}

export async function generateJsonWithOpenAI<T>(prompt: string, options?: { timeoutMs?: number; signal?: AbortSignal; maxOutputTokens?: number }): Promise<{ data: T; model: string } | null> {
  const openai = getOpenAIClient();
  if (!openai) return null;
  const signal = options?.timeoutMs ? AbortSignal.any([AbortSignal.timeout(options.timeoutMs), ...(options.signal ? [options.signal] : [])]) : options?.signal;

  for (const model of [DEFAULT_MODEL, INTERNAL_FALLBACK_MODEL]) {
    if (signal?.aborted) return null;
    try {
      const response = await openai.responses.create({
        model,
        input: prompt,
        text: { format: { type: "json_object" } },
        ...(options?.maxOutputTokens ? { max_output_tokens: options.maxOutputTokens } : {}),
      }, options ? { signal, timeout: options.timeoutMs, maxRetries: 0 } : undefined);
      const text = extractOutputText(response);
      if (!text) continue;
      return { data: JSON.parse(repairJson(text)) as T, model };
    } catch {
      continue;
    }
  }

  return null;
}

export function repairJson(value: string): string {
  const trimmed = value.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1]?.trim();
  const candidate = fenced || trimmed;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  return start >= 0 && end > start ? candidate.slice(start, end + 1) : candidate;
}

function extractOutputText(response: unknown): string {
  const shaped = response as { output_text?: string; output?: Array<{ content?: Array<{ text?: string }> }> };
  return shaped.output_text || shaped.output?.flatMap((item) => item.content || []).map((item) => item.text).filter(Boolean).join("\n") || "";
}
