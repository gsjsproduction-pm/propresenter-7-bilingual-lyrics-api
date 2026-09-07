/**
 * v2 rtf helpers: same as rtf.service.ts's getNoSupersubText, but reads lyric
 * text that wraps across multiple `\cb3 <text>` runs (a primary line split by
 * `\par\pard...\cb3` boilerplate instead of living after a single `nosupersub`
 * marker). v1 endpoints must keep using rtf.service.ts unchanged.
 */

const NOSUPERSUB_EMPTY_MARKER = "cb3}";

// Body here is still protoc-escaped text-format, so a literal RTF backslash
// is written as two backslash characters ("\\\\cb3" in JS source matches the
// two literal chars \\ + "cb3"). Matches each `\cb3 <text>` run: text runs
// until the next `\` control word or the closing `}`.
const CB3_RUN_RE = /\\\\cb3([^\\}]*)/g;

/** Returns the trimmed text of every `\cb3 <text>` run in body order. */
export function getNoSupersubSegmentsV2(rawRtfBody: string): string[] {
  if (rawRtfBody.endsWith(NOSUPERSUB_EMPTY_MARKER)) return [];
  const runs: string[] = [];
  CB3_RUN_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = CB3_RUN_RE.exec(rawRtfBody)) !== null) {
    const text = m[1].trim();
    if (text !== "") runs.push(text);
  }
  return runs;
}

/**
 * Concatenates every `\cb3 <text>` run (joined by a space) to reconstruct a
 * lyric line that wraps across multiple segments. Returns "" when none of the
 * runs carry text (i.e. body ends in "nosupersub}").
 */
export function getNoSupersubTextV2(rawRtfBody: string): string {
  return getNoSupersubSegmentsV2(rawRtfBody).join(" ");
}

// Body is still protoc-escaped text-format: one literal RTF backslash is
// written as two backslash characters, so every RTF token below is looked up
// as its doubled-backslash spelling ("\\\\pard" in JS source = the 6 literal
// characters \\pard).
const ESC_PARD = "\\\\pard";
const ESC_CB3 = "\\\\cb3";
const ESC_PAR = "\\\\par";
const ESC_STROKEC = "\\\\strokec";

/**
 * Writes N translated segments into a secondary (fs74) body that currently
 * holds a single empty `\cb3}` run, synthesizing the extra
 * `\par\pard...\cb3` separator blocks needed so the secondary line wraps the
 * same way as the primary line it was translated from. Mirrors the
 * `\strokec2`/`\strokec4` alternation observed on multi-run primary bodies.
 */
export function setTranslationTextV2(rawRtfBody: string, translatedSegments: string[]): string {
  if (translatedSegments.length === 0) {
    throw new Error("translatedSegments must not be empty");
  }
  if (!rawRtfBody.endsWith(NOSUPERSUB_EMPTY_MARKER)) {
    throw new Error("rtf_data body is not a single empty \\cb3 run");
  }
  const preambleEnd = rawRtfBody.length - "}".length;
  const preamble = rawRtfBody.slice(0, preambleEnd); // "...\\cb3"

  const pardStart = preamble.lastIndexOf(ESC_PARD);
  const cb3Start = preamble.lastIndexOf(ESC_CB3);
  if (pardStart === -1 || cb3Start === -1 || cb3Start < pardStart) {
    throw new Error("rtf_data body has no \\pard...\\cb3 block to clone");
  }
  const pardBlock = preamble.slice(pardStart, cb3Start + ESC_CB3.length);

  const strokecIdx = pardBlock.indexOf(ESC_STROKEC);
  const strokecDigitsStart = strokecIdx === -1 ? -1 : strokecIdx + ESC_STROKEC.length;
  const strokecDigitsMatch =
    strokecDigitsStart === -1 ? null : /^\d+/.exec(pardBlock.slice(strokecDigitsStart));
  const baseStrokec = strokecDigitsMatch ? strokecDigitsMatch[0] : "2";

  const withStrokec = (block: string, value: string): string => {
    if (strokecIdx === -1 || !strokecDigitsMatch) return block;
    return (
      block.slice(0, strokecDigitsStart) +
      value +
      block.slice(strokecDigitsStart + strokecDigitsMatch[0].length)
    );
  };

  let out = `${preamble} ${translatedSegments[0]}`;
  for (let i = 1; i < translatedSegments.length; i++) {
    const strokec = i % 2 === 1 ? "4" : baseStrokec;
    const separator = withStrokec(pardBlock, strokec);
    out += `${ESC_PAR}${separator} ${translatedSegments[i]}`;
  }
  return out + "}";
}
