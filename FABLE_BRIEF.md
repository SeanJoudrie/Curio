# Fable Brief — Audit & Ship Curio

> Point Fable at this file. It has full authority to make Curio genuinely good
> and release it ASAP. Companion output: `AUDIT.md` (ratings + findings + status).

## ROLE & MANDATE — YOU ARE THE ACTING OWNER
You are the founder-engineer and FINAL DECISION-MAKER for Curio, a live PWA in
this repo. You have total executive power. You may — without asking anyone —
redesign, re-architect, rewrite, rename, delete, replace whole subsystems,
change the data model, add/remove dependencies, restructure the repo, change
the palette/typography/motion, rewrite all copy, cut features that don't serve
the mission, add features that do, change the build and deploy pipeline, and
ship to production. Resolve every ambiguity yourself with a sensible default and
keep moving. Never wait for approval. Never ask permission. Make the call, make
it good, ship it, then report what you did and why. Treat "should I…?" as
already answered: yes, if it makes the product better and honors the mission.

## PRIME DIRECTIVE — SHIP ASAP, AND MAKE IT GENUINELY GOOD
The goal is a releasable, excellent app in the fewest moves. Optimize for
time-to-release, not exhaustiveness. Work in this order and don't stall:
1. Fix anything BROKEN or off-brand or mission-violating (blockers).
2. Fix the MAJOR flaws a real user would notice in 30 seconds.
3. Get to a state you'd proudly release — then RELEASE (commit, push, verify the
   deploy is green and live).
4. Only after it's live, do the finer polish as fast-follows.

Be ruthless: timebox everything, cut scope hard, don't gold-plate, don't
bikeshed, don't refactor for its own sake. But never ship broken, never ship a
vibe-coded tell on a primary surface, never ship an AA-contrast failure, never
break the core loop. Speed AND quality — get there by cutting the non-essential,
not by lowering the bar on what ships.

## THE MISSION (supreme tiebreaker for every decision)
Curio replaces the boredom doomscroll. It hands you ONE small real-world thing to
go DO instead of scrolling, and wins ONLY when the user closes the app and does
the thing — never when they linger. The app must never become a feed: one
confident pick, not a stream; the Cabinet/photos are for looking BACK on what you
did, not scrolling. Judge everything against this. Cut or fix anything that pulls
toward "stay and scroll." When in doubt, the mission wins over any feature, any
nicety, any personal taste.

## STEP 0 — ORIENT (fast, then act)
- Read `CURIO.md` (single source of truth; the Mission block at the top rules).
- Read `src/` and `src/data/`. Build it, then DRIVE THE RUNNING APP in a real
  browser (Chromium + Playwright are available) at 390px mobile, in BOTH light
  and dark themes. Audit the running product, not the source. Hit every screen,
  filter, empty state, the deck, the photo flow, the nav. Screenshot.

## NON-NEGOTIABLE GATES (must be zero before you call it releasable)
1. No emoji as UI icons anywhere (line icons only; emoji allowed only inside
   share-caption text).
2. No text failing WCAG AA (4.5:1) in EITHER theme — verify with real math.
3. No vibe-coded tells on primary surfaces: placeholder/sketchy art, mono
   ALL-CAPS shouting, mismatched icon weights, generic cookie-cutter cards,
   hedgy/lorem copy, over-animation, no spacing/type rhythm.
4. No dead code, unused exports, duplicated logic, or copy-paste data on the
   paths you touch.
5. Core loop works flawlessly; app is installable and works offline; safe-area
   insets handled; motion calm (~150–350ms, one thing at a time; honors
   `prefers-reduced-motion`).

## INTENT CHECKLIST (everything we've committed to — verify, and fix drift)
- One real-world single-day activity/day; solo OR date; trying is the win; funny
  results valid.
- Home = Tinder-style deck: one card at a time, swipe left = not today, tap to
  expand, save/star; NOT a scrolling list. Tagline NOT on the front page. No
  "done today" box.
- Money tiers free/cheap/splurge with working filters.
- Whimsical coral/cream palette (never gray/teal); self-hosted Fraunces/Inter/
  Space Mono; offline PWA; deterministic daily pick; save + a saved view.
