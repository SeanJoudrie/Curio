import { useMemo, useState } from "react";
import type { Challenge, LogEntry } from "./types";
import { skillById, SKILLS, CHALLENGES } from "./data/challenges";
import { todaysCurio, dealHand, rightNowCurio, MOODS, type Mood } from "./deck";
import { addLogEntry, addSkip, completedToday, getLog, skillsTried, todayStr, nudgeBoost, isOnboarded, setOnboarded, setBoosts, getBoosts, exportData, importData, currentStreak } from "./storage";
import { shareCard } from "./share";
import { Sketch } from "./Sketch";
import { ACHIEVEMENTS, unlockedIds, popNewUnlocks, type Achievement } from "./achievements";

type Tab = "today" | "cabinet" | "catalog" | "you";
type View =
  | { kind: "home" }
  | { kind: "hand" }
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
    <div style={{ marginBottom: 14 }}>
      <div className="t-label" style={{ marginBottom: 3 }}>{k}</div>
      <div style={{ fontSize: 14.5, lineHeight: 1.5, color: italic ? "var(--ink-soft)" : "var(--ink)", fontStyle: italic ? "italic" : "normal" }}>{children}</div>
    </div>
  );
}

function ChallengeCard({ c, hero, onOpen }: { c: Challenge; hero?: boolean; onOpen: () => void }) {
  const skill = skillById(c.skillId);
  return (
    <button onClick={onOpen} style={{ display: "block", width: "100%", textAlign: "left" }}>
      <div className="card" style={hero ? { padding: 20 } : {}}>
        <div className="wash" />
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
          <div style={{ flex: 1 }}>
            <div className="t-eyebrow">{skill?.name} · {LEVEL_LABEL[c.level]}</div>
            <div className={hero ? "t-display" : "t-title"} style={{ margin: "8px 0 10px" }}>{c.title}</div>
          </div>
          <div style={{ flex: "none", opacity: 0.9 }}><Sketch id={c.id} skillId={c.skillId} size={hero ? 60 : 50} /></div>
        </div>
        <div className="t-soft" style={{ fontSize: 13.5, marginBottom: 14 }}>{c.microLesson.split(". ")[0] + "."}</div>
        <Tags c={c} />
      </div>
    </button>
  );
}

