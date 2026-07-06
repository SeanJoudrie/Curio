import { describe, it, expect } from "vitest";
import { firstSentence } from "./text";
import { themePhoto, drawerPhoto } from "./Sketch";
import { swipeDeck } from "./deck";

describe("firstSentence", () => {
  it("takes only the first sentence", () => {
    expect(firstSentence("Do this. Then that.")).toBe("Do this.");
  });
  it("does not cut on a decimal", () => {
    expect(firstSentence("You react in about 0.18 seconds. Do five.")).toBe("You react in about 0.18 seconds.");
  });
  it("returns the whole string when there is no sentence break", () => {
    expect(firstSentence("One clause only")).toBe("One clause only");
  });
});

describe("photos", () => {
  it("matches a topical theme photo by title", () => {
    expect(themePhoto("Bake a cake from scratch")).toContain("/themes/");
    expect(themePhoto("Solve a chess mate-in-one")).toContain("chess");
  });
  it("returns undefined when nothing matches", () => {
    expect(themePhoto("qwertular zzz nonsense")).toBeUndefined();
  });
  it("gives every real drawer a hero photo", () => {
    expect(drawerPhoto("CUL")).toContain("/drawers/CUL.jpg");
    expect(drawerPhoto("ZZZ")).toBeUndefined();
  });
});

describe("swipeDeck", () => {
  it("is deterministic for the same day + mood", () => {
    const a = swipeDeck("any").map((c) => c.id);
    const b = swipeDeck("any").map((c) => c.id);
    expect(a).toEqual(b);
  });
  it("is a finite hand (<= 40) with no duplicates", () => {
    const deck = swipeDeck("any");
    expect(deck.length).toBeGreaterThan(0);
    expect(deck.length).toBeLessThanOrEqual(40);
    expect(new Set(deck.map((c) => c.id)).size).toBe(deck.length);
  });
  it("never puts three of the same drawer in a row (variety > bubble)", () => {
    const d = swipeDeck("any");
    let bad = false;
    for (let i = 2; i < d.length; i++) {
      if (d[i].skillId === d[i - 1].skillId && d[i].skillId === d[i - 2].skillId) bad = true;
    }
    expect(bad).toBe(false);
  });
  it("free mood only surfaces free challenges", () => {
    expect(swipeDeck("free").every((c) => c.budget.cost === "free")).toBe(true);
  });
});
