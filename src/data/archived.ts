// Archived challenges — kept in source (still defined in the challenges/
// moreChallenges*.ts files) but removed from the LIVE pool. Curio serves
// CHALLENGES minus these ids, so they never reach the deck or Catalog.
//
// Why each is here: the catalog grew across several batches and accumulated
// near-duplicates — the same activity written two or three times. For every
// duplicate cluster we keep the single best-written version and archive the
// rest. A couple of mild-risk / weaker items are archived too. To un-archive,
// delete an id from this set.
//
// Ranked worst-first within groups. ~51 archived; leaves ~254 unique, curated.

export const ARCHIVED = new Set<string>([
  // ---- exact / near duplicates (keeper noted) ----
  "CRA-002", // "Build a terrarium in a jar"  → keep GRW-200
  "CRA-003", // "Tie-dye two shirts"          → keep CRA-204
  "CRA-052", // "Fold an origami crane" (dup) → keep CRA-004
  "CRA-101", // "Make a friendship bracelet"  → keep CRA-054
  "CRA-105", // "String-art a simple shape"   → keep CRA-202
  "CRA-110", // "Cut a six-fold paper snowflake" → keep CRA-201
  "CUL-110", // "Make cold brew coffee"       → keep CUL-202
  "CUL-111", // "Make butter by shaking cream" (dup) → keep CUL-051
  "GAM-102", // "Solve a tangram puzzle"      → keep GAM-200
  "GAM-104", // "Build a ten-item memory palace" → keep MND-200
  "GRW-001", // "Propagate a plant from a cutting" → keep GRW-051
  "LAN-102", // "Count to twenty in a new language" → keep LAN-050
  "LAN-104", // "Learn the sign-language alphabet" → keep MND-202
  "MAG-101", // "The self-working '21 card' trick" (dup) → keep MAG-051
  "MND-102", // "Box breathing for two minutes" → keep MND-051
  "MOV-004", // "Juggle three objects"        → keep MOV-200
  "MOV-101", // "Learn to moonwalk" (dup)     → keep MOV-052
  "MOV-103", // "Hold a wall handstand"       → keep MOV-201
  "MOV-105", // "Balance on one foot, eyes closed" (dup) → keep MOV-051
  "MOV-110", // "Keep a hula hoop up for 30 seconds" (dup) → keep MOV-202
  "MUS-004", // "Beatbox a basic loop"        → keep MUS-052
  "MUS-110", // "Whistle loudly with your fingers" → keep MUS-200
  "NAT-101", // "Make invisible ink"          → keep NAT-054
  "NAT-102", // "Layer a density rainbow in a glass" → keep NAT-056
  "OUT-101", // "Learn to skip a stone" (dup) → keep OUT-052
  "OUT-102", // "Go geocaching"               → keep OUT-203
  "OUT-104", // "Find north using the sun and a stick" → keep OUT-050
  "OUT-110", // "Stargaze with a sky-map app" → keep OUT-200
  "PHO-002", // "Make a stop-motion short"    → keep PHO-203
  "PHO-004", // "Blind contour portrait of each other" → keep PHO-200
  "PHO-007", // "Silhouette a sunset shot"    → keep PHO-054
  "PHO-101", // "Light-painting long exposure" → keep PHO-053
  "PHO-102", // "Forced-perspective photos" (dup) → keep PHO-051
  "PHO-105", // "Make a four-panel comic"     → keep PHO-202
  "PHO-110", // "Shoot macro water droplets"  → keep PHO-052
  "PHO-111", // "Make blackout poetry"        → keep WRI-202
  "PRF-002", // "Nail three impressions"      → keep PRF-053
  "PRF-101", // "Do the movie-trailer voice"  → keep PRF-051
  "PRF-102", // "Master five tongue-twisters at speed" → keep PRF-052
  "PRF-103", // "Mime being trapped in a box" → keep PRF-200
  "SOC-002", // "Compliment three strangers"  → keep SOC-050
  "SOC-003", // "Interview each other on camera" → keep SOC-051
  "SOC-101", // "Write a real thank-you note" → keep SOC-052
  "SOC-110", // "Do one anonymous act of kindness" → keep SOC-201
  "STY-101", // "Give yourself a proper manicure" → keep STY-200
  "STY-102", // "Learn to tie a tie six ways" → keep STY-051
  "WDW-050", // "Whittle a butter knife from a stick" (knife-toward-body) → keep WDW-002
  "WDW-052", // "Sand and oil a scrap of wood" → keep WDW-001
  "WRI-003", // "Six-word memoir"             → keep WRI-050
  "WRI-004", // "Deadpan review of something absurd" → keep WRI-051
  "WRI-101", // "Write a haiku about the room you're in" → keep WRI-053
]);
