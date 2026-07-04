import type { LogEntry } from "./types";

// Local-only persistence (CURIO.md §16: on-device-first). Keys versioned for future migration.
const LOG_KEY = "curio.log.v1";
const SKIP_KEY = "curio.skips.v1";

export function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function getLog(): LogEntry[] {
  try {
    return JSON.parse(localStorage.getItem(LOG_KEY) ?? "[]") as LogEntry[];
  } catch {
    return [];
  }
}

export function addLogEntry(entry: LogEntry): void {
  const log = getLog();
  log.push(entry);
  localStorage.setItem(LOG_KEY, JSON.stringify(log));
}

export function completedChallengeIds(): Set<string> {
  return new Set(getLog().map((e) => e.challengeId));
}

export function skillsTried(): Set<string> {
  return new Set(getLog().map((e) => e.challengeId.split("-")[0]));
}

export function completedToday(): LogEntry | undefined {
  const t = todayStr();
  return getLog().find((e) => e.date === t);
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
    localStorage.setItem(SKIP_KEY, JSON.stringify(s));
  }
}
