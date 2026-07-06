// First sentence of a micro-lesson, for the card teaser. Guards decimals
// ("0.18 s") and mid-word dots so it doesn't cut early.
export function firstSentence(s: string): string {
  const m = s.match(/[.!?](?=\s+["'(]?[A-Z])/);
  return (m && m.index !== undefined ? s.slice(0, m.index + 1) : s).trim();
}
