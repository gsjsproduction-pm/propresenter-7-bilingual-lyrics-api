import OpenAI from "openai";
import { config } from "../config";

let client: OpenAI | null = null;
function getClient(): OpenAI {
  if (!config.openaiApiKey) {
    throw new Error("OPENAI_API_KEY is not set");
  }
  if (!client) {
    client = new OpenAI({
      apiKey: config.openaiApiKey,
      baseURL: "https://openrouter.ai/api/v1",
    });
  }
  return client;
}

export interface TranslatedLine {
  original: string;
  translation: string;
  detectedLanguage: "id" | "en";
}

/**
 * Detects whether each input line is Indonesian or English and translates it
 * into the other language, preserving order. Empty input returns [].
 *
 * `additionalContextEn` is optional free-form English guidance (song title,
 * theme, terminology preferences, tone) folded into the prompt to steer the
 * translation without changing the input/output line contract.
 */
export async function translateLinesIdEn(
  lines: string[],
  additionalContextEn?: string,
): Promise<TranslatedLine[]> {
  if (lines.length === 0) return [];

  const systemContent =
    "You translate worship/lyric lines between Indonesian and English for a bilingual ProPresenter slide. " +
    "For each input line, detect whether it is Indonesian ('id') or English ('en'), then translate it into " +
    "the OTHER language. Keep translations natural, singable, and concise — matching the line's meaning and " +
    "tone rather than a stiff literal translation. Return strict JSON: " +
    '{"lines":[{"original":"...","translation":"...","detectedLanguage":"id"|"en"}, ...]} ' +
    "with exactly one output object per input line, in the same order." +
    (additionalContextEn?.trim()
      ? `\n\nAdditional context from the requester (in English) to guide the translation: ${additionalContextEn.trim()}`
      : "");

  const response = await getClient().chat.completions.create({
    model: "openai/gpt-4o-mini",
    temperature: 0,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: systemContent,
      },
      {
        role: "user",
        content: JSON.stringify({ lines }),
      },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Empty response from translation model");
  }

  const parsed = JSON.parse(content) as { lines: TranslatedLine[] };
  if (!Array.isArray(parsed.lines) || parsed.lines.length !== lines.length) {
    throw new Error("Translation model returned a mismatched number of lines");
  }
  return parsed.lines;
}
