// Placeholder "specimen sketch" for every activity — a hand-drawn line motif per
// drawer, with a seeded jitter so each challenge's card looks individually sketched.
// Stand-in for the parametric token art (CURIO.md §7/§18) until real art lands.

function seed(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

// One simple line motif per drawer code. viewBox 0 0 100 100, stroke = currentColor.
const MOTIF: Record<string, string> = {
  PHO: "M22 40h14l5-7h18l5 7h14v34H22z M50 47a10 10 0 100 20 10 10 0 000-20z M64 44h8", // camera
  CUL: "M28 70h44 M30 70c0-16 8-26 20-26s20 10 20 26 M50 44v-8 M50 34a4 4 0 100-1z M40 54h20", // cake
  FER: "M36 30h28 M38 30v10c0 4-4 6-4 12v18a4 4 0 004 4h24a4 4 0 004-4V52c0-6-4-8-4-12V30 M40 60h20", // jar
  BRD: "M38 56c0-12 10-20 22-20 4 0 8 2 10 5l6-3-3 7c2 3 3 7 3 11 M38 56c-6 0-10 4-10 9 M60 44a2 2 0 100-1z M60 66l4 10 M52 66l-2 10", // bird
  LAN: "M28 36h44a4 4 0 014 4v20a4 4 0 01-4 4H50l-12 10v-10h-10a4 4 0 01-4-4V40a4 4 0 014-4z M40 50h24 M40 56h16", // speech
  CRA: "M30 66l20-20 M46 42l8 8 M52 36l12 12-6 6-12-12z M40 62l-6 10 10-6", // needle
  MOV: "M50 28a5 5 0 100-1z M50 36v18 M50 44l-10 6 M50 44l10 4 M50 54l-8 16 M50 54l8 16", // figure
  MUS: "M42 66a6 6 0 100 1z M48 66V36l22-6v30 M64 60a6 6 0 100 1z M48 44l22-6", // note
  WRI: "M32 68l6-2 26-26-4-4-26 26z M60 34l4 4 M32 68l-2 6 6-2", // pen
  NAT: "M50 30l5 12 13 1-10 9 3 13-11-7-11 7 3-13-10-9 13-1z", // star
  GAM: "M40 70h20 M42 66h16 M46 66l-2-14 M54 66l2-14 M44 52h12 M50 52l-4-14h8z M50 34a4 4 0 100-1z", // chess pawn
  MND: "M50 40c-8 8-8 18 0 26 8-8 8-18 0-26z M38 52c4 6 8 10 12 14 M62 52c-4 6-8 10-12 14 M50 66v6", // lotus
  SOC: "M40 46a7 7 0 0110 0 7 7 0 0110 0c0 8-10 16-10 16s-10-8-10-16z M30 58a5 5 0 018-4 M70 58a5 5 0 00-8-4", // hearts
  MAG: "M36 60h28l-4-22H40z M32 60h36 M46 38l-4-8 M58 38l6-6 M64 46l8-2", // hat + wand spark
  GRW: "M50 70V44 M50 52c-8 0-14-6-14-14 8 0 14 6 14 14 M50 48c6 0 12-4 12-11-7 0-12 5-12 11 M40 70h20", // sprout
  OUT: "M30 68l20-30 20 30z M50 38v30 M40 68l10-14 10 14 M62 44l6-10 6 24-10-4", // tent + mountain
  PRF: "M50 30a6 6 0 016 6v12a6 6 0 01-12 0V36a6 6 0 016-6z M38 46a12 12 0 0024 0 M50 58v10 M42 70h16", // microphone
  WDW: "M34 40l10-6 6 10-10 6z M40 44l-12 20 M64 34l-8 14 8 6 8-14z M60 42l6 10", // hammer + chisel
  STY: "M42 34a12 12 0 100 24 12 12 0 000-24z M42 58v12 M36 70h12 M60 34v20 M56 34h8l-2 12h-4z", // mirror + comb
};

export function Sketch({ id, skillId, size = 56 }: { id: string; skillId: string; size?: number }) {
  const s = seed(id);
  const rot = ((s % 7) - 3) * 0.9; // ±~2.7deg individual tilt
  const path = MOTIF[skillId] ?? "M34 40h32v20H34z M34 50h32 M50 40v20"; // generic "specimen slide"
  // a few seeded ink flecks so no two look identical
  const flecks = Array.from({ length: 3 }, (_, i) => {
    const h = seed(id + i);
    return { cx: 20 + (h % 60), cy: 20 + ((h >> 6) % 60), r: 0.7 + ((h >> 3) % 2) };
  });
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true"
      style={{ display: "block", transform: `rotate(${rot}deg)` }}>
      <rect x="6" y="6" width="88" height="88" rx="10" fill="none"
        stroke="var(--line-strong)" strokeWidth="1.5" strokeDasharray="3 4" />
      <g fill="none" stroke="var(--ochre)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <path d={path} />
      </g>
      {flecks.map((f, i) => (
        <circle key={i} cx={f.cx} cy={f.cy} r={f.r} fill="var(--line-strong)" />
      ))}
    </svg>
  );
}
