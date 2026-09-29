import { plural } from "../utils.js";
import WinnerDisplay from "./WinnerDisplay.jsx";

export default function Results({ stage1, final, onRestart }) {
  const tbTotal = stage1.results.reduce((n, r) => n + r.tiebreaks.length, 0) + final.tiebreaks.length;
  const groupOf = (player) => stage1.advancers.find((a) => a.player === player).group;

  return (
    <section className="summary">
      <WinnerDisplay stage1={stage1} final={final} />
      <h2>Final results</h2>
      <p className="hint">
        {plural(stage1.results.length, "group")}, {plural(stage1.advancers.length, "finalist")}, {plural(tbTotal, "tie-break")}{" "}
        played.
      </p>
      <div className="scroll">
        <table>
          <thead>
            <tr>
              <th className="n">Rank</th>
              <th>Player</th>
              <th>Group</th>
              <th className="n">Group picks</th>
              <th className="n">Final picks</th>
            </tr>
          </thead>
          <tbody>
            {final.order.map((e, i) => {
              const group = groupOf(e.player);
              const gp = stage1.results.find((r) => r.title === group).counts[e.player];
              return (
                <tr key={e.player} className={i === 0 ? "first" : ""}>
                  <td className="n">{i + 1}</td>
                  <td>{e.player}</td>
                  <td>{group}</td>
                  <td className="n">{gp}</td>
                  <td className="n">{e.count}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="actions">
        <button className="primary" onClick={onRestart}>
          Restart Competition
        </button>
      </div>
    </section>
  );
}
