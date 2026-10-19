import React from "react";

/**
 * Normalizes Vietnamese text by converting to lowercase and stripping accents/diacritics.
 * Replaces 'đ' and 'Đ' with 'd'.
 */
export function normalizeVietnamese(str: string | null | undefined): string {
  if (!str) return "";
  return str
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .toLowerCase()
    .trim();
}

/**
 * Calculates a relevance score for matching `query` within `target`.
 * Returns:
 * - 0: No match
 * - 100: Exact match with diacritics (case-insensitive substring)
 * - 80: Word prefix match with diacritics
 * - 60: Unaccented whole word match
 * - 40: Unaccented word prefix match
 * - 20: Unaccented general substring match
 */
export function getSearchScore(target: string | null | undefined, query: string | null | undefined): number {
  if (!target || !query) return 0;
  const tRaw = target.toString().trim();
  const qRaw = query.toString().trim();
  if (!qRaw) return 0;

  const tLower = tRaw.toLowerCase();
  const qLower = qRaw.toLowerCase();

  // Level 1: Exact accented substring
  if (tLower === qLower) return 100;
  if (tLower.startsWith(qLower)) return 95;
  if (tLower.includes(` ${qLower}`) || tLower.includes(qLower)) return 85;

  // Accented word prefix match
  const words = tLower.split(/\s+/);
  if (words.some((w) => w.startsWith(qLower))) return 80;

  // Normalization for unaccented search
  const tNorm = normalizeVietnamese(tRaw);
  const qNorm = normalizeVietnamese(qRaw);

  if (!tNorm || !qNorm) return 0;

  // Level 2: Unaccented exact or word match
  if (tNorm === qNorm) return 70;
  const normWords = tNorm.split(/\s+/);
  if (normWords.some((w) => w === qNorm)) return 60;

  // Level 3: Unaccented word prefix
  if (tNorm.startsWith(qNorm) || normWords.some((w) => w.startsWith(qNorm))) return 45;

  // Level 4: Unaccented substring
  if (tNorm.includes(qNorm)) return 25;

  return 0;
}

/**
 * Checks if target matches query (case-insensitive and accent-insensitive).
 */
export function matchesVietnamese(target: string | null | undefined, query: string | null | undefined): boolean {
  if (!query || !query.trim()) return true;
  return getSearchScore(target, query) > 0;
}

/**
 * Filters and automatically sorts items by relevance score descending.
 */
export function filterAndRankList<T>(
  items: T[],
  query: string,
  extractFields: (item: T) => (string | null | undefined)[]
): T[] {
  const q = (query || "").trim();
  if (!q) return items;

  const scoredItems = items
    .map((item) => {
      const fields = extractFields(item);
      let maxScore = 0;
      for (const field of fields) {
        if (field) {
          const score = getSearchScore(field, q);
          if (score > maxScore) maxScore = score;
        }
      }
      return { item, score: maxScore };
    })
    .filter((entry) => entry.score > 0);

  scoredItems.sort((a, b) => b.score - a.score);
  return scoredItems.map((entry) => entry.item);
}

/**
 * Highlights the matched characters/substring in text for visual clarity in search suggestions.
 */
export function highlightMatches(
  text: string | null | undefined,
  query: string | null | undefined
): React.ReactNode {
  if (!text) return "";
  const rawText = text.toString();
  const q = (query || "").trim();
  if (!q) return rawText;

  const normText = normalizeVietnamese(rawText);
  const normQuery = normalizeVietnamese(q);

  if (!normQuery) return rawText;

  const matchIdx = normText.indexOf(normQuery);
  if (matchIdx === -1) {
    return rawText;
  }

  // Slice original string according to the index in normalized string
  // (NFKD decomposition length might differ slightly, but for ASCII unaccented matching it aligns well)
  const len = Math.min(q.length, rawText.length - matchIdx);
  const before = rawText.slice(0, matchIdx);
  const match = rawText.slice(matchIdx, matchIdx + len);
  const after = rawText.slice(matchIdx + len);

  return React.createElement(
    React.Fragment,
    null,
    before,
    React.createElement("span", { className: "font-bold text-blue-600 bg-blue-50 px-0.5 rounded-sm" }, match),
    after
  );
}
