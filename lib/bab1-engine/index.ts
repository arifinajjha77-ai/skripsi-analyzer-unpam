/**
 * BAB I Engine — modular academic writing modules for UNPAM thesis generation.
 *
 * Re-exports all engine functions for convenient single-import access.
 */

export { selectOpening, detectOpeningCategory } from "./openingEngine";
export type { OpeningCategory } from "./openingEngine";

export { getCitationFor, getCitationTag, getTwoCitations } from "./authorMapping";
export type { AuthorEntry } from "./authorMapping";

export {
  buildTheoryBridge,
  buildDataTheoryBridge,
  buildUrgencyParagraph,
} from "./citationEngine";
export type { BridgeParagraph } from "./citationEngine";

export { buildResearchGap } from "./researchGapEngine";
export type { ResearchGapInput, TrendKey } from "./researchGapEngine";

export { checkBab1Quality, getBab1Score } from "./qualityChecker";
export type { QualityItem } from "./qualityChecker";
