// Specimen token per activity — a designed, per-drawer colored sticker with a
// line motif. Replaces the dashed-placeholder look. Deterministic per challenge.

function seed(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

// A distinct, friendly hue per drawer — makes cards & the cabinet colorful.
const HUE: Record<string, string> = {
  CUL: "#EF5F3C", PHO: "#7C5CF7", MUS: "#E23E6D", PRF: "#E0912B", MOV: "#1BA39B",
  LAN: "#3E7BEA", CRA: "#9B5DE5", WDW: "#B5762E", WRI: "#5A5AD6", GAM: "#3FA34D",
  MAG: "#C13FB0", NAT: "#2E8B57", GRW: "#5B9A3B", OUT: "#2E9BD6", MND: "#8E7CE0",
  SOC: "#E8618C", STY: "#DB5AA0", FER: "#C08A2E", BRD: "#2E9BD6",
};

// One simple line motif per drawer. viewBox 0 0 100 100.
const MOTIF: Record<string, string> = {
  PHO: "M22 40h14l5-7h18l5 7h14v34H22z M50 47a10 10 0 100 20 10 10 0 000-20z M64 44h8",
  CUL: "M28 70h44 M30 70c0-16 8-26 20-26s20 10 20 26 M50 44v-8 M40 54h20",
  FER: "M36 30h28 M38 30v10c0 4-4 6-4 12v18a4 4 0 004 4h24a4 4 0 004-4V52c0-6-4-8-4-12V30 M40 60h20",
  BRD: "M38 56c0-12 10-20 22-20 4 0 8 2 10 5l6-3-3 7c2 3 3 7 3 11 M38 56c-6 0-10 4-10 9 M60 44a2 2 0 100-1z M60 66l4 10 M52 66l-2 10",
  LAN: "M28 36h44a4 4 0 014 4v20a4 4 0 01-4 4H50l-12 10v-10h-10a4 4 0 01-4-4V40a4 4 0 014-4z M40 50h24 M40 56h16",
  CRA: "M30 66l20-20 M46 42l8 8 M52 36l12 12-6 6-12-12z M40 62l-6 10 10-6",
  MOV: "M50 28a5 5 0 100-1z M50 36v18 M50 44l-10 6 M50 44l10 4 M50 54l-8 16 M50 54l8 16",
  MUS: "M42 66a6 6 0 100 1z M48 66V36l22-6v30 M64 60a6 6 0 100 1z M48 44l22-6",
  WRI: "M32 68l6-2 26-26-4-4-26 26z M60 34l4 4 M32 68l-2 6 6-2",
  NAT: "M50 30l5 12 13 1-10 9 3 13-11-7-11 7 3-13-10-9 13-1z",
  GAM: "M40 70h20 M42 66h16 M46 66l-2-14 M54 66l2-14 M44 52h12 M50 52l-4-14h8z M50 34a4 4 0 100-1z",
  MND: "M50 40c-8 8-8 18 0 26 8-8 8-18 0-26z M38 52c4 6 8 10 12 14 M62 52c-4 6-8 10-12 14 M50 66v6",
  SOC: "M40 46a7 7 0 0110 0 7 7 0 0110 0c0 8-10 16-10 16s-10-8-10-16z M30 58a5 5 0 018-4 M70 58a5 5 0 00-8-4",
  MAG: "M36 60h28l-4-22H40z M32 60h36 M46 38l-4-8 M58 38l6-6 M64 46l8-2",
  GRW: "M50 70V44 M50 52c-8 0-14-6-14-14 8 0 14 6 14 14 M50 48c6 0 12-4 12-11-7 0-12 5-12 11 M40 70h20",
  OUT: "M30 68l20-30 20 30z M50 38v30 M40 68l10-14 10 14 M62 44l6-10 6 24-10-4",
  PRF: "M50 30a6 6 0 016 6v12a6 6 0 01-12 0V36a6 6 0 016-6z M38 46a12 12 0 0024 0 M50 58v10 M42 70h16",
  WDW: "M34 40l10-6 6 10-10 6z M40 44l-12 20 M64 34l-8 14 8 6 8-14z M60 42l6 10",
  STY: "M42 34a12 12 0 100 24 12 12 0 000-24z M42 58v12 M36 70h12 M60 34v20 M56 34h8l-2 12h-4z",
};

export function drawerHue(skillId: string): string {
  return HUE[skillId] ?? "#EF5F3C";
}

// A curated hero photo per drawer (public/img/drawers/<CODE>.jpg, Unsplash
// license). Used as the card face until a challenge gets its own `image`.
// Falls back to the line motif if the file is missing / offline pre-cache.
const HAS_PHOTO = new Set(["CUL", "PHO", "MUS", "PRF", "MOV", "LAN", "CRA", "WDW", "WRI", "GAM", "MAG", "NAT", "GRW", "OUT", "MND", "SOC", "STY"]);
export function drawerPhoto(skillId: string): string | undefined {
  return HAS_PHOTO.has(skillId) ? `${import.meta.env.BASE_URL}img/drawers/${skillId}.jpg` : undefined;
}

// Topical photos matched on the challenge title — more specific than the drawer
// hero (a cake card shows cake, a chess card shows chess). First match wins.
const PHOTO_MATCH: [string, RegExp][] = [
  ["pancake", /pancake/],
  ["pizza", /pizza/],
  ["pasta", /pasta|noodle|ramen/],
  ["sushi", /sushi|onigiri/],
  ["bread", /bread|sourdough|\bbake a|dough|bagel|\bloaf|focaccia/],
  ["cocktail", /cocktail|mixolog|negroni|margarita/],
  ["coffee", /coffee|cold brew|espresso|barista|latte/],
  ["tea", /\btea\b|matcha|kombucha/],
  ["knife", /knife|dice an onion|\bchop\b|segment a|supreme|cutting board|cheese board|charcuterie/],
  ["painting", /paint|watercolor|\bdraw|sketch|collage|comic|chalk|blackout|contour|pixel art|manga|cartoon|doodle/],
  ["guitar", /guitar|ukulele|\bchord|strum/],
  ["drum", /drum|beatbox|percussion|rhythm/],
  ["yoga", /yoga|tai chi|\bstretch|pilates|box breathing|meditat|mindful/],
  ["flower", /flower|bouquet|floristry|bloom|petal|press a/],
  ["boardgame", /board game|\bdice\b|game night|tabletop|two-player card/],
  ["running", /\brun\b|sprint|\bjog|couch to|5k|wall sit/],
];
export function themePhoto(title: string): string | undefined {
  const t = title.toLowerCase();
  for (const [key, re] of PHOTO_MATCH) if (re.test(t)) return `${import.meta.env.BASE_URL}img/themes/${key}.jpg`;
  return undefined;
}

// Per-challenge line motifs — more specific than the drawer default. viewBox 0 0 100 100.
const THEME: Record<string, string> = {
  cake: "M28 72h44 M31 72V52h38v20 M31 60h38 M31 52c0-6 8-9 19-9s19 3 19 9 M50 43v-8 M46 35h8",
  pancake: "M32 46c0-4 8-7 18-7s18 3 18 7-8 7-18 7-18-3-18-7z M32 46v8c0 4 8 7 18 7s18-3 18-7v-8 M52 40c2-3 6-4 8-2",
  egg: "M50 32c9 0 15 13 15 22a15 15 0 01-30 0c0-9 6-22 15-22z M50 55a7 7 0 100 1z",
  coffee: "M34 42h26v12a13 13 0 01-26 0z M60 45h5a6 6 0 010 12h-5 M40 32c0 4-3 4-3 7 M50 32c0 4-3 4-3 7",
  chocolate: "M36 40h28v22H36z M36 47h28 M36 54h28 M43 40v22 M50 40v22 M57 40v22",
  cheese: "M32 62l36-13v13z M32 62v-5l36-13 M43 55a2 2 0 100-1z M55 51a2 2 0 100-1z",
  knife: "M42 62l20-20 6 6-20 20z M42 62l-6 3 3-6 M60 36l8 8",
  moonstar: "M60 34a15 15 0 100 30 19 19 0 010-30z M39 38l2 5 5 1-4 4 1 5-4-3-4 3 1-5-4-4 5-1z",
  rainbow: "M28 62a22 22 0 0144 0 M35 62a15 15 0 0130 0 M42 62a8 8 0 0116 0",
  crystal: "M50 32l13 11-5 25H42l-5-25z M37 43h26 M50 32l-8 36 M50 32l8 36",
  leaf: "M42 66c-2-18 8-32 24-34-2 18-10 32-24 34z M46 58c4-8 10-14 18-18",
  seedling: "M50 68V46 M50 54c-8 0-13-5-13-13 8 0 13 5 13 13 M50 50c6 0 11-4 11-10-6 0-11 4-11 10 M42 68h16",
  flower: "M50 45a7 7 0 100 12 7 7 0 000-12z M50 34c6 3 6 11 0 11 M50 68c-6-3-6-11 0-11 M36 45c4 6 11 4 11-2 M64 45c-4 6-11 4-11-2 M50 57v12",
  kite: "M50 32l15 15-15 15-15-15z M50 32v30 M35 47h30 M50 62l-5 12 5-3 5 3z",
  compass: "M50 32a18 18 0 100 36 18 18 0 000-36z M44 56l6-16 6 16-6-4z",
  book: "M50 42c-5-4-13-5-18-4v24c5-1 13 0 18 4 5-4 13-5 18-4V38c-5-1-13 0-18 4z M50 42v24",
  envelope: "M32 40h36v22H32z M32 40l18 15 18-15",
  phone: "M41 30h18a2 2 0 012 2v36a2 2 0 01-2 2H41a2 2 0 01-2-2V32a2 2 0 012-2z M47 34h6 M48 64h4",
  cards: "M40 42l14-5 11 26-14 5z M40 42l-7 3 9 25 M45 40l16-6",
  dice: "M35 40h25v25H35z M42 47a2 2 0 100-1z M53 47a2 2 0 100-1z M47 52a2 2 0 100-1z M42 58a2 2 0 100-1z M53 58a2 2 0 100-1z",
  pawn: "M50 33a6 6 0 100 12 6 6 0 000-12z M45 45h10l-2 11h-6z M42 56h16 M39 66h22l-3-10H42z",
  puzzle: "M40 40h8a4 4 0 017 0h5v8a4 4 0 010 7v5h-8a4 4 0 01-7 0h-5v-8a4 4 0 010-7z",
  coin: "M50 32a17 17 0 100 34 17 17 0 000-34z M50 40a9 9 0 100 18 9 9 0 000-18z",
  drum: "M33 46a17 7 0 0034 0 17 7 0 00-34 0z M33 46v12a17 7 0 0034 0V46 M42 38l-7-9 M58 38l7-9",
  brush: "M58 34l8 8-19 19-9 3 3-9z M39 55l-7 15 15-7",
  mask: "M33 44c0 15 8 24 17 24s17-9 17-24c-6-2-11-3-17-3s-11 1-17 3z M41 51a3 3 0 016 0 M53 51a3 3 0 016 0 M44 60c4 3 8 3 12 0",
  heart: "M50 66S34 55 34 45a8 8 0 0116-3 8 8 0 0116 3c0 10-16 21-16 21z",
  shirt: "M40 36l-9 6 4 9 6-3v18h18V48l6 3 4-9-9-6-5 3a5 5 0 01-10 0z",
  bath: "M31 50h38v6a11 11 0 01-11 11H42a11 11 0 01-11-11z M37 50V42a4 4 0 018 0 M62 38c0 3-3 3-3 7 M54 40c0 3-2 3-2 6",
};

// First match wins — order specific → generic.
const THEME_MATCH: [string, RegExp][] = [
  ["pancake", /pancake/],
  ["cake", /\bcake|cupcake|frost/],
  ["egg", /\begg|omelette|poach|mayonnaise|meringue/],
  ["coffee", /coffee|latte|matcha|espresso|cold brew|\btea\b|cocktail|kombucha/],
  ["chocolate", /chocolate|cookie|candy|fudge|dessert|caramel/],
  ["cheese", /cheese|butter|charcuterie/],
  ["knife", /knife|dice an onion|sharpen|whittle|carv|segment|sushi|pasta|dumpling|noodle/],
  ["shirt", /tie-dye|\bdye\b|shirt|capsule|outfit|wardrobe|pocket square|bow tie|tie a (proper )?tie/],
  ["bath", /bath|spa|face mask|skincare|scent|perfume|soap|honey mask/],
  ["flower", /flower|bouquet|bloom|floristry|ikebana/],
  ["seedling", /seed|sprout|regrow|avocado pit|compost|propagat|cutting in water/],
  ["leaf", /plant|herb|succulent|terrarium|garden|kokedama|foraging|nature journal/],
  ["kite", /kite/],
  ["moonstar", /moon|\bstar\b|constellation|stargaz|north star|astro|galaxy|planet/],
  ["rainbow", /rainbow/],
  ["crystal", /crystal|geode|gem/],
  ["compass", /north|compass|orienteer|geocach|\bmap\b/],
  ["bath", /density tower|lava lamp/],
  ["book", /\bbook\b|read a|library|novel|memoir|worldbuild/],
  ["envelope", /letter|postcard|thank[- ]?you|thank a|penpal|mail/],
  ["phone", /call someone|instead of text/],
  ["crystal", /density tower|lava lamp/],
  ["cards", /card trick|playing card|cardistry|riffle|fan a deck|two-player card|21 card|french drop|mind.*math/],
  ["dice", /\bdice\b|board game|game night/],
  ["pawn", /chess/],
  ["puzzle", /puzzle|rubik|tangram|sudoku|cryptic|riddle|\bmaze|jigsaw|logic/],
  ["coin", /\bcoin\b/],
  ["drum", /drum|beatbox|percussion/],
  ["brush", /paint|watercolor|\bdraw|sketch|collage|comic|chalk|blackout|henna|nail art|contour|mural/],
  ["mask", /mime|impression|magic|acting|puppet|trailer voice|movie-trailer|accent|improv|drag/],
  ["heart", /compliment|kindness|gratitude|massage|back rub|reconnect|toast|\blove\b/],
  ["moonstar", /juggl/],
];

function motifFor(title: string | undefined, skillId: string): string {
  if (title) {
    const t = title.toLowerCase();
    for (const [key, re] of THEME_MATCH) if (re.test(t)) return THEME[key];
  }
  return MOTIF[skillId] ?? "M34 40h32v20H34z M34 50h32 M50 40v20";
}

export function Sketch({ id, skillId, title, size = 56 }: { id: string; skillId: string; title?: string; size?: number }) {
  const s = seed(id);
  const rot = ((s % 5) - 2) * 1.1; // ±~2° individual tilt for character
  const hue = HUE[skillId] ?? "#EF5F3C";
  const path = motifFor(title, skillId);
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true"
      style={{ display: "block", transform: `rotate(${rot}deg)` }}>
      <rect x="7" y="7" width="86" height="86" rx="24" fill={hue} fillOpacity="0.15" />
      <rect x="7" y="7" width="86" height="86" rx="24" fill="none" stroke={hue} strokeOpacity="0.4" strokeWidth="2" />
      <g fill="none" stroke={hue} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
        <path d={path} />
      </g>
    </svg>
  );
}
