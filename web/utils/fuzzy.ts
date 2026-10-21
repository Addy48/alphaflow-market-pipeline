/**
 * BellCurve Data Fuzzy Search Utility
 * Bigram-based fuzzy match scoring for Command Palette search
 */

/**
 * Compute a fuzzy similarity score between query and target.
 * Returns 0.0–1.0 (1.0 = perfect match).
 * Uses: exact substring (1.0) > prefix match (0.9) > bigram overlap.
 */
export function fuzzyScore(query: string, target: string): number {
  const q = query.toLowerCase().trim();
  const t = target.toLowerCase();

  if (!q) return 1.0;
  if (t === q) return 1.0;
  if (t.startsWith(q)) return 0.95;
  if (t.includes(q)) return 0.85;
  if (q.length < 2) return 0;

  // Bigram overlap score
  const getBigrams = (s: string): Set<string> => {
    const set = new Set<string>();
    for (let i = 0; i < s.length - 1; i++) {
      set.add(s.slice(i, i + 2));
    }
    return set;
  };

  const qGrams = getBigrams(q);
  const tGrams = getBigrams(t);
  if (qGrams.size === 0 || tGrams.size === 0) return 0;

  let overlap = 0;
  qGrams.forEach((g) => {
    if (tGrams.has(g)) overlap++;
  });

  return (2 * overlap) / (qGrams.size + tGrams.size);
}

/**
 * Filter and sort an array of strings by fuzzy match score against query.
 * Returns only those with score > threshold (default 0.1).
 */
export function fuzzyFilter(
  query: string,
  candidates: string[],
  threshold = 0.1
): string[] {
  if (!query) return candidates;
  return candidates
    .map((c) => ({ c, score: fuzzyScore(query, c) }))
    .filter((x) => x.score > threshold)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.c);
}
