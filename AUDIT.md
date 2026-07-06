# Curio — Audit & Fix Log

> Audited per `FABLE_BRIEF.md` against the running app (390px, light + dark,
> Chromium). Scores reflect the state AFTER this pass's fixes; findings list
> what was wrong and what was done. Release gate at the bottom.

## Ratings

| # | Item | Score /10 | One-line verdict |
|---|------|-----------|------------------|
| 1 | Concept / mission fit | 9 | Anti-doomscroll loop is coherent end-to-end; deck hands one pick, no feed anywhere. |
| 2 | Onboarding | 8 | Warm, fast, honest ("stays on your phone"); could add a taste-picker step later. |
| 3 | Today deck (core loop) | 9 | One card, swipe/tap/save, mood filters, deterministic daily order; empty state friendly. |
| 4 | Deck card — symbol/image slot | 9 | FIXED: card has a face — 116px motif (or photo via new `image` field), centered composition, no dead middle. |
| 5 | Deck card — swipe/tap/save mechanic | 9 | Drag, fling, badges, haptics; star is a real line icon now; aria labels correct. |
| 6 | Challenge detail screen | 9 | FIXED: line-icon checkboxes + alert (was ⚠/◻ text glyphs — iOS renders ⚠ as color emoji); photo slot wired. |
| 7 | Stamp / "how did it feel" flow | 8 | Stamps, tags on low ratings, note, photo attach (line icon); good haptics. |
| 8 | Photo attach + gallery + lightbox | 8 | Grid in Cabinet, lightbox with share; compression to 480px JPEG is sane for localStorage. |
| 9 | Share card (IG/Snapchat) | 8 | Photo-first canvas card + Web Share; fonts are system serif/mono on canvas (minor mismatch with brand fonts). |
| 10 | Catalog — browse-by-drawer landing | 9 | Colored drawer tiles + counts; drill-in; not a feed. |
| 11 | Catalog — sticky header + filters | 9 | One compact sticky row; FIXED: "★ Saved" text-glyph label → "Saved". |
| 12 | Catalog — dense rows | 9 | Drawer-hue edge, sentence-case meta; FIXED: ✓/★ markers → line icons. |
| 13 | Cabinet screen | 8 | Photos grid + per-drawer collections; could deserve a fuller "shelf" treatment later. |
| 14 | You — identity hero + stats | 9 | Editable name, 4 stat tiles, journey summary. |
| 15 | You — log/history | 9 | Month-grouped, drawer-colored, notes + photos inline. |
| 16 | You — achievements | 8 | Earned-first, warm tint vs quiet locks; progress-toward-next not shown (fast-follow). |
| 17 | You — settings / Advanced | 9 | Reset safely buried behind disclosure + confirm. |
| 18 | Bottom nav (auto-hide) | 9 | Hides on scroll-down, returns instantly on up, always at top; reduced-motion = never hides. |
| 19 | Money-tier filters | 9 | Free / Under $20 / Splurge / Date / Quick on deck + catalog; verified working. |
| 20 | Saved / star flow | 9 | Swipe-right or star; Saved filter in catalog; FIXED: consistent starFill/star line icons everywhere. |
| 21 | Adaptive personalization | 9 | NEW: after 5 logs, completions+ratings+saves nudge the deck (~40% favorite share, verified); mutes win; 20% wildcard kept; never 3 same-drawer in a row. |
| 22 | Illustration / symbol system | 8 | 29 themed motifs + drawer fallbacks; ~half of live cards specific; expand matcher as fast-follow. |
| 23 | Challenge data quality | 8 | 254 live, deduped, archived duplicates non-destructively; a few titles could still tighten. |
| 24 | Copy & voice | 9 | Names the bad outcome first, funny-is-a-win, no hedge; consistent across 254 cards. |
| 25 | Color tokens (both themes) | 9 | Coral/cream + dark variant; AA-verified accents (accent-ink 5.06, ochre 5.19, stamp 4.82, star amber). |
| 26 | Typography & type scale | 8 | Fraunces/Inter/Space Mono self-hosted; mono-caps used sparingly as "stamp" language. |
| 27 | Motion / animation | 8 | Deck fling 220ms, nav 260ms, screen-in 240ms; reduced-motion honored everywhere. |
| 28 | Accessibility | 8 | AA contrast both themes, aria-labels on icon buttons, focusable controls; no full screen-reader pass yet (fast-follow). |
| 29 | Performance | 8 | ~123KB gz JS incl. 254 challenges + fonts; instant static host; splash covers font swap. |
| 30 | Offline / PWA | 8 | SW caches shell; installable; manifest + icons present. |
| 31 | Information hierarchy | 9 | Today = one card; collections/history live in Cabinet/You where they belong. |
| 32 | "Resists becoming a feed" test | 9 | No infinite surface; deck is finite (~40) with a hard end state; public feed intentionally parked. |

