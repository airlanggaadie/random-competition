import { useState } from "react";
import { MAX_GROUP_NAME, checkGroupName, checkPlayerName } from "../engine/engine.js";
import { sampleGroups } from "../setupStorage.js";
import Group from "./Group.jsx";

export default function CompetitionSetup({ groups, setGroups, locked, error, setError }) {
  const [groupName, setGroupName] = useState("");

  const addGroup = (e) => {
    e.preventDefault();
    const name = groupName.trim() || `Group ${String.fromCharCode(65 + groups.length)}`;
    const err = checkGroupName(name, groups);
    setError(err);
    if (err) return;
    setGroups([...groups, { name, winners: 1, players: [] }]);
    setGroupName("");
  };
  const addPlayer = (gi) => (name) => {
    const err = checkPlayerName(name, groups);
    setError(err);
    if (err) return false;
    setGroups(groups.map((g, i) => (i === gi ? { ...g, players: [...g.players, name] } : g)));
    return true;
  };
  const update = (gi) => (g) => {
    setError(null);
    setGroups(groups.map((x, i) => (i === gi ? g : x)));
  };
  const remove = (gi) => () => {
    setError(null);
    setGroups(groups.filter((_, i) => i !== gi));
  };
  const reset = (next) => () => {
    setError(null);
    setGroups(next());
  };

  return (
    <div className="panel-section">
      <form className="row" onSubmit={addGroup}>
        <input
          type="text"
          placeholder="New group name"
          aria-label="New group name"
          maxLength={MAX_GROUP_NAME}
          value={groupName}
          disabled={locked}
          onChange={(e) => setGroupName(e.target.value)}
        />
        <button type="submit" disabled={locked}>
          Add group
        </button>
      </form>
      <div className="groups">
        {groups.length ? (
          groups.map((g, i) => (
            <Group
              key={g.name}
              group={g}
              index={i}
              locked={locked}
              onChange={update(i)}
              onRemove={remove(i)}
              onAddPlayer={addPlayer(i)}
            />
          ))
        ) : (
          <p className="empty">No groups yet. Add one above or load the sample.</p>
        )}
      </div>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <div className="actions">
        <button disabled={locked} onClick={reset(sampleGroups)}>
          Load sample groups
        </button>
        <button disabled={locked} onClick={reset(() => [])}>
          Clear all groups
        </button>
      </div>
    </div>
  );
}
