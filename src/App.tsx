import { useMemo, useRef, useState } from "react";
import type { Challenge, LogEntry } from "./types";
import { skillById, SKILLS, CHALLENGES } from "./data/challenges";
import { rightNowCurio, swipeDeck, MOODS, type Mood } from "./deck";
import { addLogEntry, addSkip, getLog, skillsTried, todayStr, nudgeBoost, isOnboarded, setOnboarded, setBoosts, getBoosts, exportData, importData, currentStreak, toggleSaved, isSaved } from "./storage";
import { shareCard } from "./share";
import { Sketch, drawerHue } from "./Sketch";
import { ACHIEVEMENTS, unlockedIds, popNewUnlocks, type Achievement } from "./achievements";

type Tab = "today" | "cabinet" | "catalog" | "you";
type View =
  | { kind: "home" }
  | { kind: "detail"; challenge: Challenge }
  | { kind: "stamp"; challenge: Challenge }
  | { kind: "done"; challenge: Challenge; rating: number; note?: string; photo?: string; newUnlocks?: Achievement[] };

const TIME_LABEL: Record<string, string> = { "2m": "2 MIN", "15m": "15 MIN", "1h": "1 HR", "half-day": "HALF-DAY", "multi-day": "MULTI-DAY" };
const COST_LABEL: Record<string, string> = { free: "FREE", cheap: "CHEAP", splurge: "SPLURGE" };
const LEVEL_LABEL: Record<string, string> = { dabble: "Dabble", digin: "Dig In", deep: "Deep" };
const RATING_LABEL = ["", "Not for me", "Meh", "Alright", "Enjoyed it", "Loved it"];

function Tags({ c }: { c: Challenge }) {
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      <span className="tag">{COST_LABEL[c.budget.cost]}</span>
      <span className="tag">{TIME_LABEL[c.budget.time]}</span>
      {c.together && <span className="tag" style={{ color: "var(--plum)", borderColor: "var(--plum)" }}>DATE-FRIENDLY</span>}
      {c.funnyResultsExpected && <span className="tag">RESULTS VARY</span>}
    </div>
  );
}

function Field({ k, children, italic }: { k: string; children: React.ReactNode; italic?: boolean }) {
  return (
    <div style={{ marginBottom: 15 }}>
      <div style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 12.5, letterSpacing: "0.01em", color: "var(--accent-ink)", marginBottom: 3 }}>{k}</div>
      <div style={{ fontSize: 14.5, lineHeight: 1.5, color: italic ? "var(--ink-soft)" : "var(--ink)", fontStyle: italic ? "italic" : "normal" }}>{children}</div>
    </div>
  );
}

const buzzq = (ms: number) => navigator.vibrate?.(ms);

// Line icons (consistent stroke, replacing emoji in chrome — CURIO.md §18)
function Icon({ name, size = 18 }: { name: string; size?: number }) {
  const paths: Record<string, React.ReactNode> = {
    bolt: <path d="M13 3L6 13h5l-1 8 8-11h-5l1-7z" />,
    flame: <path d="M12 3c3 3 4.5 5 4.5 8a4.5 4.5 0 01-9 0c0-1.6.8-2.8.8-2.8s.4 1.6 1.7 1.6c1.2 0 1-1.5 1-3 0-2 1-3.8 1-3.8z" />,
    medal: <><circle cx="12" cy="15" r="4.5" /><path d="M9 10L7 3M15 10l2-7" /></>,
    lock: <><rect x="5.5" y="11" width="13" height="8.5" rx="2" /><path d="M8.5 11V8a3.5 3.5 0 017 0v3" /></>,
    camera: <><path d="M4 8.5h3l1.6-2h6.8L20 8.5h0V19H4z" /><circle cx="12" cy="13" r="3.2" /></>,
    x: <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />,
    expand: <path d="M7 14l5-5 5 5" />,
    check: <path d="M5 12.5l4.5 4.5L19 7" />,
  };
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flex: "none" }}>
      {paths[name]}
    </svg>
  );
}