- Catalog: browse-by-drawer landing, one sticky compact header, dense rows, no
  bottom cutoff, must not read as a feed.
- Bottom nav auto-hides on scroll-down, returns on scroll-up, shown by default.
- "You": identity hero + stat tiles, log/history promoted, achievements
  earned-first, destructive actions behind an Advanced disclosure.
- **Card imagery — symbol now, photo-ready later.** EVERY card (especially the
  Today deck card) must carry its own visual: right now a per-challenge line
  SYMBOL/motif (not just a per-drawer default — see `src/Sketch.tsx`). Architect
  the image slot so a real per-challenge PHOTO or richer illustration can drop
  in later WITHOUT reworking layout — e.g. an optional `image` field on the
  Challenge type that, when present, renders a photo and otherwise falls back to
  the symbol. Make the Today card feel like it has a face. Verify every live
  challenge resolves to a specific-enough symbol (audit the keyword matcher;
  expand it so few cards land on a generic drawer fallback).
- **Adaptive personalization ("learn what they love").** After a user completes
  their first ~5 challenges, a lightweight on-device algorithm should nudge the
  daily mix toward what they engage with (loves baking → slightly more baking-ish
  picks), inferred from completions + high ratings + saves, not just the manual
  "Tune my deck." A boost/affinity system already exists
  (`nudgeBoost`/`getBoosts`/`weightedPick`/`swipeDeck` in `src/deck.ts` +
  `storage.ts`) — make it kick in automatically from behavior once ~5 are logged,
  and keep the manual controls too. HARD GUARDRAIL (mission): it must nudge, not
  filter-bubble — always keep meaningful variety and a wildcard rate so it still
  pushes the user to try NEW things, never just more of the same. Local-only, no
  tracking/backend.
- Photos: attach to completed challenge; personal gallery + lightbox; share to
  IG/Snapchat via the share card. The public cross-user feed is PARKED — do NOT
  build it (an infinite feed of others' photos fights the mission); note as
  future work only.
- Library deduped & safe: no duplicate/near-duplicate live cards; nothing
  dangerous/multi-day/gear-heavy sold as do-it-today. Audit `src/data/archived.ts`.
- Hobbies taxonomy (`src/data/hobbies.ts`, ~900 items mapped to drawers) is
  staging for future cards; convert more strong single-day ones if quick; flag
  weak live cards.

## RATE EVERYTHING /10 (be harsh; 10 is rare)
Every screen, feature, filter, animation, empty state, copy block, icon, color
token, layout decision, the deck, catalog, You screen, nav, photo flow,
illustration/symbol system, adaptive algorithm, data quality, a11y, performance,
offline, onboarding, hierarchy, and the concept itself. For every score < 9:
what's wrong (concrete, reproducible), why it matters (tie to mission/gate), and
the exact fix.

- **10** — shippable by a top studio, nothing to change.
- **7–9** — good, specific polish needed.
- **4–6** — works but clearly flawed / reads as templated.
- **1–3** — broken, off-brand, or fights the mission.

## OUTPUT — report AND execute, biased to shipping
1. Write/maintain `AUDIT.md`: ratings table (Item | Score | verdict) + findings
   ranked worst-first (severity, what's wrong, repro, why, fix) + a prioritized
   plan.
2. EXECUTE immediately, blockers→majors first. Change code/data/style/copy/motion
   for real. Verify each fix in the running app, both themes, mobile.
3. As soon as there are zero blockers, zero gate violations, and the core loop
   shines: RELEASE — commit, push, confirm the deploy is green and live. Then
   continue polishing as fast-follows, re-deploying as you go.
4. Keep `AUDIT.md` current (each item: fixed / deferred-to-fast-follow /
   won't-fix +reason).

## DEFINITION OF RELEASABLE (the bar to ship the first time)
Core loop flawless; all NON-NEGOTIABLE GATES at zero; primary surfaces (deck,
catalog, You, nav, photo flow) read as designed-by-a-studio, not vibe-coded; the
app unmistakably pushes the user to go DO the thing. Ship at that bar fast, then
keep raising everything toward 9+. The live, deployed app is the only proof that
counts.
