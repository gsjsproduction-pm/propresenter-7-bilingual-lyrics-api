/**
 * Finds the index just past the closing '}' that matches the '{' at openBraceIndex,
 * treating braces inside double-quoted strings (protoc text-format string literals,
 * which themselves may contain literal RTF '{' / '}') as inert.
 */
export function findMatchingBraceEnd(text: string, openBraceIndex: number): number {
  let depth = 0;
  let inString = false;

  for (let i = openBraceIndex; i < text.length; i++) {
    const ch = text[i];

    if (inString) {
      if (ch === "\\") {
        i++; // skip escaped char
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }

    if (ch === '"') {
      inString = true;
    } else if (ch === "{") {
      depth++;
    } else if (ch === "}") {
      depth--;
      if (depth === 0) {
        return i + 1;
      }
    }
  }

  throw new Error("Unbalanced braces: no matching closing brace found");
}

/** Finds the '{' that opens the block introduced by `fieldName {` at or after fromIndex. */
export function findBlockStart(text: string, fieldName: string, fromIndex = 0): number {
  const marker = `${fieldName} {`;
  const idx = text.indexOf(marker, fromIndex);
  if (idx === -1) {
    throw new Error(`Field block "${fieldName}" not found`);
  }
  return idx + marker.length - 1;
}
