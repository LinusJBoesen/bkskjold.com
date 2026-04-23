/**
 * Map DBU full names (e.g. "Magnus Hyldahl Marker") to our player IDs.
 *
 * Spond gives us each player's real `first_name` and `last_name` (e.g.
 * first="Magnus", last="Marker"). DBU prints the full legal name with
 * additional middle/last components (e.g. "Magnus Hyldahl Marker"). The
 * reliable rule is: a DBU name maps to a player iff the normalized DBU
 * tokens start with the player's first_name AND end with the player's
 * last_name. We refuse to guess if multiple players match.
 *
 * Manual overrides cover cases where Spond's first/last is not the legal
 * name — e.g. Linus Johan Boesen has a Spond display of "Linus Johan 2."
 * with last_name "2100" because there were two Linus Johans in the group.
 */

export type PlayerLite = {
  id: string;
  display_name: string;
  first_name?: string | null;
  last_name?: string | null;
};

function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

// Normalized DBU full name → player display_name. Used when Spond's
// first/last name doesn't match DBU's legal name.
const MANUAL_OVERRIDES: Record<string, string> = {
  "linus johan boesen": "Linus Johan 2.",
  "christian højby nielsen": "Christian H.",
  "jonathan balsov hansen": "Jonathan B.",
};

export type PlayerLookup = {
  manual: Map<string, string>; // normalized DBU name → player id
  byFirstLast: { id: string; first: string; last: string }[];
};

export function buildPlayerLookup(players: PlayerLite[]): PlayerLookup {
  const byDisplay = new Map<string, string>();
  for (const p of players) byDisplay.set(p.display_name, p.id);

  const manual = new Map<string, string>();
  for (const [dbuName, displayName] of Object.entries(MANUAL_OVERRIDES)) {
    const id = byDisplay.get(displayName);
    if (id) manual.set(dbuName, id);
  }

  const byFirstLast: { id: string; first: string; last: string }[] = [];
  for (const p of players) {
    if (!p.first_name || !p.last_name) continue;
    byFirstLast.push({
      id: p.id,
      first: normalize(p.first_name),
      last: normalize(p.last_name),
    });
  }

  return { manual, byFirstLast };
}

export function matchDbuName(
  dbuFullName: string,
  lookup: PlayerLookup
): string | null {
  const norm = normalize(dbuFullName);
  if (!norm) return null;

  const manual = lookup.manual.get(norm);
  if (manual) return manual;

  const matches: string[] = [];
  for (const p of lookup.byFirstLast) {
    if (norm === `${p.first} ${p.last}`) {
      matches.push(p.id);
      continue;
    }
    if (norm.startsWith(`${p.first} `) && norm.endsWith(` ${p.last}`)) {
      matches.push(p.id);
    }
  }
  // Only return a hit if exactly one player matches — never guess.
  if (matches.length === 1) return matches[0]!;
  return null;
}
