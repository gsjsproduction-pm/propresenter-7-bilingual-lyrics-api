import { findBlockStart, findMatchingBraceEnd } from "./braceScanner";
import { buildRtfDataField, escapeProtoString, findRtfDataMatches } from "./rtf.service";
import { getNoSupersubSegmentsV2, setTranslationTextV2 } from "./rtfV2.service";
import { translateLinesIdEn } from "./translate.service";

interface CueSpan {
  start: number;
  end: number;
  text: string;
}

function findAllCueBlocks(decodedText: string): CueSpan[] {
  const spans: CueSpan[] = [];
  let searchFrom = 0;
  for (;;) {
    const fieldStart = decodedText.indexOf("\ncues {", searchFrom);
    const start = fieldStart === -1 ? -1 : fieldStart + 1;
    if (start === -1) break;
    const braceStart = findBlockStart(decodedText, "cues", start);
    const end = findMatchingBraceEnd(decodedText, braceStart);
    spans.push({ start, end, text: decodedText.slice(start, end) });
    searchFrom = end;
  }
  return spans;
}

/**
 * v2 of fillMissingTranslations: reads the primary (fs104) lyric text as a
 * list of per-`\cb3`-run segments (a two-line lyric in one text box wraps
 * across two runs), translates each segment independently, then writes them
 * into the secondary (fs74) body by synthesizing matching `\cb3` runs so the
 * translated line wraps the same way the primary line does.
 */
export async function fillMissingTranslationsV2(
  decodedText: string,
  additionalContextEn?: string,
): Promise<string> {
  const cueSpans = findAllCueBlocks(decodedText);

  interface PendingFill {
    cueIndex: number;
    body: string;
    primarySegments: string[];
  }
  const pending: PendingFill[] = [];

  cueSpans.forEach((cue, cueIndex) => {
    const rtfMatches = findRtfDataMatches(cue.text);
    const primary = rtfMatches.find((m) => m.fontSize === 104);
    const secondary = rtfMatches.find((m) => m.fontSize === 74);
    if (!primary || !secondary) return;

    const primarySegments = getNoSupersubSegmentsV2(primary.body);
    const secondarySegments = getNoSupersubSegmentsV2(secondary.body);
    if (primarySegments.length > 0 && secondarySegments.length === 0) {
      pending.push({ cueIndex, body: secondary.body, primarySegments });
    }
  });

  if (pending.length === 0) return decodedText;

  // Flatten every cue's segments into one translation batch, in order, then
  // regroup back into per-cue segment arrays using each cue's segment count.
  const flatSegments = pending.flatMap((p) => p.primarySegments);
  const translations = await translateLinesIdEn(flatSegments, additionalContextEn);

  const updatedCueTexts = new Map<number, string>();
  let translationCursor = 0;
  pending.forEach((fill) => {
    const translatedSegments = fill.primarySegments.map(
      () => translations[translationCursor++].translation,
    );
    const cueText = updatedCueTexts.get(fill.cueIndex) ?? cueSpans[fill.cueIndex].text;
    const escapedSegments = translatedSegments.map((t) => escapeProtoString(t));
    const newBody = setTranslationTextV2(fill.body, escapedSegments);
    const newField = buildRtfDataField(newBody);
    const oldField = buildRtfDataField(fill.body);
    updatedCueTexts.set(fill.cueIndex, cueText.replace(oldField, newField));
  });

  const segments: string[] = [];
  let cursor = 0;
  cueSpans.forEach((cue, i) => {
    segments.push(decodedText.slice(cursor, cue.start));
    segments.push(updatedCueTexts.get(i) ?? cue.text);
    cursor = cue.end;
  });
  segments.push(decodedText.slice(cursor));

  return segments.join("");
}
