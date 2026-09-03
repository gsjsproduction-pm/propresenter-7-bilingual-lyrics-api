/** Escapes text for embedding inside a protoc text-format string literal. */
export function escapeProtoString(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

const NOSUPERSUB_EMPTY_MARKER = "nosupersub}";
const NOSUPERSUB_MARKER = "nosupersub ";

/**
 * Reads the lyric text out of a raw (still protoc-escaped) rtf_data string body.
 * Returns "" when the placeholder has no text yet (i.e. body ends in "nosupersub}").
 */
export function getNoSupersubText(rawRtfBody: string): string {
  if (rawRtfBody.endsWith(NOSUPERSUB_EMPTY_MARKER)) return "";
  const idx = rawRtfBody.lastIndexOf(NOSUPERSUB_MARKER);
  if (idx === -1) return "";
  return rawRtfBody.slice(idx + NOSUPERSUB_MARKER.length, -1);
}

/**
 * Fills in the lyric text, same literal-placeholder approach as the template's
 * PRIMARY_TEXT / SECONDARY_TEXT: rewrites "...nosupersub}" into
 * "...nosupersub <TRANSLATION>}".
 */
export function setNoSupersubText(rawRtfBody: string, newEscapedText: string): string {
  if (rawRtfBody.endsWith(NOSUPERSUB_EMPTY_MARKER)) {
    return rawRtfBody.replace(NOSUPERSUB_EMPTY_MARKER, `${NOSUPERSUB_MARKER}${newEscapedText}}`);
  }
  const idx = rawRtfBody.lastIndexOf(NOSUPERSUB_MARKER);
  if (idx === -1) {
    throw new Error("rtf_data body has no nosupersub marker");
  }
  return rawRtfBody.slice(0, idx + NOSUPERSUB_MARKER.length) + newEscapedText + "}";
}

export interface RtfDataMatch {
  /** Index range of the full `rtf_data: "..."` match in the containing text. */
  start: number;
  end: number;
  /** Raw (protoc-escaped) string body, without the surrounding quotes. */
  body: string;
  fontSize: 104 | 74 | null;
}

const RTF_DATA_RE = /rtf_data: "((?:[^"\\]|\\.)*)"/g;

export function findRtfDataMatches(text: string): RtfDataMatch[] {
  const matches: RtfDataMatch[] = [];
  RTF_DATA_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = RTF_DATA_RE.exec(text)) !== null) {
    const body = m[1];
    const fontSize = body.includes("\\\\fs104") ? 104 : body.includes("\\\\fs74") ? 74 : null;
    matches.push({ start: m.index, end: m.index + m[0].length, body, fontSize });
  }
  return matches;
}

export function buildRtfDataField(body: string): string {
  return `rtf_data: "${body}"`;
}