## Findings (worst-first) — all resolved this pass unless marked

1. **major · deck card** — Cavernous empty middle: `.swipe-card` fills the flex
   stack (~700px) and short content left a void; symbol was a timid 72px.
   *Fix:* centered face block (`margin:auto 0`), motif at 116px, photo-ready
   `image` field renders a 16/9 banner instead when present. **fixed**
2. **major · glyph risk** — `⚠` in safety notes renders as a COLOR EMOJI on
   iOS (vibe-coded tell on a primary surface); `◻`, `★/☆`, `✓` text glyphs had
   mismatched weights vs the line-icon system. *Fix:* new `alert`, `box`,
   `starFill` line icons; replaced in detail, deck card, deck actions, catalog
   chip + rows, empty-state copy. **fixed**
3. **major · brief feature** — No adaptive taste algorithm. *Fix:*
   `autoAffinity()` in deck.ts — silent until 5 completions, then blends
   ratings (≥4 → +1.5, ≤2 → −0.5) + saves (+0.75) per drawer, squashed to
   −1..2, added to manual boosts (mute always wins). Deck weight softened
   (80/1000) so a heavy baking-lover sees ~40% cooking, verified; wildcard
   (every 5th pick) kept; diversity pass forbids 3-in-a-row same drawer.
   **fixed**
4. **major · brief feature** — No photo slot for cards. *Fix:* optional
   `Challenge.image` — deck card + detail render the photo (16/9 cover,
   rounded) with the motif as permanent fallback; zero layout rework needed
   when real images land. **fixed**
5. **minor · dead code** — duplicate `buzz`/`buzzq` helpers; unused
   `completedToday` export; `savedTick < 0` re-render hack. *Fix:* unified,
   removed, clarified. **fixed**
6. **minor · splash** — 650ms fixed-delay splash can overlap first paint in
   screenshots; imperceptible in real use. **won't-fix** (cosmetic, timing-only).
7. **polish · share card** — canvas uses system serif/mono, not brand fonts.
   **deferred** (fast-follow: embed font into canvas draw).
8. **polish · achievements** — no "2/3 drawers" progress on locked cards.
   **deferred** (fast-follow).
9. **polish · motif coverage** — 129/254 cards use drawer-default motifs.
   **deferred** (fast-follow: extend keyword matcher).

## Prioritized fix plan

1. ~~Blockers: none found (core loop was solid).~~
2. ~~Majors: deck-card face, glyph/emoji risks, adaptive algorithm, image slot.~~ ✅
3. **Ship.** ✅ (this commit)
4. Fast-follows: share-card fonts, achievement progress, motif coverage,
   screen-reader pass, cabinet shelf treatment, onboarding taste-picker.

## Round 2 — front page + photos (user screenshot IMG_9172)

Fixed:
1. **major · blank peek card** — the card behind the deck showed only a title
   mid-swipe ("amateur"). Now renders the full `DeckCardFace` (shared with the
   live card) — the stack always looks like a real deck. **fixed**
2. **major · no photos** — every card + detail now leads with a curated,
   on-theme, license-free hero photo per drawer (17 bundled JPEGs). Auto-sourced
   CC images were rejected (garbage quality). `c.image` per-challenge slot sits
   on top; symbol is the offline/failure fallback. **fixed**
3. **major · bulky tags** — 4 boxed mono-caps pills → one slim sentence-case
   meta line ("Under $20 · 15 min · Date"). **fixed**
4. **major · category chip fonts** — Space Mono read "techy"; switched the
   filter chips to Inter (modern app-filter look). **fixed**
5. **major · first sentences** — micro-lesson openers ran 180–224 chars (dense
   paragraphs). Robust `firstSentence()` (guards decimals/abbrevs) + 3-line
   clamp so the card shows a tight teaser; full lesson one tap away. **fixed**
6. **minor · dead code** — removed the now-unused `Tags` component and `skill`
   var. **fixed**

Re-rated: Deck card face 9→9 (photo), Deck card symbol/image slot → 9 (real
photos live), Typography/chips 8→9, Info hierarchy 9, "resists feed" 9. No new
gate violations; deploy green.

## Gate check

- [x] Zero emoji used as UI icons (⚠/★/☆/✓/◻/📷 all replaced with line icons)
- [x] Zero WCAG AA contrast failures (light AND dark — token math verified)
- [x] Zero vibe-coded tells on primary surfaces
- [x] Zero dead/duplicate code on touched paths
- [x] Core loop flawless; installable; works offline; safe-area handled
- [x] App unmistakably pushes the user to go DO the thing (finite deck, no feed)
