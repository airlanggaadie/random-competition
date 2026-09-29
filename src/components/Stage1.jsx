import { useCallback, useRef, useState } from "react";
import { GROUP_PICKS } from "../engine/engine.js";
import RandomPicker from "./RandomPicker.jsx";

export default function Stage1({ stage, skip, onDone }) {
  const remaining = useRef(stage.results.length);
  const [finished, setFinished] = useState(false);
  const poolDone = useCallback(() => {
    if (--remaining.current === 0) {
      setFinished(true);
      onDone();
    }
  }, [onDone]);

  return (
    <section className="stage">
      <div className="stage-head">
        <h2>Stage 1 · Groups</h2>
        <span className="meta">{GROUP_PICKS} picks per group</span>
      </div>
      <div className="pools">
        {stage.results.map((r) => (
          <RandomPicker key={r.title} pool={r} picks={GROUP_PICKS} winLabel="Through" skip={skip} onDone={poolDone} />
        ))}
      </div>
      {finished && (
        <p className="hint">
          Through to the final: <strong>{stage.advancers.map((a) => a.player).join(", ")}</strong>.
        </p>
      )}
    </section>
  );
}
