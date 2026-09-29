import { FINAL_PICKS } from "../engine/engine.js";

export default function WinnerDisplay({ stage1, final }) {
  const from = stage1.advancers.find((a) => a.player === final.champion).group;
  return (
    <div className="champion">
      <span className="label">🏆 Competition winner</span>
      <span className="who">{final.champion}</span>
      <ul className="path">
        <li>
          <span className="label">Stage 1</span> ✓ Won {from} · ✓ Advanced to Final
        </li>
        <li>
          <span className="label">Final Stage</span> ✓ {final.counts[final.champion]} / {FINAL_PICKS} picks · 🏆 Final winner
        </li>
      </ul>
    </div>
  );
}
