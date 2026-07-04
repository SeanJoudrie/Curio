import type { LogEntry } from "./types";
import { getLog } from "./storage";

export interface Achievement {
  id: string;
  name: string;
  desc: string;
  test: (log: LogEntry[]) => boolean;
}

function countByDate(log: LogEntry[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const e of log) m.set(e.date, (m.get(e.date) ?? 0) + 1);
  return m;
}
function distinctDrawersOnBusiestDay(log: LogEntry[]): number {
  const byDate = new Map<string, Set<string>>();
  for (const e of log) {
    const d = byDate.get(e.date) ?? new Set();
    d.add(e.challengeId.split("-")[0]);
    byDate.set(e.date, d);
  }
  return Math.max(0, ...[...byDate.values()].map((s) => s.size));
}
function longestStreak(log: LogEntry[]): number {
  const days = [...new Set(log.map((e) => e.date))].sort();
  let best = 0, run = 0, prev = "";
  for (const d of days) {
    if (prev) {
      const gap = (Date.parse(d) - Date.parse(prev)) / 86400000;
      run = gap === 1 ? run + 1 : 1;
    } else run = 1;
    best = Math.max(best, run);
    prev = d;
  }
  return best;
}

// Growth-only, never punitive (CURIO.md §7): all about how much you've *tried*.
export const ACHIEVEMENTS: Achievement[] = [
  { id: "first", name: "First Curio", desc: "Log your very first challenge", test: (l) => l.length >= 1 },
  { id: "double", name: "Double Dip", desc: "Do 2 curios in one day", test: (l) => Math.max(0, ...countByDate(l).values()) >= 2 },
  { id: "triple", name: "On a Tear", desc: "Do 3 curios in one day", test: (l) => Math.max(0, ...countByDate(l).values()) >= 3 },
  { id: "loved", name: "Smitten", desc: "Rate a curio a full 5", test: (l) => l.some((e) => e.rating === 5) },
  { id: "wanderer", name: "Wanderer", desc: "Try 3 different drawers in one day", test: (l) => distinctDrawersOnBusiestDay(l) >= 3 },
  { id: "five", name: "Dabbler", desc: "Try 5 different skills", test: (l) => new Set(l.map((e) => e.challengeId.split("-")[0])).size >= 5 },
  { id: "ten", name: "Ten Tried", desc: "Log 10 curios total", test: (l) => l.length >= 10 },
  { id: "streak3", name: "Three-Day Rhythm", desc: "Log something 3 days running", test: (l) => longestStreak(l) >= 3 },
  { id: "collector", name: "The Collector", desc: "Fill 8 drawers of your cabinet", test: (l) => new Set(l.map((e) => e.challengeId.split("-")[0])).size >= 8 },
  { id: "twentyfive", name: "Curiouser", desc: "Log 25 curios total", test: (l) => l.length >= 25 },
];

const SEEN_KEY = "curio.achieved.v1";

export function unlockedIds(log = getLog()): Set<string> {
  return new Set(ACHIEVEMENTS.filter((a) => a.test(log)).map((a) => a.id));
}

// Returns achievements newly unlocked since last check, and records them.
export function popNewUnlocks(): Achievement[] {
  const now = unlockedIds();
  let seen: string[];
  try { seen = JSON.parse(localStorage.getItem(SEEN_KEY) ?? "[]"); } catch { seen = []; }
  const seenSet = new Set(seen);
  const fresh = ACHIEVEMENTS.filter((a) => now.has(a.id) && !seenSet.has(a.id));
  if (fresh.length) localStorage.setItem(SEEN_KEY, JSON.stringify([...now]));
  return fresh;
}