function SwipeDeck({ list, onExpand, onEmpty }: { list: Challenge[]; onExpand: (c: Challenge) => void; onEmpty: React.ReactNode }) {
  const [i, setI] = useState(0);
  const [dx, setDx] = useState(0);
  const [exiting, setExiting] = useState<0 | 1 | -1>(0);
  const [savedTick, setSavedTick] = useState(0);
  const startX = useRef(0);
  const moved = useRef(false);
  const drag = useRef(false);

  const c = list[i];
  const next = list[i + 1];
  const THRESH = 90;

  const advance = () => { setExiting(0); setDx(0); setI((v) => v + 1); };
  const fling = (dir: 1 | -1) => {
    if (!c) return;
    if (dir === -1) addSkip(c.id);
    else if (!isSaved(c.id)) toggleSaved(c.id);
    buzzq(15);
    setExiting(dir);
    setTimeout(advance, 220);
  };
  const star = () => { if (c) { toggleSaved(c.id); buzzq(15); setSavedTick((t) => t + 1); } };

  const onDown = (e: React.PointerEvent) => { if (exiting) return; drag.current = true; moved.current = false; startX.current = e.clientX; (e.target as HTMLElement).setPointerCapture?.(e.pointerId); };
  const onMove = (e: React.PointerEvent) => { if (!drag.current) return; const nx = e.clientX - startX.current; if (Math.abs(nx) > 5) moved.current = true; setDx(nx); };
  const onUp = () => {
    if (!drag.current) return;
    drag.current = false;
    if (!moved.current) { if (c) onExpand(c); setDx(0); return; }
    if (dx < -THRESH) fling(-1);
    else if (dx > THRESH) fling(1);
    else setDx(0);
  };

  if (!c) return <div className="card" style={{ textAlign: "center", padding: 30, marginTop: 8 }}>{onEmpty}</div>;

  const tx = exiting ? exiting * 620 : dx;
  const rot = tx / 22;
  const saved = isSaved(c.id) || savedTick < 0; // savedTick only forces re-render
  const skill = skillById(c.skillId);

  return (
    <>
      <div className="deck-stack">
        {next && (
          <div className="swipe-card peek">
            <div className="t-eyebrow">{skillById(next.skillId)?.name}</div>
            <div className="t-title" style={{ fontSize: 24, marginTop: 8 }}>{next.title}</div>
          </div>
        )}
        <div
          className="swipe-card"
          style={{ transform: `translateX(${tx}px) rotate(${rot}deg)`, transition: drag.current ? "none" : "transform 0.22s ease" }}
          onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}
        >
          <div className="swipe-badge nope" style={{ opacity: Math.max(0, Math.min(1, -dx / 70)) }}>skip</div>
          <div className="swipe-badge save" style={{ opacity: Math.max(0, Math.min(1, dx / 70)) }}>save ★</div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
            <div className="t-eyebrow">{skill?.name} · {LEVEL_LABEL[c.level]}</div>
            <button onClick={(e) => { e.stopPropagation(); star(); }} style={{ fontSize: 22, lineHeight: 1, color: saved ? "var(--star)" : "var(--ink-soft)", flex: "none" }} aria-label="Save">{saved ? "★" : "☆"}</button>
          </div>
          <h2 className="t-display" style={{ fontSize: 30, margin: "10px 0 4px" }}>{c.title}</h2>
          <div style={{ margin: "6px auto 10px" }}><Sketch id={c.id} skillId={c.skillId} size={72} /></div>
          <p className="t-soft" style={{ fontSize: 14, lineHeight: 1.5, flex: 1 }}>{c.microLesson.split(". ")[0]}.</p>
          <Tags c={c} />
          <div className="t-tag t-soft" style={{ textAlign: "center", marginTop: 12, opacity: 0.7 }}>← skip · tap to open · save →</div>
        </div>
      </div>
      <div className="deck-actions">
        <button className="skip" onClick={() => fling(-1)} aria-label="Skip"><Icon name="x" size={24} /></button>
        <button className="go big" onClick={() => onExpand(c)} aria-label="Open"><Icon name="expand" size={26} /></button>
        <button className="save" onClick={star} aria-label="Save" style={{ fontSize: 24 }}>{isSaved(c.id) ? "★" : "☆"}</button>
      </div>
    </>
  );
}

