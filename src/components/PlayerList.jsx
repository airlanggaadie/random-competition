export default function PlayerList({ players, locked, onRemove }) {
  if (!players.length) {
    return (
      <div className="players">
        <span className="empty">No players yet</span>
      </div>
    );
  }
  return (
    <div className="players">
      {players.map((p, i) => (
        <span className="pchip" key={p}>
          {p}
          <button className="x" disabled={locked} aria-label={`Remove ${p}`} onClick={() => onRemove(i)}>
            ×
          </button>
        </span>
      ))}
    </div>
  );
}
