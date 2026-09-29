import { TIEBREAK_PICKS } from "../engine/engine.js";
import { plural } from "../utils.js";

export default function Tiebreak({ tb, n }) {
  return (
    <div className="tb">
      <div>
        <strong>Tie-break {n}.</strong> {tb.players.join(", ")} tied for {plural(tb.seats, "place")}. {TIEBREAK_PICKS}{" "}
        picks among them:
      </div>
      <div className="seq">
        {tb.sequence.map((p, i) => (
          <span className="tb" key={i}>
            {p}
          </span>
        ))}
      </div>
      <div className="tb-counts">
        {tb.players.map((p) => (
          <span key={p}>
            {p} {tb.counts[p]}
          </span>
        ))}
      </div>
    </div>
  );
}
