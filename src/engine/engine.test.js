import { describe, expect, it } from "vitest";
import {
  FINAL_PICKS,
  GROUP_PICKS,
  TIEBREAK_PICKS,
  checkGroupName,
  checkPlayerName,
  cryptoInt,
  pickRound,
  playFinal,
  playGroupStage,
  rank,
  validate,
} from "./engine.js";

// A scripted RNG: returns the given indices in order and fails loudly if the engine asks for more.
function scripted(...indices) {
  let i = 0;
  const randInt = (n) => {
    if (i >= indices.length) throw new Error(`Script ran out after ${i} picks`);
    const v = indices[i++];
    if (v < 0 || v >= n) throw new Error(`Scripted index ${v} out of range for ${n} players`);
    return v;
  };
  randInt.used = () => i;
  return randInt;
}

const players = (order) => order.map((e) => e.player);

describe("cryptoInt", () => {
  it("stays in range and reaches every value", () => {
    const seen = new Set();
    for (let i = 0; i < 2000; i++) {
      const v = cryptoInt(5);
      expect(Number.isInteger(v) && v >= 0 && v < 5).toBe(true);
      seen.add(v);
    }
    expect(seen.size).toBe(5);
  });
});

describe("pickRound", () => {
  it("makes exactly n picks and counts them", () => {
    const { sequence, counts } = pickRound(["A", "B", "C"], 4, scripted(0, 2, 2, 0));
    expect(sequence).toEqual(["A", "C", "C", "A"]);
    expect(counts).toEqual({ A: 2, B: 0, C: 2 });
  });

  it("uses real randomness by default", () => {
    const { sequence, counts } = pickRound(["A", "B"], GROUP_PICKS);
    expect(sequence).toHaveLength(GROUP_PICKS);
    expect(counts.A + counts.B).toBe(GROUP_PICKS);
  });
});

describe("rank", () => {
  it("needs no tie-break when the cut falls between two counts", () => {
    const { order, tiebreaks } = rank(["A", "B", "C", "D"], { A: 5, B: 3, C: 1, D: 1 }, 2, scripted());
    expect(players(order).slice(0, 2)).toEqual(["A", "B"]);
    expect(tiebreaks).toEqual([]);
  });

  it("ignores a tie that does not decide a place", () => {
    const { tiebreaks } = rank(["A", "B", "C", "D"], { A: 4, B: 4, C: 1, D: 1 }, 2, scripted());
    expect(tiebreaks).toEqual([]);
  });

  it("breaks a tie across the cut with 3 picks among only the tied players", () => {
    // Spec example: Alice 5, Bob 2, Charlie 2, David 1 with 2 winners. Tie-break Bob 2, Charlie 1.
    const rng = scripted(0, 1, 0);
    const { order, tiebreaks } = rank(
      ["Alice", "Bob", "Charlie", "David"],
      { Alice: 5, Bob: 2, Charlie: 2, David: 1 },
      2,
      rng,
    );
    expect(players(order).slice(0, 2)).toEqual(["Alice", "Bob"]);
    expect(tiebreaks).toHaveLength(1);
    expect(tiebreaks[0].players).toEqual(["Bob", "Charlie"]);
    expect(tiebreaks[0].seats).toBe(1);
    expect(tiebreaks[0].sequence).toHaveLength(TIEBREAK_PICKS);
    expect(tiebreaks[0].counts).toEqual({ Bob: 2, Charlie: 1 });
    expect(rng.used()).toBe(TIEBREAK_PICKS);
  });

  it("repeats the tie-break until the tie is resolved", () => {
    // Three players tie; the first tie-break is 1-1-1, the second is decided.
    const rng = scripted(0, 1, 2, 2, 2, 0);
    const { order, tiebreaks } = rank(["A", "B", "C"], { A: 3, B: 3, C: 3 }, 1, rng);
    expect(tiebreaks).toHaveLength(2);
    expect(tiebreaks[0].counts).toEqual({ A: 1, B: 1, C: 1 });
    expect(tiebreaks[1].players).toEqual(["A", "B", "C"]);
    expect(order[0].player).toBe("C");
  });

  it("fills several open places from one tie-break", () => {
    // A, B, C tie for 2 places. Tie-break A, A, B gives A 2, B 1, C 0.
    const rng = scripted(0, 0, 1);
    const { order, tiebreaks } = rank(["A", "B", "C"], { A: 2, B: 2, C: 2 }, 2, rng);
    expect(tiebreaks).toHaveLength(1);
    expect(tiebreaks[0].seats).toBe(2);
    expect(players(order).slice(0, 2)).toEqual(["A", "B"]);
  });

  it("keeps the main count for display after a tie-break", () => {
    const { order } = rank(["A", "B"], { A: 5, B: 5 }, 1, scripted(1, 1, 0));
    expect(order).toEqual([
      { player: "B", count: 5 },
      { player: "A", count: 5 },
    ]);
  });
});

