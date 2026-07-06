// Data model — CURIO.md §9

export type Level = "dabble" | "digin" | "deep";
export type TimeBudget = "2m" | "15m" | "1h" | "half-day" | "multi-day";
export type CostBudget = "free" | "cheap" | "splurge";
export type Setting = "home" | "outdoors" | "errand";

export interface Skill {
  id: string; // drawer code, e.g. "PHO"
  name: string;
  oneLiner: string;
}

export interface Challenge {
  id: string; // e.g. "PHO-014"
  skillId: string;
  title: string;
  image?: string; // optional card photo URL — when present it replaces the line-motif symbol on the deck card & detail; the symbol is the permanent fallback
  level: Level;
  ladderStep?: number; // rung within a skill's ladder
  microLesson: string;
  task: string;
  stages?: { day: string; task: string }[];
  needs?: string[];
  accessibleAlternate?: string;
  safetyTier?: "note" | "acknowledge";
  safetyNote?: string;
  encouragement: string;
  resources: { inspiration: string; goDeeper: string };
  budget: { time: TimeBudget; cost: CostBudget; setting: Setting };
  together?: boolean; // great as a date / two-person activity
  funnyResultsExpected?: boolean;
  shareTemplate: string;
}

export interface LogEntry {
  challengeId: string;
  rating: 1 | 2 | 3 | 4 | 5;
  tag?: "boring" | "too-hard" | "not-me";
  note?: string;
  photoRef?: string; // compressed data-URL thumbnail — evidence for future-you
  date: string; // YYYY-MM-DD local
}
