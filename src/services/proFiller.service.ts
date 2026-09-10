import { findBlockStart, findMatchingBraceEnd } from "./braceScanner";
import {
  findRtfDataMatches,
  getNoSupersubText,
  setNoSupersubText,
  buildRtfDataField,
  escapeProtoString,
} from "./rtf.service";
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
 * For every cue in an existing decoded presentation, fills in the secondary
 * (fs74) lyric line via translation whenever the primary (fs104) line has real
 * text but the secondary is empty or missing. Cues that already have both
 * lines are left untouched.
 */
export async function fillMissingTranslations(
  decodedText: string,
  additionalContextEn?: string,
): Promise<string> {
  const cueSpans = findAllCueBlocks(decodedText);

  interface PendingFill {
    cueIndex: number;
    matchStart: number;
    matchEnd: number;
    body: string;
    primaryText: string;
  }
  const pending: PendingFill[] = [];

  cueSpans.forEach((cue, cueIndex) => {
    const rtfMatches = findRtfDataMatches(cue.text);
    const primary = rtfMatches.find((m) => m.fontSize === 104);
    const secondary = rtfMatches.find((m) => m.fontSize === 74);
    if (!primary || !secondary) return;

    const primaryText = getNoSupersubText(primary.body);
    const secondaryText = getNoSupersubText(secondary.body);
    if (primaryText.trim() !== "" && secondaryText.trim() === "") {
      pending.push({
        cueIndex,
        matchStart: secondary.start,
        matchEnd: secondary.end,
        body: secondary.body,
        primaryText,
      });
    }
  });

  if (pending.length === 0) return decodedText;

  const translations = await translateLinesIdEn(
    pending.map((p) => p.primaryText),
    additionalContextEn,
  );

  const updatedCueTexts = new Map<number, string>();
  pending.forEach((fill, i) => {
    const cueText = updatedCueTexts.get(fill.cueIndex) ?? cueSpans[fill.cueIndex].text;
    const newBody = setNoSupersubText(fill.body, escapeProtoString(translations[i].translation.toUpperCase()));
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
