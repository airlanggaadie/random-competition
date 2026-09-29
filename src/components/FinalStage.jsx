import { FINAL_PICKS } from "../engine/engine.js";
import RandomPicker from "./RandomPicker.jsx";

export default function FinalStage({ final, skip, onDone }) {
  return (
    <section className="stage">
      <div className="stage-head">
        <h2>Final Stage</h2>
        <span className="meta">{FINAL_PICKS} picks · 1 winner</span>
      </div>
      <div className="pools">
        <RandomPicker pool={final} picks={FINAL_PICKS} winLabel="Champion" skip={skip} onDone={onDone} />
      </div>
    </section>
  );
}
