import { useRef, useState } from "react";
import { MAX_PLAYER_NAME } from "../engine/engine.js";
import PlayerList from "./PlayerList.jsx";

const clampWinners = (n, players) => Math.max(1, Math.min(n, Math.max(1, players)));

export default function Group({ group, index, locked, onChange, onRemove, onAddPlayer }) {
  const [name, setName] = useState("");
  const inputRef = useRef(null);

  const submit = (e) => {
    e.preventDefault();
    if (onAddPlayer(name.trim())) {
      setName("");
      inputRef.current?.focus();
    }
  };
  const setWinners = (v) => {
    const n = parseInt(v, 10);
    onChange({ ...group, winners: clampWinners(Number.isFinite(n) ? n : 1, group.players.length) });
  };
  const removePlayer = (i) => {
    const players = group.players.filter((_, j) => j !== i);
    onChange({ ...group, players, winners: clampWinners(group.winners, players.length) });
  };

  return (
    <div className="gcard">
      <div className="ghead">
        <h3>{group.name}</h3>
        <span className="wins">
          <label htmlFor={`wins-${index}`}>Winners</label>
          <input
            id={`wins-${index}`}
            type="number"
            min="1"
            max={Math.max(1, group.players.length)}
            value={group.winners}
            disabled={locked}
            onChange={(e) => setWinners(e.target.value)}
          />
          <button className="x" disabled={locked} aria-label={`Remove ${group.name}`} onClick={onRemove}>
            ×
          </button>
        </span>
      </div>
      <PlayerList players={group.players} locked={locked} onRemove={removePlayer} />
      <form className="row" onSubmit={submit}>
        <input
          ref={inputRef}
          type="text"
          placeholder="Player name"
          aria-label={`Player name for ${group.name}`}
          maxLength={MAX_PLAYER_NAME}
          value={name}
          disabled={locked}
          onChange={(e) => setName(e.target.value)}
        />
        <button type="submit" disabled={locked}>
          Add
        </button>
      </form>
    </div>
  );
}