function TodayScreen({ view, setView }: { view: View; setView: (v: View) => void }) {
  const [mood, setMood] = useState<Mood>("any");
  const rightNow = useMemo(() => rightNowCurio(), []);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning." : hour < 18 ? "Good afternoon." : "Good evening.";
  const tried = skillsTried().size;

  if (view.kind === "detail") {
    const c = view.challenge;
    const skill = skillById(c.skillId);
    return (
      <div className="screen">
        <button className="btn-link" style={{ alignSelf: "flex-start", paddingLeft: 0 }} onClick={() => setView({ kind: "home" })}>‹ Today</button>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
          <div style={{ flex: 1 }}>
            <div className="t-eyebrow">{skill?.name} · {LEVEL_LABEL[c.level]}</div>
            <h1 className="t-title" style={{ fontSize: 24, margin: "6px 0 16px" }}>{c.title}</h1>
          </div>
          <div style={{ flex: "none" }}><Sketch id={c.id} skillId={c.skillId} size={64} /></div>
        </div>
        <div style={{ flex: 1 }}>
          <Field k="Micro-lesson">{c.microLesson}</Field>
          {c.stages ? (
            <Field k="Task — multi-day">
              {c.stages.map((s) => (
                <div key={s.day} style={{ display: "flex", gap: 10, padding: "4px 0" }}>
                  <span className="tag" style={{ flex: "none", alignSelf: "flex-start" }}>{s.day.toUpperCase()}</span>
                  <span>{s.task}</span>
                </div>
              ))}
            </Field>
          ) : (
            <Field k="Task">{c.task}</Field>
          )}
          {c.needs && (
            <Field k="What you'll need">
              {c.needs.map((n) => <div key={n} style={{ padding: "2px 0" }}>◻ {n}</div>)}
              <div className="t-soft" style={{ fontSize: 12.5, marginTop: 4 }}>Use what you have first.</div>
            </Field>
          )}
          {c.safetyNote && (
            <div style={{ fontSize: 12.5, color: "var(--stamp)", background: "color-mix(in srgb, var(--stamp) 9%, transparent)", borderRadius: 8, padding: "9px 12px", marginBottom: 14 }}>
              ⚠ {c.safetyNote}
            </div>
          )}
          {c.accessibleAlternate && <Field k="Another way in" italic>{c.accessibleAlternate}</Field>}
          <Field k="If it flops" italic>{c.encouragement}</Field>
          <Field k="Inspiration">{c.resources.inspiration}</Field>
          <Field k="Go deeper">{c.resources.goDeeper}</Field>
        </div>
        <div style={{ padding: "12px 0 16px" }}>
          <button className="btn-primary" onClick={() => setView({ kind: "stamp", challenge: c })}>I did it — stamp it</button>
          <button className="btn-link" style={{ width: "100%" }} onClick={() => { addSkip(c.id); setView({ kind: "home" }); }}>Not today — skip this one</button>
        </div>
      </div>
    );
  }

  if (view.kind === "stamp") {
    return <StampScreen challenge={view.challenge} onDone={(rating, note, photo) => setView({ kind: "done", challenge: view.challenge, rating, note, photo, newUnlocks: popNewUnlocks() })} />;
  }

  if (view.kind === "done") {
    const nowToday = getLog().filter((e) => e.date === todayStr()).length;
    return (
      <div className="screen" style={{ justifyContent: "center", textAlign: "center", gap: 10 }}>
        <div className="token-land" style={{ margin: "0 auto" }}><Sketch id={view.challenge.id} skillId={view.challenge.skillId} size={84} /></div>
        <div className="t-label" style={{ letterSpacing: "0.12em" }}>◦ COLLECTED ◦</div>
        <h1 className="t-display">Into the cabinet it goes.</h1>
        <p className="t-soft" style={{ margin: "6px auto 0", maxWidth: "38ch" }}>
          <b style={{ color: "var(--ink)" }}>{view.challenge.title}</b>{skillsTried().size >= 1 ? ` — skill #${skillsTried().size} in your cabinet` : ""}{nowToday > 1 ? `, #${nowToday} today` : ""}.
        </p>
        {view.newUnlocks && view.newUnlocks.length > 0 && (
          <div style={{ margin: "6px auto", display: "flex", flexDirection: "column", gap: 6 }}>
            {view.newUnlocks.map((a) => (
              <div key={a.id} className="card" style={{ padding: "9px 14px", display: "flex", alignItems: "center", gap: 10, borderColor: "var(--plum)" }}>
                <span style={{ color: "var(--star)", display: "flex" }}><Icon name="medal" size={20} /></span>
                <span style={{ textAlign: "left" }}><div style={{ fontWeight: 700, fontSize: 13 }}>Achievement · {a.name}</div><div className="t-soft" style={{ fontSize: 11.5 }}>{a.desc}</div></span>
              </div>
            ))}
          </div>
        )}
        <div style={{ padding: "14px 0" }}>
          <button className="btn-primary" onClick={() => shareCard(view.challenge, view.rating, view.note, view.photo)}>Share this curio</button>
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <button className="btn-ghost" style={{ flex: 1 }} onClick={() => setView({ kind: "home" })}>Do another →</button>
            <button className="btn-ghost" style={{ flex: 1 }} onClick={() => setView({ kind: "home" })}>Done for now</button>
          </div>
        </div>
      </div>
    );
  }

  // home — a swipe deck
  const deck = swipeDeck(mood);
  return (
    <div className="screen">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div>
          <div className="t-title" style={{ fontSize: 22 }}>Today's deck</div>
          <div className="t-tag t-soft" style={{ marginTop: 1 }}>{greeting}{tried > 0 ? ` · ${tried} tried` : ""}</div>
        </div>
        {rightNow && (
          <button className="rn-pill" onClick={() => setView({ kind: "detail", challenge: rightNow })}><Icon name="bolt" size={13} /> 2-min now</button>
        )}
      </div>
      <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 12, marginBottom: 2, flex: "none" }}>
        {MOODS.map((m) => (
          <button key={m.id} className={`chip${mood === m.id ? " on" : ""}`} onClick={() => setMood(m.id)}>{m.label}</button>
        ))}
      </div>
      <SwipeDeck
        key={mood}
        list={deck}
        onExpand={(c) => setView({ kind: "detail", challenge: c })}
        onEmpty={
          <>
            <div className="t-title" style={{ marginBottom: 6 }}>That's the deck for now.</div>
            <p className="t-soft" style={{ fontSize: 13.5 }}>Nice taste. Try another filter, or come back — fresh cards tomorrow.</p>
          </>
        }
      />
    </div>
  );
}

