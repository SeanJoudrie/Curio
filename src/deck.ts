import { CHALLENGES } from "./data/challenges";
import { completedChallengeIds, getSkips, todayStr } from "./storage";
import type { Challenge } from "./types";

// Deterministic daily pick: same challenge all day, new one tomorrow (CURIO.md §3).
function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

function pool(): Challenge[] {
  const done = completedChallengeIds();
  const skipped = new Set(getSkips());
  // Never re-serve until the pool is exhausted; skips deprioritized, not deleted.
  const fresh = CHALLENGES.filter((c) => !done.has(c.id) && !skipped.has(c.id));
  if (fresh.length > 0) return fresh;
  const unskippedDone = CHALLENGES.filter((c) => !skipped.has(c.id));
  return unskippedDone.length > 0 ? unskippedDone : CHALLENGES;
}

export function todaysCurio(rerolls = 0): Challenge {
  const p = pool();
  const idx = hash(todayStr() + ":" + rerolls) % p.length;
  return p[idx];
}

// A finite hand of 5–7 — a hand is a decision, a stack is a scroll (CURIO.md §3).
export function dealHand(excludeId?: string): Challenge[] {
  const p = pool().filter((c) => c.id !== excludeId);
  const seed = hash(todayStr() + ":hand");
  const shuffled = [...p].sort((a, b) => (hash(a.id + seed) % 997) - (hash(b.id + seed) % 997));
  return shuffled.slice(0, Math.min(6, shuffled.length));
}
