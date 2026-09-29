// Simulation rules only: no React, no DOM, no timing.
// Every random function takes an optional `randInt(n)` so tests can script the draw.

export const GROUP_PICKS = 10;
export const FINAL_PICKS = 15;
export const TIEBREAK_PICKS = 3;
export const MAX_GROUP_NAME = 30;
export const MAX_PLAYER_NAME = 24;

// Uniform integer in [0, n) from the browser's cryptographic RNG (rejection sampling, no modulo bias).
export function cryptoInt(n) {
  const buf = new Uint32Array(1);
  const limit = Math.floor(0x100000000 / n) * n;
  do {
    globalThis.crypto.getRandomValues(buf);
  } while (buf[0] >= limit);
  return buf[0] % n;
}

// n picks; each pick selects one of the players.
export function pickRound(players, n, randInt = cryptoInt) {
  const sequence = [];
  const counts = Object.fromEntries(players.map((p) => [p, 0]));
  for (let i = 0; i < n; i++) {
    const p = players[randInt(players.length)];
    sequence.push(p);
    counts[p]++;
  }
  return { sequence, counts };
}

// Ranks players by count and fills `seats` places. A tie across the cut is settled
// with tie-break rounds among only the tied players, repeated until it is broken.
// Ties that do not decide a seat are left as they are.
export function rank(players, counts, seats, randInt = cryptoInt) {
  const tiebreaks = [];
  const entries = players.map((p) => ({ player: p, count: counts[p], key: [counts[p]] }));
  const order = rankInner(entries, seats, randInt, tiebreaks);
  return { order: order.map(({ player, count }) => ({ player, count })), tiebreaks };
}

// Compares sort keys: main count first, then each tie-break count in turn.
function cmp(a, b) {
  for (let i = 0; i < Math.max(a.key.length, b.key.length); i++) {
    const d = (b.key[i] ?? -1) - (a.key[i] ?? -1);
    if (d) return d;
  }
  return 0;
}

function rankInner(list, seats, randInt, tiebreaks) {
  const sorted = [...list].sort(cmp);
  if (seats <= 0 || seats >= sorted.length) return sorted;
  const cut = sorted[seats - 1];
  const first = sorted.findIndex((e) => cmp(e, cut) === 0);
  let last = first;
  while (last + 1 < sorted.length && cmp(sorted[last + 1], cut) === 0) last++;
  if (last < seats) return sorted; // the cut falls cleanly between two counts
  const tied = sorted.slice(first, last + 1);
  const openSeats = seats - first;
  const round = pickRound(tied.map((e) => e.player), TIEBREAK_PICKS, randInt);
  tiebreaks.push({ players: tied.map((e) => e.player), seats: openSeats, ...round });
  const extended = tied.map((e) => ({ ...e, key: [...e.key, round.counts[e.player]] }));
  return [
    ...sorted.slice(0, first),
    ...rankInner(extended, openSeats, randInt, tiebreaks),
    ...sorted.slice(last + 1),
  ];
}

// Input checks shared by the setup form and the engine. Each returns an error message or null.
export function checkGroupName(name, groups) {
  if (!name) return "Enter a group name.";
  if (name.length > MAX_GROUP_NAME) return `Group names can be up to ${MAX_GROUP_NAME} characters.`;
  if (groups.some((g) => g.name.toLowerCase() === name.toLowerCase())) return `There is already a group called ${name}.`;
  return null;
}

export function checkPlayerName(name, groups) {
  if (!name) return "Enter a player name.";
  if (name.length > MAX_PLAYER_NAME) return `Player names can be up to ${MAX_PLAYER_NAME} characters.`;
  if (groups.some((g) => g.players.some((p) => p.toLowerCase() === name.toLowerCase()))) {
    return `${name} is already in a group. Use a different name.`;
  }
  return null;
}

export function validate(groups) {
  if (!groups.length) return "Add at least one group.";
  for (const g of groups) {
    if (!g.players.length) return `${g.name} has no players. Add a player or remove the group.`;
    if (!Number.isInteger(g.winners) || g.winners < 1) return `${g.name} needs at least 1 winner.`;
    if (g.winners > g.players.length) {
      return `${g.name} has ${g.players.length} player${g.players.length === 1 ? "" : "s"}, so it can't have ${g.winners} winners.`;
    }
  }
  return null;
}

// Stage 1: each group draws GROUP_PICKS times and its top `winners` players advance.
export function playGroupStage(groups, randInt = cryptoInt) {
  const err = validate(groups);
  if (err) throw new Error(err);
  const results = groups.map((g) => {
    const round = pickRound(g.players, GROUP_PICKS, randInt);
    const { order, tiebreaks } = rank(g.players, round.counts, g.winners, randInt);
    return {
      title: g.name,
      players: g.players,
      seats: g.winners,
      ...round,
      order,
      tiebreaks,
      winners: order.slice(0, g.winners).map((e) => e.player),
    };
  });
  const advancers = results.flatMap((r) => r.winners.map((p) => ({ player: p, group: r.title })));
  return { results, advancers };
}

// Final: all advancers draw FINAL_PICKS times and exactly one player wins.
export function playFinal(advancers, randInt = cryptoInt) {
  if (!advancers.length) throw new Error("The final needs at least one player.");
  const players = advancers.map((a) => a.player);
  const round = pickRound(players, FINAL_PICKS, randInt);
  const { order, tiebreaks } = rank(players, round.counts, 1, randInt);
  return { title: "Finalists", players, seats: 1, ...round, order, tiebreaks, champion: order[0].player };
}
