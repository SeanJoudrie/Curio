import { CHALLENGES } from "./data/challenges";
import { completedChallengeIds, getSkips, getBoosts, todayStr } from "./storage";
import type { Challenge } from "./types";

// Deterministic daily pick: same challenge all day, new one tomorrow (CURIO.md §3).
function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

// Budget moods (CURIO.md §3) — one tap, not three dials.
export type Mood = "any" | "date" | "cozy" | "quick" | "splurge";
export const MOODS: { id: Mood; label: string }[] = [
  { id: "any", label: "Anything" },
  { id: "date", label: "💞 Date night" },
  { id: "cozy", label: "🌙 Cozy in" },
  { id: "quick", label: "⏱ Killing 15 min" },
  { id: "splurge", label: "✨ Treat yourselves" },
];

function fitsMood(c: Challenge, m: Mood): boolean {
  if (m === "any") return true;
  if (m === "date") return c.together === true;
  if (m === "cozy") return c.budget.setting === "home" && c.budget.cost !== "splurge";
  if (m === "quick") return c.budget.time === "2m" || c.budget.time === "15m";
  return c.budget.cost === "splurge"; // treat yourselves
}

function pool(mood: Mood): Challenge[] {
  const done = completedChallengeIds();
  const skipped = new Set(getSkips());
  const boosts = getBoosts();
  // Never re-serve until exhausted; skips + mutes deprioritized, never deleted.
  const usable = (cs: Challenge[]) => cs.filter((c) => fitsMood(c, mood) && (boosts[c.skillId] ?? 0) > -2);
  let p = usable(CHALLENGES.filter((c) => !done.has(c.id) && !skipped.has(c.id)));
  if (p.length === 0) p = usable(CHALLENGES.filter((c) => !done.has(c.id)));
  if (p.length === 0) p = usable(CHALLENGES);
  if (p.length === 0) p = CHALLENGES.filter((c) => fitsMood(c, mood));
  return p.length > 0 ? p : CHALLENGES;
}

// Boost-weighted, wildcard-protected pick (CURIO.md §3–4):
// boosted drawers appear more; ~20% of picks ignore preferences entirely.
function weightedPick(p: Challenge[], seed: number): Challenge {
  if (seed % 5 === 0) return p[seed % p.length]; // the ~20% wildcard
  const boosts = getBoosts();
  const weighted: Challenge[] = [];
  for (const c of p) {
    const w = 2 + (boosts[c.skillId] ?? 0); // affinity -1..2 → weight 1..4
    for (let i = 0; i < Math.max(1, w); i++) weighted.push(c);
  }
  return weighted[seed % weighted.length];
}

export function todaysCurio(rerolls = 0, mood: Mood = "any"): Challenge {
  // Today's main event is a real-world challenge, not a 2-minute filler.
  const p = pool(mood).filter((c) => c.budget.time !== "2m");
  const base = p.length > 0 ? p : pool(mood);
  return weightedPick(base, hash(todayStr() + ":" + rerolls + ":" + mood));
}

// The Right-Now tier (CURIO.md §2): 60–120s, phone-only, leads the home screen.
export function rightNowCurio(): Challenge | undefined {
  const p = pool("any").filter((c) => c.budget.time === "2m");
  if (p.length === 0) return undefined;
  return p[hash(todayStr() + ":rn") % p.length];
}

// A finite hand of 5–7 — a hand is a decision, a stack is a scroll (CURIO.md §3).
export function dealHand(excludeId: string | undefined, mood: Mood): Challenge[] {
  const p = pool(mood).filter((c) => c.id !== excludeId);
  const seed = hash(todayStr() + ":hand:" + mood);
  const shuffled = [...p].sort((a, b) => (hash(a.id + seed) % 997) - (hash(b.id + seed) % 997));
  return shuffled.slice(0, Math.min(6, shuffled.length));
}
