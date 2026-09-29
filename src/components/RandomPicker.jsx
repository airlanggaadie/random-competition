import { PICK_MS, TIEBREAK_MS, useReplay } from "../hooks/useReplay.js";
import Tiebreak from "./Tiebreak.jsx";

// Replays one pool's picks (then its tie-breaks) and reveals the result.
export default function RandomPicker({ pool, picks, winLabel, skip, onDone }) {
  const total = pool.sequence.length + pool.tiebreaks.length;
  const delayFor = (f) => (f < pool.sequence.length ? PICK_MS : TIEBREAK_MS);
  const frame = useReplay(total, delayFor, skip, onDone);

  const shown = pool.sequence.slice(0, frame);
  const counts = Object.fromEntries(pool.players.map((p) => [p, 0]));
  shown.forEach((p) => counts[p]++);
  const current = frame > 0 && frame <= pool.sequence.length ? pool.sequence[frame - 1] : null;
  const done = frame >= total;
  const winners = new Set(pool.order.slice(0, pool.seats).map((e) => e.player));
  const lanes = done ? pool.order.map((e) => e.player) : pool.players;
  const tbShown = Math.max(0, frame - pool.sequence.length);

  return (
    <section className="pool">
      <div className="pool-head">
        <h3>{pool.title}</h3>
        <span className="meta">
          {done ? `${picks} / ${picks} picks` : `pick ${Math.min(frame, picks)} / ${picks}`} · {pool.seats} to win
        </span>
      </div>
      <div className="lanes">
        {lanes.map((p) => {
          const cls = done ? (winners.has(p) ? "win" : "out") : p === current ? "hit" : "";
          return (
            <div className={`lane ${cls}`} key={p}>
              <span className="nm">
                <span>{p}</span>
                {done && <span className={`badge ${winners.has(p) ? "w" : "o"}`}>{winners.has(p) ? winLabel : "Out"}</span>}
              </span>
              <span className="bar">
                <span className="fill" style={{ width: `${(counts[p] / picks) * 100}%` }} />
              </span>
              <span className="ct">{counts[p]}</span>
            </div>
          );
        })}
      </div>
      <div className="seq" aria-label="Pick order">
        {shown.map((p, i) => (
          <span key={i}>{p}</span>
        ))}
      </div>
      {pool.tiebreaks.slice(0, tbShown).map((tb, i) => (
        <Tiebreak key={i} tb={tb} n={i + 1} />
      ))}
    </section>
  );
}