function TodayScreen({ view, setView }: { view: View; setView: (v: View) => void }) {
  const [rerolls, setRerolls] = useState(0);
  const [mood, setMood] = useState<Mood>("any");
  const done = completedToday();
  const curio = useMemo(() => todaysCurio(rerolls, mood), [rerolls, mood]);
  const rightNow = useMemo(() => rightNowCurio(), []);
  const hand = useMemo(() => dealHand(curio.id, mood), [curio.id, mood]);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning." : hour < 18 ? "Good afternoon." : "Good evening.";
  const tried = skillsTried().size;
  const todayCount = getLog().filter((e) => e.date === todayStr()).length;

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
                <span style={{ fontSize: 18 }}>🏅</span>
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

  if (view.kind === "hand") {
    return (
      <div className="screen">
        <button className="btn-link" style={{ alignSelf: "flex-start", paddingLeft: 0 }} onClick={() => setView({ kind: "home" })}>‹ Back</button>
        <div className="t-eyebrow" style={{ marginBottom: 12 }}>Today's hand — {hand.length} cards, that's the deal</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, paddingBottom: 16 }}>
          {hand.map((c) => <div key={c.id} className="deal"><ChallengeCard c={c} onOpen={() => setView({ kind: "detail", challenge: c })} /></div>)}
        </div>
        <p className="t-soft" style={{ fontSize: 12.5, textAlign: "center", paddingBottom: 16 }}>That's today's hand. Tomorrow deals fresh.</p>
      </div>
    );
  }

  // home
  return (
    <div className="screen">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
        <div>
          <div className="t-title" style={{ fontSize: 21 }}>{greeting}</div>
          <div className="t-tag t-soft" style={{ marginTop: 2 }}>{todayStr()}{tried > 0 ? ` · ${tried} skills tried` : ""}</div>
        </div>
      </div>
      {todayCount > 0 && (
        <div className="card" style={{ padding: "11px 15px", marginBottom: 14, display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 18 }}>✓</span>
          <span style={{ fontSize: 13, flex: 1 }}><b style={{ color: "var(--ink)" }}>{todayCount} done today.</b> No cap here — keep going if you're on a roll.</span>
        </div>
      )}
      <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 12, marginBottom: 2 }}>
        {MOODS.map((m) => (
          <button key={m.id} className={`chip${mood === m.id ? " on" : ""}`} onClick={() => { setMood(m.id); setRerolls(0); }}>{m.label}</button>
        ))}
      </div>
      {rightNow && (
        <button onClick={() => setView({ kind: "detail", challenge: rightNow })} style={{ display: "block", width: "100%", textAlign: "left", marginBottom: 14 }}>
          <div className="card" style={{ padding: "12px 15px", display: "flex", alignItems: "center", gap: 12 }}>
            <span className="t-label" style={{ flex: "none" }}>RIGHT NOW · 2 MIN</span>
            <span style={{ fontSize: 13.5, fontWeight: 600, flex: 1 }}>{rightNow.title}</span>
            <span className="t-soft">›</span>
          </div>
        </button>
      )}
      <div className="t-eyebrow" style={{ marginBottom: 8 }}>{todayCount > 0 ? "Another curio" : "Today's Curio"}</div>
      <ChallengeCard c={curio} hero onOpen={() => setView({ kind: "detail", challenge: curio })} />
      <div style={{ padding: "12px 0 16px" }}>
        <button className="btn-primary" onClick={() => setView({ kind: "detail", challenge: curio })}>{todayCount > 0 ? "Start this one" : "Start today's curio"}</button>
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <button className="btn-ghost" style={{ flex: 1 }} onClick={() => setRerolls(rerolls + 1)}>↻ Not this — reroll</button>
          <button className="btn-ghost" style={{ flex: 1 }} onClick={() => setView({ kind: "hand" })}>Scroll a hand →</button>
        </div>
      </div>
      <div style={{ flex: 1 }} />
      <div style={{ textAlign: "center", padding: "16px 0 20px", borderTop: "1px solid var(--line)" }}>
        <div className="t-tag t-soft" style={{ letterSpacing: "0.06em" }}>ONE SMALL THING A DAY · DO IT SOLO OR TOGETHER</div>
        <div className="t-soft" style={{ fontSize: 12, marginTop: 4, fontStyle: "italic" }}>Trying is the win. Skill is a side effect.</div>
      </div>
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
        {currentStreak() > 1 && <div style={{ marginTop: 10 }}><span className="streak">🔥 {currentStreak()}-day rhythm</span></div>}
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

type CatFilter = "all" | "date" | "free" | "splurge" | "quick" | "todo";
const CAT_FILTERS: { id: CatFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "todo", label: "Not done" },
  { id: "date", label: "💞 Date" },
  { id: "quick", label: "⏱ Quick" },
  { id: "free", label: "Free" },
  { id: "splurge", label: "✨ Splurge" },
];

