/** Manufacturer naming variations that are safe to fold together. */
const MAKE_ALIASES: Record<string, string> = {
  "MERCEDES": "MERCEDES BENZ",
  "MERC": "MERCEDES BENZ",
  "MERCEDES BENZ": "MERCEDES BENZ",
  "MERCEDESBENZ": "MERCEDES BENZ",
  "BENZ": "MERCEDES BENZ",
  "VW": "VOLKSWAGEN",
  "LAND ROVER": "LANDROVER",
  "RANGE ROVER": "LANDROVER RANGE ROVER",
  "CHEVY": "CHEVROLET",
  "BMW": "BMW",
};

/** Case/space/punctuation folding shared by the importer and the search query. */
export function normalizeText(input: string): string {
  return input
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Normalizes a user query: folds punctuation, applies manufacturer aliases and
 * splits glued model tokens such as "GLE450d" -> "GLE 450 D".
 */
export function normalizeQuery(input: string): string {
  let q = normalizeText(input);
  for (const [alias, canonical] of Object.entries(MAKE_ALIASES)) {
    const re = new RegExp(`(^|\\s)${alias}(\\s|$)`, "g");
    if (re.test(q)) q = q.replace(re, `$1${canonical}$2`);
  }
  q = q
    .replace(/([A-Z])(\d)/g, "$1 $2")
    .replace(/(\d)([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim();
  return q;
}

/** Query tokens used for AND-style filtering, longest first. */
export function queryTokens(input: string): string[] {
  return normalizeQuery(input)
    .split(" ")
    .filter((t) => t.length > 0);
}