function compressPhoto(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => {
      const max = 480;
      const s = Math.min(1, max / Math.max(img.width, img.height));
      const cv = document.createElement("canvas");
      cv.width = img.width * s;
      cv.height = img.height * s;
      cv.getContext("2d")!.drawImage(img, 0, 0, cv.width, cv.height);
      res(cv.toDataURL("image/jpeg", 0.7));
    };
    img.onerror = rej;
    img.src = URL.createObjectURL(file);
  });
}

const buzz = (ms: number) => navigator.vibrate?.(ms);

function StampScreen({ challenge, onDone }: { challenge: Challenge; onDone: (r: number, note?: string, photo?: string) => void }) {
  const [rating, setRating] = useState<number>(0);
  const [note, setNote] = useState("");
  const [tag, setTag] = useState<LogEntry["tag"]>(undefined);
  const [photo, setPhoto] = useState<string | undefined>(undefined);
  return (
    <div className="screen" style={{ justifyContent: "center", textAlign: "center" }}>
      <div className="t-label" style={{ letterSpacing: "0.12em" }}>◦ DONE ◦</div>
      <h1 className="t-display" style={{ margin: "8px 0 4px" }}>How did that feel?</h1>
      <p className="t-soft" style={{ fontSize: 13.5, marginBottom: 20 }}>{challenge.title}</p>
      <div className="stamp-row">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} className={`stamp${rating === n ? " sel" : ""}`} onClick={() => { setRating(n); buzz(15); if (n > 2) setTag(undefined); }} aria-label={`Rate ${n}: ${RATING_LABEL[n]}`}>{n}</button>
        ))}
      </div>
      <p className="t-soft" style={{ fontSize: 12.5, marginTop: 10, minHeight: 18 }}>{rating ? `${rating} · ${RATING_LABEL[rating]}` : " "}</p>
      {rating > 0 && rating <= 2 && (
        <div style={{ display: "flex", gap: 6, justifyContent: "center", marginTop: 4, flexWrap: "wrap" }}>
          {([["boring", "Boring"], ["too-hard", "Too hard"], ["not-me", "Not my thing"]] as const).map(([id, label]) => (
            <button key={id} className={`chip${tag === id ? " on" : ""}`} onClick={() => setTag(tag === id ? undefined : id)}>{label}</button>
          ))}
        </div>
      )}
      <label className="btn-link" style={{ display: "block", marginTop: 8 }}>
        {photo ? "\ud83d\udcf7 Photo attached \u2713" : "\ud83d\udcf7 Attach a photo (optional)"}
        <input type="file" accept="image/*" capture="environment" style={{ display: "none" }}
          onChange={async (e) => { const f = e.target.files?.[0]; if (f) setPhoto(await compressPhoto(f)); }} />
      </label>
      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder='Add a line… "the pigeon would not cooperate"'
        style={{
          width: "100%", marginTop: 16, padding: "11px 13px", fontSize: 13, fontFamily: "inherit",
          background: "var(--paper-card)", border: "1px solid var(--line-strong)", borderRadius: 10, color: "var(--ink)",
        }}
      />
      <div style={{ padding: "18px 0" }}>
        <button
          className="btn-primary"
          style={{ opacity: rating ? 1 : 0.45 }}
          disabled={!rating}
          onClick={() => {
            const entry: LogEntry = { challengeId: challenge.id, rating: rating as LogEntry["rating"], date: todayStr() };
            if (note.trim()) entry.note = note.trim();
            if (tag) entry.tag = tag;
            if (photo) entry.photoRef = photo;
            addLogEntry(entry);
            buzz(35); // the thunk
            // Every stamp quietly tunes the deck (CURIO.md §4) — tag-aware:
            // "too hard" means offer easier, not mute the whole drawer.
            if (rating >= 4) nudgeBoost(challenge.skillId, 1);
            else if (rating <= 2 && tag !== "too-hard") nudgeBoost(challenge.skillId, -1);
            onDone(rating, entry.note, entry.photoRef);
          }}
        >
          Stamp &amp; log it
        </button>
      </div>
    </div>
  );
}

