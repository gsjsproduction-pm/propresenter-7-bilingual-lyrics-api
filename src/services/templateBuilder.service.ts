import { findBlockStart, findMatchingBraceEnd } from "./braceScanner";
import { regenerateCueUuids } from "./cue.service";
import { escapeProtoString } from "./rtf.service";

export interface BilingualLine {
  primaryText: string;
  secondaryText: string;
}

const CUE_UUID_RE = /^cues \{\s*\n\s*uuid \{\s*\n\s*string: "([0-9a-fA-F-]+)"/;

/**
 * Takes the decoded (protoc text-format) template presentation, which contains
 * exactly one sample `cues { ... }` block with PRIMARY_TEXT / SECONDARY_TEXT
 * placeholders, and produces a new decoded presentation with one cue per line.
 */
export function buildPresentationFromLines(templateDecodedText: string, lines: BilingualLine[]): string {
  const cueGroupsFieldStart = templateDecodedText.indexOf("cue_groups {");
  if (cueGroupsFieldStart === -1) {
    throw new Error("Template is missing a cue_groups block");
  }
  const cueGroupsBraceStart = findBlockStart(templateDecodedText, "cue_groups", cueGroupsFieldStart);
  const cueGroupsEnd = findMatchingBraceEnd(templateDecodedText, cueGroupsBraceStart);
  const cueGroupsBlock = templateDecodedText.slice(cueGroupsFieldStart, cueGroupsEnd);

  const groupFieldStart = cueGroupsBlock.indexOf("group {");
  if (groupFieldStart === -1) {
    throw new Error("Template cue_groups block is missing a group sub-block");
  }
  const groupBraceStart = findBlockStart(cueGroupsBlock, "group", groupFieldStart);
  const groupEnd = findMatchingBraceEnd(cueGroupsBlock, groupBraceStart);
  const groupBlock = cueGroupsBlock.slice(groupFieldStart, groupEnd);

  const cuesFieldStart = templateDecodedText.indexOf("cues {", cueGroupsEnd);
  if (cuesFieldStart === -1) {
    throw new Error("Template is missing a cues block");
  }
  const cuesBraceStart = findBlockStart(templateDecodedText, "cues", cuesFieldStart);
  const cuesEnd = findMatchingBraceEnd(templateDecodedText, cuesBraceStart);
  const templateCueBlock = templateDecodedText.slice(cuesFieldStart, cuesEnd);

  const cueUuidMatch = templateCueBlock.match(CUE_UUID_RE);
  if (!cueUuidMatch) {
    throw new Error("Could not locate the template cue's top-level uuid");
  }
  const originalCueUuid = cueUuidMatch[1];

  if (!templateCueBlock.includes("PRIMARY_TEXT") || !templateCueBlock.includes("SECONDARY_TEXT")) {
    throw new Error("Template cue is missing PRIMARY_TEXT / SECONDARY_TEXT placeholders");
  }

  const header = templateDecodedText.slice(0, cueGroupsFieldStart);
  const footer = templateDecodedText.slice(cuesEnd);

  const generatedCueUuids: string[] = [];
  const cueBlocks = lines.map((line) => {
    const { text, newCueUuid } = regenerateCueUuids(templateCueBlock, originalCueUuid);
    generatedCueUuids.push(newCueUuid);
    return text
      .replace("PRIMARY_TEXT", escapeProtoString(line.primaryText.toUpperCase()))
      .replace("SECONDARY_TEXT", escapeProtoString(line.secondaryText.toUpperCase()));
  });

  const newCueIdentifiers = generatedCueUuids
    .map((uuid) => `  cue_identifiers {\n    string: "${uuid}"\n  }\n`)
    .join("");
  const newCueGroupsBlock = `cue_groups {\n  ${groupBlock}\n${newCueIdentifiers}}\n`;

  return header + newCueGroupsBlock + cueBlocks.join("\n") + footer;
}
