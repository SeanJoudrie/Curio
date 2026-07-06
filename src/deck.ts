import { CHALLENGES } from "./data/challenges";
import { completedChallengeIds, getSkips, getBoosts, getSaved, getLog, todayStr } from "./storage";
import type { Challenge } from "./types";

// ---- Adaptive taste (learned, on-device) ----------------------------------
// After the first 5 completions we know enough to nudge: drawers the user
// completes, rates 4–5, or saves float up a little. It NUDGES, never filters —
// manual mutes still win, the wildcard still fires, and a diversity pass keeps
// the deck from becoming all one drawer (we push novelty, not a bubble).
export function autoAffinity(): Record<string, number> {
  const log = getLog();
  if (log.length < 5) return {}; // learn quietly first
  const score: Record<string, number> = {};
  for (const e of log) {
    const d = e.challengeId.split("-")[0];
    score[d] = (score[d] ?? 0) + (e.rating >= 4 ? 1.5 : e.rating === 3 ? 0.5 : -0.5);
  }
  for (const id of getSaved()) {
    const d = id.split("-")[0];
    score[d] = (score[d] ?? 0) + 0.75;
  }
  const out: Record<string, number> = {};
  for (const [d, s] of Object.entries(score)) out[d] = Math.max(-1, Math.min(2, s / 2));
  return out;
}

// Manual boosts (Tune my deck + rating nudges) blended with learned taste.
function effectiveBoosts(): Record<string, number> {
  const manual = getBoosts();
  const auto = autoAffinity();
  const out: Record<string, number> = { ...manual };
  for (const [d, a] of Object.entries(auto)) {
    if ((manual[d] ?? 0) <= -2) continue; // a mute is a mute
    out[d] = Math.max(-2, Math.min(3, (manual[d] ?? 0) + a));
  }
  return out;
}

// Deterministic daily pick: same challenge all day, new one tomorrow (CURIO.md §3).
function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

// Budget moods (CURIO.md §3) — one tap, not three dials.
export type Mood = "any" | "free" | "cheap" | "splurge" | "date" | "quick";
export const MOODS: { id: Mood; label: string }[] = [
  { id: "any", label: "All" },
  { id: "free", label: "Free" },
  { id: "cheap", label: "Under $20" },
  { id: "splurge", label: "Splurge" },
  { id: "date", label: "Date" },
  { id: "quick", label: "Quick" },
];

function fitsMood(c: Challenge, m: Mood): boolean {
  if (m === "any") return true;
  if (m === "free") return c.budget.cost === "free";
  if (m === "cheap") return c.budget.cost === "cheap";
  if (m === "splurge") return c.budget.cost === "splurge";
  if (m === "date") return c.together === true;
  if (m === "quick") return c.budget.time === "2m" || c.budget.time === "15m";
  return true;
}

// An ordered, taste-weighted deck to swipe through (CURIO.md §3).
export function swipeDeck(mood: Mood): Challenge[] {
  const done = completedChallengeIds();
  const skipped = new Set(getSkips());
  const manual = getBoosts(); // manual mute always wins
  const eff = effectiveBoosts(); // manual + learned taste
  let fresh = CHALLENGES.filter((c) => fitsMood(c, mood) && !done.has(c.id) && !skipped.has(c.id) && (manual[c.skillId] ?? 0) > -2 && c.budget.time !== "2m");
  if (fresh.length === 0) fresh = CHALLENGES.filter((c) => fitsMood(c, mood) && !done.has(c.id) && c.budget.time !== "2m");
  const seed = hash(todayStr() + ":swipe:" + mood);
  // taste-weighted shuffle: loved drawers float up…
  const ordered = fresh
    .map((c) => ({ c, k: (hash(c.id + seed) % 1000) - (eff[c.skillId] ?? 0) * 80 }))
    .sort((a, b) => a.k - b.k)
    .map((x) => x.c);
  // …but never three of the same drawer in a row — variety is the mission.
  const out: Challenge[] = [];
  const deferred: Challenge[] = [];
  for (const c of ordered) {
    const n = out.length;
    if (n >= 2 && out[n - 1].skillId === c.skillId && out[n - 2].skillId === c.skillId) { deferred.push(c); continue; }
    out.push(c);
    for (let i = 0; i < deferred.length; i++) {
      const d = deferred[i], m = out.length;
      if (!(m >= 2 && out[m - 1].skillId === d.skillId && out[m - 2].skillId === d.skillId)) { out.push(d); deferred.splice(i, 1); i--; }
    }
  }
  out.push(...deferred);
  return out.slice(0, 40);
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
  if (seed % 5 === 0) return p[seed % p.length]; // the ~20% wildcard — taste never silences novelty
  const boosts = effectiveBoosts(); // manual + learned taste
  const weighted: Challenge[] = [];
  for (const c of p) {
    const w = 2 + (boosts[c.skillId] ?? 0); // affinity -2..3 → weight 1..5
    for (let i = 0; i < Math.max(1, w); i++) weighted.push(c);
  }
  return weighted[seed % weighted.length];
}

// The treasure-chest daily pick: one deterministic favorite per day, drawn from
// the featured pool (adventurous + curated best), skipping ones already done.
export function dailyFeatured(): Challenge {
  const done = completedChallengeIds();
  const featured = CHALLENGES.filter((c) => c.featured && c.budget.time !== "2m");
  const fresh = featured.filter((c) => !done.has(c.id));
  const pool = fresh.length > 0 ? fresh : featured.length > 0 ? featured : CHALLENGES;
  return pool[hash(todayStr() + ":daily") % pool.length];
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
