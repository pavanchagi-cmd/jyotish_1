/**
 * Engine conventions (spec section 5). Changing any of these changes every
 * chart, so bump ENGINE_VERSION; stored charts with an older version are
 * recomputed on read.
 */
export const ENGINE_VERSION = "1.0.0";

export type AyanamsaName = "lahiri";
export type NodeType = "mean";

export const ENGINE_CONFIG = {
  ayanamsa: "lahiri" as AyanamsaName,
  nodeType: "mean" as NodeType,
  houseSystem: "whole-sign" as const,
  /** Vimshottari year length in days (owner decision: 365.25). */
  dashaYearDays: 365.25,
};
