// Re-export shared types and pure functions for backwards compatibility with web imports.
// The source of truth is now @t2/shared.
export type {
  Profile,
  AnalysisInput,
  Analysis,
  Verdict,
} from "@t2/shared";
export { analyze, fmt } from "@t2/shared";
