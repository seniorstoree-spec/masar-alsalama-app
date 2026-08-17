/**
 * Arabic String Normalization & Text Utilities
 */

/**
 * Normalizes Arabic text for consistent searching and matching.
 * - Removes diacritics (tashkeel) and tatweel
 * - Unifies alef forms (أ, إ, آ -> ا)
 * - Unifies yaa/alef-maksura (ى -> ي)
 * - Unifies teh-marbuta (ة -> ه)
 * - Unifies hamza forms (ؤ, ئ -> ء)
 * - Trims and normalizes multiple spaces to a single space
 */
export function normalizeArabicText(text: string | null | undefined): string {
  if (!text) return "";
  return String(text)
    .replace(/[\u064B-\u0652\u0640]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[ؤئ]/g, "ء")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/**
 * Cleans cell values from imported sheets or raw user inputs.
 */
export function cleanCell(value: unknown): string {
  const str = String(value ?? "").trim();
  if (str === "" || str === "-" || str === "—" || str.startsWith("#")) {
    return "";
  }
  return str;
}

/**
 * Checks if a text matches a query string using normalized Arabic text matching.
 */
export function matchesQuery(text: string | null | undefined, query: string): boolean {
  if (!query.trim()) return true;
  const normalizedText = normalizeArabicText(text);
  const normalizedQuery = normalizeArabicText(query);
  return normalizedText.includes(normalizedQuery);
}

/**
 * Truncates string to a maximum length with trailing ellipsis.
 */
export function truncateText(text: string | null | undefined, maxLength: number): string {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1)}…`;
}
