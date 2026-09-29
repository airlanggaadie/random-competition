import { useCallback, useEffect, useState } from "react";
import { playFinal, playGroupStage, validate } from "./engine/engine.js";
import { prefersReducedMotion } from "./hooks/useReplay.js";
import { loadGroups, saveGroups } from "./setupStorage.js";
import CompetitionSetup from "./components/CompetitionSetup.jsx";
import FinalStage from "./components/FinalStage.jsx";
import Results from "./components/Results.jsx";
import Rules from "./components/Rules.jsx";
import Stage1 from "./components/Stage1.jsx";

export default function App() {
  const [groups, setGroups] = useState(loadGroups);
  const [error, setError] = useState(null);
  const [stage1, setStage1] = useState(null);
  const [final, setFinal] = useState(null);
  const [animating, setAnimating] = useState(false);
  const [skip, setSkip] = useState(false);
  const [runId, setRunId] = useState(0);

  useEffect(() => saveGroups(groups), [groups]);
  const finishAnim = useCallback(() => {
    setAnimating(false);
    setSkip(false);
  }, []);

  // The engine decides a whole stage at once; the components only replay it.
  const play = () => {
    if (animating) return;
    if (!stage1) {
      const err = validate(groups);
      setError(err);
      if (err) return;
      setStage1(playGroupStage(groups));
    } else if (!final) {
      setFinal(playFinal(stage1.advancers));
    } else return;
    setSkip(prefersReducedMotion());
    setAnimating(true);
  };
  const restart = () => {
    setStage1(null);
    setFinal(null);
    setAnimating(false);
    setSkip(false);
    setError(null);
    setRunId((n) => n + 1);
  };

  const locked = !!stage1;
  const label = !stage1 ? "Start competition" : !final ? "Play final stage" : "Competition finished";
  const done = final && !animating;

  return (
    <div className="wrap">
      <header className="top">
        <h1>Draw Cup</h1>
        <span className="tag">Build groups, then let the random draw decide who goes through.</span>
      </header>
      <aside className="panel" aria-label="Competition setup">
        <CompetitionSetup groups={groups} setGroups={setGroups} locked={locked} error={error} setError={setError} />
        <div className="actions">
          <button className="primary" disabled={animating || !!final} onClick={play}>
            {label}
          </button>
          {animating && <button onClick={() => setSkip(true)}>Skip animation</button>}
          <button disabled={!stage1} onClick={restart}>
            Restart
          </button>
        </div>
        <Rules />
      </aside>
      <main className="board" aria-live="polite" key={runId}>
        {done && <Results stage1={stage1} final={final} onRestart={restart} />}
        {final && <FinalStage final={final} skip={skip} onDone={finishAnim} />}
        {stage1 && <Stage1 stage={stage1} skip={skip || !!final} onDone={finishAnim} />}
        {!stage1 && (
          <div className="placeholder">
            Set up your groups, then press <strong>Start competition</strong>.
          </div>
        )}
      </main>
    </div>
  );
}
