/**
 * SmartCampus — Bibliography Builder
 * Sprint 7: APA-format generation + duplicate cleaner
 *
 * Formats references in Indonesian academic APA-like style:
 *   Author. (Year). Title [Edition]. Publisher.
 *   Author. (Year). Title. Journal, Volume(Issue), Pages.
 *
 * Duplicate policy: Same `id` appears only once. Sorting: alphabetical by author surname.
 */

import { AcademicReference } from "./referenceEngine";

// ─── APA Formatter ────────────────────────────────────────────────────────────

/**
 * Format a book reference in APA style.
 * Kotler, Philip & Keller, Kevin Lane. (2016). Marketing Management (15th ed.). Pearson Education.
 */
function formatBook(ref: AcademicReference): string {
  const parts: string[] = [];
  parts.push(`${ref.author}. (${ref.year}). ${ref.title}`);
  if (ref.edition) parts[0] += ` (${ref.edition} ed.)`;
  parts[0] += ".";
  if (ref.publisher) {
    const pub = ref.city ? `${ref.publisher}.` : `${ref.publisher}.`;
    parts.push(pub);
  }
  return parts.join(" ");
}

/**
 * Format a journal article in APA style.
 * Maslow, A.H. (1943). A Theory of Human Motivation. Psychological Review, 50(4), 370–396.
 */
function formatJournal(ref: AcademicReference): string {
  let entry = `${ref.author}. (${ref.year}). ${ref.title}.`;
  if (ref.journal) {
    entry += ` *${ref.journal}*`;
    if (ref.volume) {
      entry += `, *${ref.volume}*`;
      if (ref.issue) entry += `(${ref.issue})`;
    }
    if (ref.pages) entry += `, ${ref.pages}`;
    entry += ".";
  }
  if (ref.doi) entry += ` https://doi.org/${ref.doi}`;
  return entry;
}

/**
 * Format a website in APA style.
 */
function formatWebsite(ref: AcademicReference): string {
  let entry = `${ref.author}. (${ref.year}). ${ref.title}.`;
  if (ref.url) entry += ` Diambil dari ${ref.url}`;
  return entry;
}

/**
 * Format a proceeding in APA style.
 */
function formatProceeding(ref: AcademicReference): string {
  let entry = `${ref.author}. (${ref.year}). ${ref.title}.`;
  if (ref.journal) entry += ` Dalam ${ref.journal}`;
  if (ref.pages)   entry += ` (hal. ${ref.pages})`;
  if (ref.publisher) entry += `. ${ref.publisher}.`;
  return entry;
}

/**
 * Format a thesis/dissertation in APA style.
 */
function formatThesis(ref: AcademicReference): string {
  let entry = `${ref.author}. (${ref.year}). ${ref.title}`;
  if (ref.publisher) entry += ` [Skripsi/Tesis, ${ref.publisher}]`;
  entry += ".";
  return entry;
}

/**
 * Formats a single AcademicReference into an APA-style bibliography entry.
 * Asterisks (*) denote italic in markdown; they're stripped in plain-text output.
 */
export function formatAPA(ref: AcademicReference, asPlainText = true): string {
  let entry: string;

  switch (ref.type) {
    case "journal":    entry = formatJournal(ref);    break;
    case "proceeding": entry = formatProceeding(ref); break;
    case "website":    entry = formatWebsite(ref);    break;
    case "thesis":     entry = formatThesis(ref);     break;
    case "book":
    default:           entry = formatBook(ref);       break;
  }

  // Strip markdown italics for plain-text DOCX output
  if (asPlainText) entry = entry.replace(/\*/g, "");
  return entry;
}

// ─── Surname Extractor ────────────────────────────────────────────────────────

/** Extracts the first author's surname for alphabetical sorting. */
function firstAuthorSurname(ref: AcademicReference): string {
  const first = ref.author.split("&")[0].trim();
  // "Kotler, Philip" → "Kotler" | "Sugiyono" → "Sugiyono"
  const comma = first.indexOf(",");
  return (comma !== -1 ? first.slice(0, comma) : first).toLowerCase();
}

// ─── Bibliography Builder ─────────────────────────────────────────────────────

/**
 * Builds a deduplicated, alphabetically sorted bibliography.
 * Duplicate IDs are removed (Sprint 7: same Sugiyono cite 5× → 1× in bibliography).
 *
 * @param refs - Array of AcademicReference objects (may contain duplicates).
 * @returns Array of formatted APA strings, ready to be written to DOCX.
 */
export function buildBibliography(refs: AcademicReference[]): string[] {
  // Deduplicate by ID
  const seen    = new Set<string>();
  const unique  = refs.filter((r) => {
    if (seen.has(r.id)) return false;
    seen.add(r.id);
    return true;
  });

  // Sort alphabetically by first author surname
  unique.sort((a, b) => firstAuthorSurname(a).localeCompare(firstAuthorSurname(b)));

  return unique.map((r) => formatAPA(r));
}

/**
 * Same as `buildBibliography` but returns `{ entry, ref }` pairs
 * for rich UI rendering (e.g., to show status badges).
 */
export function buildBibliographyWithMeta(
  refs: AcademicReference[]
): Array<{ entry: string; ref: AcademicReference }> {
  const seen   = new Set<string>();
  const unique = refs.filter((r) => { if (seen.has(r.id)) return false; seen.add(r.id); return true; });
  unique.sort((a, b) => firstAuthorSurname(a).localeCompare(firstAuthorSurname(b)));
  return unique.map((ref) => ({ entry: formatAPA(ref), ref }));
}
