import crypto from "crypto";

const UUID_RE = /"([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})"/g;
const ZERO_UUID = "00000000-0000-0000-0000-000000000000";

/**
 * Clones a `cues { ... }` block, giving every UUID inside it (cue, action,
 * element, base_slide, etc.) a fresh random value, except the all-zero
 * "no target" sentinel. Returns the cloned text plus the new top-level cue uuid
 * (the value that replaced `originalCueUuid`).
 */
export function regenerateCueUuids(
  cueBlockText: string,
  originalCueUuid: string
): { text: string; newCueUuid: string } {
  const map = new Map<string, string>();

  const text = cueBlockText.replace(UUID_RE, (full, uuid: string) => {
    if (uuid === ZERO_UUID) return full;
    let fresh = map.get(uuid);
    if (!fresh) {
      fresh = crypto.randomUUID();
      map.set(uuid, fresh);
    }
    return `"${fresh}"`;
  });

  const newCueUuid = map.get(originalCueUuid);
  if (!newCueUuid) {
    throw new Error(`Original cue uuid ${originalCueUuid} not found in cloned block`);
  }

  return { text, newCueUuid };
}