function CabinetScreen() {
  const log = getLog();
  const bySkill = new Map<string, number>();
  for (const e of log) {
    const sid = e.challengeId.split("-")[0];
    bySkill.set(sid, (bySkill.get(sid) ?? 0) + 1);
  }
  const tried = bySkill.size;
  return (
    <div className="screen">
      <div style={{ textAlign: "center", margin: "10px 0 18px" }}>
        <div className="t-display" style={{ fontSize: 44, color: "var(--teal)" }}>{tried}</div>
        <div className="t-label" style={{ color: "var(--ink-soft)" }}>{tried === 1 ? "skill tried" : "skills tried"} · {log.length} {log.length === 1 ? "curio" : "curios"} logged</div>
        {currentStreak() > 1 && <div style={{ marginTop: 10 }}><span className="streak"><Icon name="flame" size={13} /> {currentStreak()}-day streak</span></div>}
      </div>
      {tried === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: 32 }}>
          <div className="t-title" style={{ marginBottom: 8 }}>Your first specimen goes here.</div>
          <p className="t-soft" style={{ fontSize: 13.5 }}>Finish any curio and it lands in this cabinet. The shelf only ever grows.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingBottom: 16 }}>
          {[...bySkill.entries()].map(([sid, count]) => {
            const skill = skillById(sid);
            return (
              <div key={sid} className="card" style={{ padding: "13px 15px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{skill?.name ?? sid}</div>
                  <div className="t-tag t-soft">{count} collected</div>
                </div>
                <div style={{ display: "flex", gap: 6, marginTop: 9, flexWrap: "wrap" }}>
                  {log.filter((e) => e.challengeId.split("-")[0] === sid).map((e, i, arr) => (
                    <div key={i} className={i === arr.length - 1 ? "token-land" : undefined}>
                      <Sketch id={e.challengeId} skillId={sid} size={38} />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

type CatFilter = "all" | "saved" | "date" | "free" | "splurge" | "quick" | "todo";
const CAT_FILTERS: { id: CatFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "saved", label: "★ Saved" },
  { id: "todo", label: "Not done" },
  { id: "date", label: "Date" },
  { id: "quick", label: "Quick" },
  { id: "free", label: "Free" },
  { id: "splurge", label: "Splurge" },
];

const META = (c: Challenge, withDrawer: boolean) =>
  [withDrawer ? skillById(c.skillId)?.name : null, TIME_LABEL[c.budget.time].toLowerCase(), COST_LABEL[c.budget.cost].toLowerCase(), c.together ? "date" : null]
    .filter(Boolean).join(" · ");

function CatRow({ c, done, openDetail, showDrawer }: { c: Challenge; done: boolean; openDetail: (c: Challenge) => void; showDrawer: boolean }) {
  return (
    <button onClick={() => openDetail(c)}
      style={{ display: "flex", width: "100%", textAlign: "left", alignItems: "center", gap: 11, padding: "10px 12px 10px 0",
        background: "var(--paper-card)", border: "1px solid var(--line)", borderLeft: `4px solid ${drawerHue(c.skillId)}`, borderRadius: 10 }}>
      <div style={{ flex: 1, minWidth: 0, paddingLeft: 12 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: done ? "var(--ink-soft)" : "var(--ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {done && <span style={{ color: "var(--teal)" }}>✓ </span>}{c.title}
        </div>
        <div style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 1, textTransform: "capitalize" }}>{META(c, showDrawer)}</div>
      </div>
      {isSaved(c.id) && <span style={{ color: "var(--star)", fontSize: 16, flex: "none", paddingRight: 12 }}>★</span>}
    </button>
  );
}

function CatalogScreen({ openDetail }: { openDetail: (c: Challenge) => void }) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<CatFilter>("all");
  const [drawer, setDrawer] = useState<string>("");
  const done = new Set(getLog().map((e) => e.challengeId));
  const ql = q.trim().toLowerCase();

  const matches = (c: Challenge) => {
    if (drawer && c.skillId !== drawer) return false;
    if (ql && !(c.title.toLowerCase().includes(ql) || (skillById(c.skillId)?.name.toLowerCase().includes(ql)))) return false;
    if (filter === "date") return !!c.together;
    if (filter === "free") return c.budget.cost === "free";
    if (filter === "splurge") return c.budget.cost === "splurge";
    if (filter === "quick") return c.budget.time === "2m" || c.budget.time === "15m";
    if (filter === "todo") return !done.has(c.id);
    if (filter === "saved") return isSaved(c.id);
    return true;
  };
  const results = CHALLENGES.filter(matches);
  // Landing = the drawer index. Show it only when browsing with no query/filter/drawer.
  const showLanding = !ql && filter === "all" && !drawer;

  const header = (
    <div style={{ position: "sticky", top: 0, zIndex: 3, background: "var(--paper)", margin: "0 -16px", padding: "6px 16px 10px", borderBottom: "1px solid var(--line)" }}>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Search ${CHALLENGES.length} activities…`}
        style={{ width: "100%", padding: "11px 14px", fontSize: 14, fontFamily: "inherit", background: "var(--paper-card)", border: "1px solid var(--line-strong)", borderRadius: 12, color: "var(--ink)" }} />
      <div style={{ display: "flex", gap: 6, overflowX: "auto", marginTop: 9 }}>
        {CAT_FILTERS.map((f) => (
          <button key={f.id} className={`chip${filter === f.id ? " on" : ""}`} onClick={() => setFilter(f.id)}>{f.label}</button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="screen" style={{ paddingBottom: 0 }}>
      {header}
      <div style={{ paddingTop: 12, paddingBottom: "calc(24px + env(safe-area-inset-bottom))" }}>
        {showLanding ? (
          <>
            <div className="t-tag t-soft" style={{ marginBottom: 10 }}>Browse by category</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9 }}>
              {SKILLS.map((s) => {
                const n = CHALLENGES.filter((c) => c.skillId === s.id).length;
                if (!n) return null;
                const doneN = CHALLENGES.filter((c) => c.skillId === s.id && done.has(c.id)).length;
                return (
                  <button key={s.id} onClick={() => setDrawer(s.id)}
                    style={{ textAlign: "left", background: "var(--paper-card)", border: "1px solid var(--line)", borderTop: `3px solid ${drawerHue(s.id)}`, borderRadius: 12, padding: "12px 13px", minHeight: 88, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ width: 9, height: 9, borderRadius: 3, background: drawerHue(s.id), flex: "none" }} />
                      <span style={{ fontFamily: "var(--font-serif)", fontWeight: 600, fontSize: 15, lineHeight: 1.1 }}>{s.name}</span>
                    </div>
                    <div className="t-tag t-soft" style={{ marginTop: 8 }}>{n} activities{doneN ? ` · ${doneN} done` : ""}</div>
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              {drawer && (
                <button className="btn-link" style={{ padding: 0, minHeight: 0, color: "var(--accent-ink)", fontWeight: 700 }} onClick={() => setDrawer("")}>‹ All</button>
              )}
              <span style={{ fontFamily: "var(--font-serif)", fontWeight: 600, fontSize: 17 }}>{drawer ? skillById(drawer)?.name : "Results"}</span>
              <span className="t-tag t-soft" style={{ marginLeft: "auto" }}>{results.length}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {results.map((c) => <CatRow key={c.id} c={c} done={done.has(c.id)} openDetail={openDetail} showDrawer={!drawer} />)}
              {results.length === 0 && (
                <p className="t-soft" style={{ fontSize: 13.5, textAlign: "center", padding: 24 }}>
                  {filter === "saved" ? "No saved cards yet — swipe right (or tap ☆) on the deck to save one here." : "Nothing matches that — try clearing a filter."}
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// avoids circular import gymnastics in one file
import { CHALLENGES as _CHALLENGES } from "./data/challenges";
function require_challenges() {
  return { SKILLS, CHALLENGES: _CHALLENGES };
}

function Onboarding({ onDone }: { onDone: (firstWin?: Challenge) => void }) {
  const [step, setStep] = useState<"welcome" | "taste">("welcome");
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const toggle = (id: string) => {
    const s = new Set(picked);
    s.has(id) ? s.delete(id) : s.add(id);
    setPicked(s);
  };
  const finish = () => {
    const boosts: Record<string, number> = {};
    picked.forEach((id) => (boosts[id] = 1));
    setBoosts(boosts);
    setOnboarded();
    onDone(rightNowCurio()); // guaranteed first win: a 60-sec curio, right now (CURIO.md §14)
  };

  if (step === "welcome") {
    return (
      <div className="app">
        <div className="screen" style={{ justifyContent: "center", textAlign: "center", gap: 6 }}>
          <div style={{ margin: "0 auto 6px" }}><Sketch id="welcome-CUL" skillId="CUL" size={76} /></div>
          <div className="t-label" style={{ letterSpacing: "0.14em" }}>◦ WELCOME ◦</div>
          <h1 className="t-display" style={{ fontSize: 34, margin: "4px 12px" }}>One small thing a day.</h1>
          <p className="t-soft" style={{ fontSize: 15, margin: "6px auto 2px", maxWidth: "34ch", lineHeight: 1.5 }}>
            Curio hands you one real-world thing to actually go <i>do</i> — solo or together. Bake a cake, learn a card trick, watch a bird, whatever.
          </p>
          <p className="t-soft" style={{ fontSize: 15, margin: "0 auto", maxWidth: "34ch", lineHeight: 1.5 }}>
            You rate how it <i>felt</i>, not how it went. <b style={{ color: "var(--ink)" }}>Trying is the win.</b>
          </p>
          <div style={{ padding: "22px 0 10px", width: "100%" }}>
            <button className="btn-primary" onClick={() => setStep("taste")}>Let's go →</button>
            <p className="t-soft" style={{ fontSize: 12, textAlign: "center", marginTop: 10 }}>30 seconds to set up. Everything stays on your phone.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="screen">
        <div className="t-label" style={{ margin: "18px 0 6px" }}>STEP 1 OF 2 · TUNE YOUR DECK</div>
        <h1 className="t-display">Which of these pull at you?</h1>
        <p className="t-soft" style={{ fontSize: 13.5, margin: "8px 0 16px" }}>Tap a few — or none. "Surprise me" is a completely valid answer. You can change all of this later.</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignContent: "flex-start", flex: 1 }}>
          {SKILLS.map((s) => (
            <button key={s.id} className={`chip${picked.has(s.id) ? " on" : ""}`} onClick={() => toggle(s.id)}>{s.name}</button>
          ))}
        </div>
        <div style={{ padding: "16px 0" }}>
          <button className="btn-primary" onClick={finish}>{picked.size > 0 ? "Continue" : "Surprise me"}</button>
          <p className="t-soft" style={{ fontSize: 12, textAlign: "center", marginTop: 10 }}>Step 2 is a 60-second curio you'll finish before you leave. Everything lives on your phone.</p>
        </div>
      </div>
    </div>
  );
}

const AFFINITY = ["muted", "less", "default", "more", "boosted"]; // -2..2 → index+2
function TuneDeck() {
  const [, force] = useState(0);
  const boosts = getBoosts();
  const cycle = (id: string) => {
    const b = getBoosts();
    const next = ((b[id] ?? 0) + 3) > 2 ? -2 : (b[id] ?? 0) + 1; // cycle -2..2 wrapping
    setBoosts({ ...b, [id]: next });
    force((n) => n + 1);
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 18 }}>
      {SKILLS.map((s) => {
        const v = boosts[s.id] ?? 0;
        const label = AFFINITY[v + 2].toUpperCase();
        const color = v > 0 ? "var(--teal)" : v < 0 ? "var(--stamp)" : "var(--ink-soft)";
        return (
          <button key={s.id} onClick={() => cycle(s.id)} style={{ display: "flex", width: "100%", alignItems: "center", gap: 10, padding: "9px 13px", background: "var(--paper-card)", border: "1px solid var(--line)", borderRadius: 10, textAlign: "left" }}>
            <span style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{s.name}</span>
            <span className="t-tag" style={{ color, borderColor: color === "var(--ink-soft)" ? "var(--line-strong)" : color, border: "1px solid", borderRadius: 999, padding: "3px 10px" }}>{v > 0 ? "+" + v + " " : v < 0 ? v + " " : ""}{label}</span>
          </button>
        );
      })}
      <p className="t-soft" style={{ fontSize: 11.5, textAlign: "center", marginTop: 4 }}>Tap to cycle. Boosted drawers appear more; muted ones leave the daily deck (still in the Catalog).</p>
    </div>
  );
}

function YouScreen() {
  const log = getLog();
  const [tuneOpen, setTuneOpen] = useState(false);
  const doExport = () => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([exportData()], { type: "application/json" }));
    a.download = `curio-cabinet-${todayStr()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };
  const doImport = () => {
    const inp = document.createElement("input");
    inp.type = "file";
    inp.accept = "application/json";
    inp.onchange = async () => {
      const f = inp.files?.[0];
      if (f && importData(await f.text())) location.reload();
      else alert("That file didn't look like a Curio cabinet.");
    };
    inp.click();
  };
  const unlocked = unlockedIds(log);
  return (
    <div className="screen">
      <div className="t-eyebrow" style={{ margin: "4px 0 10px" }}>Achievements · {unlocked.size}/{ACHIEVEMENTS.length}</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 18 }}>
        {ACHIEVEMENTS.map((a) => {
          const got = unlocked.has(a.id);
          return (
            <div key={a.id} className="card" style={{ padding: "10px 12px", opacity: got ? 1 : 0.5, borderColor: got ? "var(--plum)" : "var(--line-strong)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <span style={{ color: got ? "var(--star)" : "var(--ink-soft)", display: "flex" }}><Icon name={got ? "medal" : "lock"} size={16} /></span>
                <span style={{ fontWeight: 700, fontSize: 12.5 }}>{a.name}</span>
              </div>
              <div className="t-soft" style={{ fontSize: 11, marginTop: 3 }}>{a.desc}</div>
            </div>
          );
        })}
      </div>
      <button className="btn-ghost" style={{ marginBottom: tuneOpen ? 12 : 18, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px" }} onClick={() => setTuneOpen((o) => !o)}>
        <span>Tune my deck</span><span className="t-soft">{tuneOpen ? "▲" : "▼"}</span>
      </button>
      {tuneOpen && <TuneDeck />}
      <div className="t-eyebrow" style={{ margin: "4px 0 12px" }}>Your log</div>
      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
        <button className="btn-ghost" style={{ flex: 1 }} onClick={doExport}>Export cabinet</button>
        <button className="btn-ghost" style={{ flex: 1 }} onClick={doImport}>Import</button>
      </div>
      <button className="btn-ghost" style={{ marginBottom: 14, borderColor: "var(--stamp)", color: "var(--stamp)" }}
        onClick={() => { if (confirm("Reset everything? Clears your log, cabinet, achievements and onboarding — handy for testing.")) { localStorage.clear(); location.reload(); } }}>
        Reset app (clear all data)
      </button>
      {log.length === 0 ? (
        <p className="t-soft" style={{ fontSize: 13.5 }}>Nothing yet — your stamped curios will show up here, newest first.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingBottom: 16 }}>
          {[...log].reverse().map((e, i) => {
            const c = _CHALLENGES.find((x) => x.id === e.challengeId);
            return (
              <div key={i} className="card" style={{ padding: "13px 15px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{c?.title ?? e.challengeId}</div>
                  <div className="t-tag" style={{ color: "var(--stamp)", flex: "none" }}>{e.rating}/5</div>
                </div>
                <div className="t-tag t-soft" style={{ marginTop: 3 }}>{e.date}</div>
                {e.note && <div className="t-soft" style={{ fontSize: 13, fontStyle: "italic", marginTop: 6 }}>"{e.note}"</div>}
                {e.photoRef && <img src={e.photoRef} alt="" style={{ width: "100%", borderRadius: 8, marginTop: 8, border: "1px solid var(--line)" }} />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const ICONS: Record<Tab, React.ReactNode> = {
  today: <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><path d="M12 8v4l3 2" /></svg>,
  cabinet: <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="7" rx="1" /><rect x="3" y="13" width="18" height="7" rx="1" /><path d="M10 7.5h4M10 16.5h4" /></svg>,
  catalog: <svg viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16" /></svg>,
  you: <svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-6 8-6s8 2 8 6" /></svg>,
};

export default function App() {
  const [tab, setTab] = useState<Tab>("today");
  const [view, setView] = useState<View>({ kind: "home" });
  const [onboarded, setOnboardedState] = useState(isOnboarded());
  const focused = view.kind === "detail" || view.kind === "stamp" || view.kind === "done";

  if (!onboarded) {
    return (
      <Onboarding
        onDone={(firstWin) => {
          setOnboardedState(true);
          if (firstWin) setView({ kind: "detail", challenge: firstWin });
        }}
      />
    );
  }

  return (
    <div className="app">
      {tab === "today" && <TodayScreen view={view} setView={setView} />}
      {tab === "cabinet" && <CabinetScreen />}
      {tab === "catalog" && <CatalogScreen openDetail={(c) => { setTab("today"); setView({ kind: "detail", challenge: c }); }} />}
      {tab === "you" && <YouScreen />}
      {!(tab === "today" && focused) && (
        <nav className="tabbar">
          {(["today", "cabinet", "catalog", "you"] as Tab[]).map((t) => (
            <button key={t} className={tab === t ? "on" : ""} onClick={() => { navigator.vibrate?.(8); setTab(t); if (t === "today") setView({ kind: "home" }); }}>
              {ICONS[t]}
              <span>{t === "today" ? "Today" : t === "cabinet" ? "Cabinet" : t === "catalog" ? "Catalog" : "You"}</span>
            </button>
          ))}
        </nav>
      )}
    </div>
  );
}
