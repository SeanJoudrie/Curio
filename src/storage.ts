import type { LogEntry } from "./types";

// Local-only persistence (CURIO.md §16: on-device-first). Keys versioned for future migration.
const LOG_KEY = "curio.log.v1";
const SKIP_KEY = "curio.skips.v1";

export function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// All writes go through this so a full quota (or private-mode) never throws
// mid-action and crashes the app. Returns false when the write didn't land.
function safeSet(key: string, value: string): boolean {
  try { localStorage.setItem(key, value); return true; } catch { return false; }
}

export function getLog(): LogEntry[] {
  try {
    return JSON.parse(localStorage.getItem(LOG_KEY) ?? "[]") as LogEntry[];
  } catch {
    return [];
  }
}

// Photos are base64 data-URLs and can push localStorage past its ~5MB quota.
// If the write fails, drop the (large) photo and retry so the curio itself is
// NEVER lost. "ok-no-photo" tells the caller the photo couldn't be kept.
export type LogResult = "ok" | "ok-no-photo" | "fail";
export function addLogEntry(entry: LogEntry): LogResult {
  const log = getLog();
  log.push(entry);
  if (safeSet(LOG_KEY, JSON.stringify(log))) return "ok";
  if (entry.photoRef) {
    log[log.length - 1] = { ...entry, photoRef: undefined };
    if (safeSet(LOG_KEY, JSON.stringify(log))) return "ok-no-photo";
  }
  return "fail";
}

export function completedChallengeIds(): Set<string> {
  return new Set(getLog().map((e) => e.challengeId));
}

export function skillsTried(): Set<string> {
  return new Set(getLog().map((e) => e.challengeId.split("-")[0]));
}

// Skips deprioritize, never delete (CURIO.md §3).
export function getSkips(): string[] {
  try {
    return JSON.parse(localStorage.getItem(SKIP_KEY) ?? "[]") as string[];
  } catch {
    return [];
  }
}
export function addSkip(id: string): void {
  const s = getSkips();
  if (!s.includes(id)) {
    s.push(id);
    safeSet(SKIP_KEY, JSON.stringify(s));
  }
}
export function removeSkip(id: string): void {
  safeSet(SKIP_KEY, JSON.stringify(getSkips().filter((x) => x !== id)));
}

// ---- Preferences: boost/mute per drawer (CURIO.md §4) ----
const PREF_KEY = "curio.prefs.v1";
const ONBOARD_KEY = "curio.onboarded.v1";

export function getBoosts(): Record<string, number> {
  try { return JSON.parse(localStorage.getItem(PREF_KEY) ?? "{}"); } catch { return {}; }
}
export function setBoosts(b: Record<string, number>): void {
  safeSet(PREF_KEY, JSON.stringify(b));
}
export function nudgeBoost(skillId: string, delta: number): void {
  const b = getBoosts();
  b[skillId] = Math.max(-2, Math.min(2, (b[skillId] ?? 0) + delta));
  setBoosts(b);
}
export function isOnboarded(): boolean { return localStorage.getItem(ONBOARD_KEY) === "1"; }
export function setOnboarded(): void { safeSet(ONBOARD_KEY, "1"); }

// ---- One-tap export/import (CURIO.md §16: never lose your cabinet) ----
export function exportData(): string {
  return JSON.stringify({
    v: 1,
    log: getLog(),
    skips: getSkips(),
    boosts: getBoosts(),
  });
}
export function importData(json: string): boolean {
  try {
    const d = JSON.parse(json);
    if (!Array.isArray(d.log)) return false;
    localStorage.setItem(LOG_KEY, JSON.stringify(d.log));
    localStorage.setItem(SKIP_KEY, JSON.stringify(d.skips ?? []));
    localStorage.setItem(PREF_KEY, JSON.stringify(d.boosts ?? {}));
    return true;
  } catch { return false; }
}

// Current streak = consecutive days up to today (or yesterday) with a logged curio.
export function currentStreak(): number {
  const days = new Set(getLog().map((e) => e.date));
  if (days.size === 0) return 0;
  const d = new Date();
  const key = (dt: Date) => `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
  // allow the streak to "hold" if today isn't logged yet but yesterday was
  if (!days.has(key(d))) d.setDate(d.getDate() - 1);
  let streak = 0;
  while (days.has(key(d))) { streak++; d.setDate(d.getDate() - 1); }
  return streak;
}

// ---- Saved / starred challenges (swipe right or tap the star) ----
const SAVED_KEY = "curio.saved.v1";
export function getSaved(): string[] {
  try { return JSON.parse(localStorage.getItem(SAVED_KEY) ?? "[]"); } catch { return []; }
}
export function isSaved(id: string): boolean { return getSaved().includes(id); }
export function toggleSaved(id: string): boolean {
  const s = getSaved();
  const i = s.indexOf(id);
  if (i >= 0) s.splice(i, 1); else s.push(id);
  safeSet(SAVED_KEY, JSON.stringify(s));
  return i < 0; // true if now saved
}
