import { FINAL_PICKS, GROUP_PICKS, TIEBREAK_PICKS } from "../engine/engine.js";

export default function Rules() {
  return (
    <div>
      <span className="label">Rules</span>
      <ul className="rules">
        <li>Two stages: group stage, then the final.</li>
        <li>Stage 1: {GROUP_PICKS} random picks per group. Each pick lands on one player.</li>
        <li>The players picked most often win their group. Each group sets its own number of winners, up to its player count.</li>
        <li>Final: all group winners, {FINAL_PICKS} random picks, one champion.</li>
        <li>
          A tie that decides who goes through or who wins is settled with {TIEBREAK_PICKS} picks among only the tied players,
          repeated until it is broken.
        </li>
      </ul>
    </div>
  );
}
