import { useEffect, useState } from "react";

// Suggested prep seconds by difficulty (just a nudge; user starts when ready).
const PREP_SECONDS = { easy: 60, medium: 45, hard: 25 };

export default function Topic({ topic, difficulty, onReady }) {
  const [left, setLeft] = useState(PREP_SECONDS[difficulty] ?? 45);

  useEffect(() => {
    if (left <= 0) return;
    const t = setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [left]);

  return (
    <section className="card">
      <div className="topic-head">
        <h2>{topic.title}</h2>
        <span className="prep-timer">
          {left > 0 ? `Prep · ${left}s` : "Take your time"}
        </span>
      </div>
      <p className="summary">{topic.summary}</p>
      <a className="read-more" href={topic.url} target="_blank" rel="noreferrer">
        Read more ↗
      </a>
      <div className="actions">
        <button onClick={onReady}>I'm ready to speak</button>
      </div>
    </section>
  );
}