function CatalogScreen({ openDetail }: { openDetail: (c: Challenge) => void }) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<CatFilter>("all");
  const [drawer, setDrawer] = useState<string>("");
  const done = new Set(getLog().map((e) => e.challengeId));

  const matches = (c: Challenge) => {
    if (drawer && c.skillId !== drawer) return false;
    if (q && !(c.title.toLowerCase().includes(q.toLowerCase()) || (skillById(c.skillId)?.name.toLowerCase().includes(q.toLowerCase())))) return false;
    if (filter === "date") return !!c.together;
    if (filter === "free") return c.budget.cost === "free";
    if (filter === "splurge") return c.budget.cost === "splurge";
    if (filter === "quick") return c.budget.time === "2m" || c.budget.time === "15m";
    if (filter === "todo") return !done.has(c.id);
    return true;
  };
  const results = CHALLENGES.filter(matches);

  return (
    <div className="screen">
      <div className="t-eyebrow" style={{ margin: "4px 0 10px" }}>Catalog · {CHALLENGES.length} activities</div>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search 171 activities…"
        style={{ width: "100%", padding: "11px 14px", fontSize: 14, fontFamily: "inherit", background: "var(--paper-card)", border: "1px solid var(--line-strong)", borderRadius: 12, color: "var(--ink)", marginBottom: 10 }} />
      <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 10 }}>
        {CAT_FILTERS.map((f) => (
          <button key={f.id} className={`chip${filter === f.id ? " on" : ""}`} onClick={() => setFilter(f.id)}>{f.label}</button>
        ))}
      </div>
      <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 12 }}>
        <button className={`chip${drawer === "" ? " on" : ""}`} onClick={() => setDrawer("")}>All drawers</button>
        {SKILLS.map((s) => (
          <button key={s.id} className={`chip${drawer === s.id ? " on" : ""}`} onClick={() => setDrawer(drawer === s.id ? "" : s.id)}>{s.name}</button>
        ))}
      </div>
      <div className="t-tag t-soft" style={{ marginBottom: 8 }}>{results.length} {results.length === 1 ? "match" : "matches"}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingBottom: 16 }}>
        {results.map((c) => (
          <button key={c.id} onClick={() => openDetail(c)} style={{ display: "flex", width: "100%", textAlign: "left", gap: 11, padding: "9px 11px", background: "var(--paper-card)", border: "1px solid var(--line)", borderRadius: 12, alignItems: "center" }}>
            <div style={{ flex: "none", opacity: done.has(c.id) ? 0.5 : 1 }}><Sketch id={c.id} skillId={c.skillId} size={40} /></div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: done.has(c.id) ? "var(--ink-soft)" : "var(--ink)" }}>{done.has(c.id) ? "✓ " : ""}{c.title}</div>
              <div className="t-tag t-soft" style={{ marginTop: 2 }}>{skillById(c.skillId)?.name} · {TIME_LABEL[c.budget.time]} · {COST_LABEL[c.budget.cost]}{c.together ? " · 💞" : ""}</div>
            </div>
          </button>
        ))}
        {results.length === 0 && <p className="t-soft" style={{ fontSize: 13.5, textAlign: "center", padding: 20 }}>Nothing matches that — try clearing a filter.</p>}
      </div>
    </div>
  );
}

// avoids circular import gymnastics in one file
import { SKILLS as _SKILLS, CHALLENGES as _CHALLENGES } from "./data/challenges";
function require_challenges() {
  return { SKILLS: _SKILLS, CHALLENGES: _CHALLENGES };
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
                <span style={{ fontSize: 15, filter: got ? "none" : "grayscale(1)" }}>{got ? "🏅" : "🔒"}</span>
                <span style={{ fontWeight: 700, fontSize: 12.5 }}>{a.name}</span>
              </div>
              <div className="t-soft" style={{ fontSize: 11, marginTop: 3 }}>{a.desc}</div>
            </div>
          );
        })}
      </div>
      <button className="btn-ghost" style={{ marginBottom: tuneOpen ? 12 : 18, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px" }} onClick={() => setTuneOpen((o) => !o)}>
        <span>🎛️ Tune my deck</span><span className="t-soft">{tuneOpen ? "▲" : "▼"}</span>
      </button>
      {tuneOpen && <TuneDeck />}
      <div className="t-eyebrow" style={{ margin: "4px 0 12px" }}>Your log</div>
      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
        <button className="btn-ghost" style={{ flex: 1 }} onClick={doExport}>Export cabinet</button>
        <button className="btn-ghost" style={{ flex: 1 }} onClick={doImport}>Import</button>
      </div>
      <button className="btn-ghost" style={{ marginBottom: 14, borderColor: "var(--stamp)", color: "var(--stamp)" }}
        onClick={() => { if (confirm("Reset everything? Clears your log, cabinet, achievements and onboarding — handy for testing.")) { localStorage.clear(); location.reload(); } }}>
        🧪 Reset app (clear all data)
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