describe("validate and name checks", () => {
  it("rejects missing groups, empty groups and bad winner counts", () => {
    expect(validate([])).toMatch(/at least one group/);
    expect(validate([{ name: "A", winners: 1, players: [] }])).toMatch(/no players/);
    expect(validate([{ name: "A", winners: 0, players: ["x"] }])).toMatch(/at least 1 winner/);
    expect(validate([{ name: "A", winners: 1.5, players: ["x", "y"] }])).toMatch(/at least 1 winner/);
    expect(validate([{ name: "A", winners: 3, players: ["x", "y"] }])).toMatch(/can't have 3 winners/);
    expect(validate([{ name: "A", winners: 2, players: ["x", "y"] }])).toBeNull();
  });

  it("rejects blank, too long and duplicate names (case-insensitive)", () => {
    const groups = [{ name: "Group A", winners: 1, players: ["Alice"] }];
    expect(checkGroupName("", groups)).toMatch(/Enter/);
    expect(checkGroupName("x".repeat(31), groups)).toMatch(/up to 30/);
    expect(checkGroupName("group a", groups)).toMatch(/already/);
    expect(checkGroupName("Group B", groups)).toBeNull();
    expect(checkPlayerName("", groups)).toMatch(/Enter/);
    expect(checkPlayerName("x".repeat(25), groups)).toMatch(/up to 24/);
    expect(checkPlayerName("ALICE", groups)).toMatch(/already/);
    expect(checkPlayerName("Bob", groups)).toBeNull();
  });
});

describe("playGroupStage", () => {
  it("throws on invalid setup", () => {
    expect(() => playGroupStage([{ name: "A", winners: 2, players: ["x"] }])).toThrow(/can't have 2 winners/);
  });

  it("runs 10 picks per group and advances each group's configured winner count", () => {
    const groups = [
      { name: "Group A", winners: 2, players: ["Alice", "Bob", "Charlie", "David"] },
      { name: "Group B", winners: 1, players: ["John", "Jane", "Mike"] },
    ];
    // Group A: Alice 5, Bob 3, Charlie 1, David 1. Group B: John 6, Jane 3, Mike 1.
    const rng = scripted(0, 0, 0, 0, 0, 1, 1, 1, 2, 3, 0, 0, 0, 0, 0, 0, 1, 1, 1, 2);
    const { results, advancers } = playGroupStage(groups, rng);
    expect(results.map((r) => r.sequence.length)).toEqual([GROUP_PICKS, GROUP_PICKS]);
    expect(results[0].winners).toEqual(["Alice", "Bob"]);
    expect(results[1].winners).toEqual(["John"]);
    expect(advancers).toEqual([
      { player: "Alice", group: "Group A" },
      { player: "Bob", group: "Group A" },
      { player: "John", group: "Group B" },
    ]);
  });

  it("advances everyone when the winner count equals the player count", () => {
    const { results } = playGroupStage([{ name: "A", winners: 3, players: ["x", "y", "z"] }]);
    expect(results[0].winners.sort()).toEqual(["x", "y", "z"]);
    expect(results[0].tiebreaks).toEqual([]);
  });

  it("always advances exactly the configured number with real randomness", () => {
    for (let i = 0; i < 200; i++) {
      const { results } = playGroupStage([
        { name: "A", winners: 2, players: ["a", "b", "c", "d", "e"] },
        { name: "B", winners: 1, players: ["f", "g"] },
      ]);
      expect(results[0].winners).toHaveLength(2);
      expect(results[1].winners).toHaveLength(1);
    }
  });
});

describe("playFinal", () => {
  const advancers = [
    { player: "Alice", group: "Group A" },
    { player: "Bob", group: "Group A" },
    { player: "John", group: "Group B" },
  ];

  it("runs 15 picks and crowns the most-picked player", () => {
    // Alice 7, Bob 5, John 3.
    const rng = scripted(...Array(7).fill(0), ...Array(5).fill(1), ...Array(3).fill(2));
    const final = playFinal(advancers, rng);
    expect(final.sequence).toHaveLength(FINAL_PICKS);
    expect(final.champion).toBe("Alice");
    expect(final.tiebreaks).toEqual([]);
  });

  it("breaks a tie for first among only the tied players", () => {
    // Alice 6, Bob 6, John 3, then tie-break Bob, Bob, Alice.
    const rng = scripted(...Array(6).fill(0), ...Array(6).fill(1), ...Array(3).fill(2), 1, 1, 0);
    const final = playFinal(advancers, rng);
    expect(final.tiebreaks).toHaveLength(1);
    expect(final.tiebreaks[0].players).toEqual(["Alice", "Bob"]);
    expect(final.champion).toBe("Bob");
  });

  it("always produces exactly one champion with real randomness", () => {
    for (let i = 0; i < 200; i++) {
      const final = playFinal(advancers);
      expect(advancers.map((a) => a.player)).toContain(final.champion);
      expect(final.order[0].player).toBe(final.champion);
    }
  });

  it("handles a single finalist", () => {
    const final = playFinal([{ player: "Solo", group: "A" }]);
    expect(final.champion).toBe("Solo");
  });

  it("rejects an empty final", () => {
    expect(() => playFinal([])).toThrow();
  });
});
