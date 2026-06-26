// Full-screen entry page: the floating Orate wordmark, a difficulty picker, and
// the call to action that kicks off a session.
const LEVELS = [
  { id: "easy", label: "Easy" },
  { id: "medium", label: "Medium" },
  { id: "hard", label: "Hard" },
];

export default function Landing({
  onStart,
  onAbout,
  onStats,
  loading,
  error,
  difficulty,
  setDifficulty,
}) {
  return (
    <div className="landing">
      <div className="landing-hero">
        <h1 className="brand">Orate</h1>
        <p className="tagline">Pick a topic. Speak your mind. Get coached.</p>

        <div className="level-picker" role="group" aria-label="Difficulty">
          {LEVELS.map((lvl) => (
            <button
              key={lvl.id}
              className={`level ${difficulty === lvl.id ? "level-on" : ""}`}
              onClick={() => setDifficulty(lvl.id)}
            >
              {lvl.label}
            </button>
          ))}
        </div>

        <button className="cta" disabled={loading} onClick={onStart}>
          {loading ? "Loading…" : "Start Learning"}
        </button>
        {error && <p className="landing-error">{error}</p>}

        <div className="landing-nav">
          <button className="about-link" onClick={onStats}>
            My progress
          </button>
          <button className="about-link" onClick={onAbout}>
            About
          </button>
        </div>
      </div>
    </div>
  );
}
