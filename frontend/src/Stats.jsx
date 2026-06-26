import { useRef, useState } from "react";
import {
  loadAttempts,
  clearAttempts,
  exportJSON,
  importJSON,
} from "./storage";
import { computeStats, avgScore } from "./statsUtil";

// Inline SVG trend line of average score per session over time.
function Sparkline({ series }) {
  if (series.length < 2) {
    return <p className="muted">Record a few more sessions to see your trend.</p>;
  }
  const w = 320;
  const h = 90;
  const pad = 8;
  const max = 10;
  const step = (w - pad * 2) / (series.length - 1);
  const points = series.map((p, i) => {
    const x = pad + i * step;
    const y = h - pad - (p.avg / max) * (h - pad * 2);
    return { x, y };
  });
  const line = points.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="sparkline" role="img" aria-label="Score trend">
      <polyline className="spark-line" points={line} />
      {points.map((p, i) => (
        <circle key={i} className="spark-dot" cx={p.x} cy={p.y} r="3" />
      ))}
    </svg>
  );
}

function Stat({ label, value, sub }) {
  return (
    <div className="stat">
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}

export default function Stats({ onBack }) {
  const [attempts, setAttempts] = useState(() => loadAttempts());
  const [notice, setNotice] = useState(null);
  const fileRef = useRef(null);
  const stats = computeStats(attempts);

  function handleClear() {
    if (!confirm("Clear all your session history? This can't be undone.")) return;
    clearAttempts();
    setAttempts([]);
    setNotice(null);
  }

  function handleExport() {
    const blob = new Blob([exportJSON()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "orate-history.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImport(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const count = importJSON(String(reader.result));
        setAttempts(loadAttempts());
        setNotice(`Imported ${count} session${count === 1 ? "" : "s"}.`);
      } catch (err) {
        setNotice(err.message || "Import failed.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  const deltaLabel =
    stats.total > 1
      ? `${stats.delta >= 0 ? "▲" : "▼"} ${Math.abs(stats.delta).toFixed(1)} since first`
      : "—";

  return (
    <main className="app">
      <header className="brand-bar">
        <button className="brand-link" onClick={onBack}>
          Orate
        </button>
      </header>

      <section className="card">
        <h2>Your progress</h2>

        {stats.total === 0 ? (
          <p className="muted">
            No sessions yet. Record one and your stats will show up here.
          </p>
        ) : (
          <>
            <div className="stat-grid">
              <Stat label="Sessions" value={stats.total} />
              <Stat label="Day streak" value={stats.streak} />
              <Stat
                label="Best avg"
                value={stats.bestAvg.toFixed(1)}
                sub="out of 10"
              />
              <Stat label="Avg WPM" value={stats.avgWpm} />
            </div>

            <h3>Average score over time</h3>
            <div className="stat-sub" style={{ marginBottom: "0.5rem" }}>
              Latest {stats.latestAvg.toFixed(1)} · {deltaLabel}
            </div>
            <Sparkline series={stats.series} />

            <h3>Recent sessions</h3>
            <ul className="attempt-list">
              {[...attempts]
                .slice(-8)
                .reverse()
                .map((a) => (
                  <li key={a.id} className="attempt-row">
                    <span className="attempt-topic">{a.topic}</span>
                    <span className="attempt-meta">
                      {avgScore(a.scores).toFixed(1)}/10 · {a.wpm} WPM
                      {a.difficulty && a.difficulty !== "any"
                        ? ` · ${a.difficulty}`
                        : ""}
                    </span>
                  </li>
                ))}
            </ul>
          </>
        )}

        {notice && <p className="muted">{notice}</p>}

        <div className="stat-actions">
          <button onClick={handleExport} disabled={stats.total === 0}>
            Export
          </button>
          <button onClick={() => fileRef.current?.click()}>Import</button>
          <button
            onClick={handleClear}
            disabled={stats.total === 0}
            className="danger"
          >
            Clear
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            onChange={handleImport}
            hidden
          />
        </div>

        <div className="actions">
          <button onClick={onBack}>Back</button>
        </div>
      </section>
    </main>
  );
}
