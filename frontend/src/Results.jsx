// A coach's report card: qualitative scores from Gemini plus the client-side
// pacing and filler metrics, rendered as bars/meters rather than raw numbers.

const SCORE_KEYS = ["clarity", "pacing", "structure", "confidence"];

// Comfortable spoken-presentation range; used to judge the user's pace.
const IDEAL_MIN = 120;
const IDEAL_MAX = 150;
const WPM_FLOOR = 60;
const WPM_CEIL = 200;

function pacingVerdict(wpm) {
  if (!wpm) return { label: "No speech detected", tone: "neutral" };
  if (wpm < IDEAL_MIN) return { label: "A bit slow", tone: "warn" };
  if (wpm > IDEAL_MAX) return { label: "A bit fast", tone: "warn" };
  return { label: "Great pace", tone: "good" };
}

// Position (0–100%) of a WPM value along the meter track.
function wpmToPercent(wpm) {
  const clamped = Math.max(WPM_FLOOR, Math.min(WPM_CEIL, wpm));
  return ((clamped - WPM_FLOOR) / (WPM_CEIL - WPM_FLOOR)) * 100;
}

export default function Results({ result, onRestart, onStats }) {
  if (result._failed) {
    return (
      <section className="card">
        <h2>Grading hit a snag</h2>
        <p className="error">{result.error || "The grader couldn't process that recording."}</p>
        <button onClick={onRestart}>Try again</button>
      </section>
    );
  }

  const {
    scores = {},
    wpm = 0,
    fillerWords = {},
    strengths = [],
    improvements = [],
    coaching,
  } = result;

  const verdict = pacingVerdict(wpm);
  const fillerEntries = Object.entries(fillerWords).sort((a, b) => b[1] - a[1]);
  const fillerTotal = fillerEntries.reduce((sum, [, n]) => sum + n, 0);

  return (
    <section className="card results">
      <h2>Your feedback</h2>
      {result._mock && (
        <p className="muted">(mock data — set GEMINI_API_KEY for real grading)</p>
      )}

      <div className="scores">
        {SCORE_KEYS.map((key) => {
          const value = scores[key] ?? 0;
          return (
            <div className="score-row" key={key}>
              <span className="score-label">{key}</span>
              <div className="score-track">
                <div className="score-fill" style={{ width: `${value * 10}%` }} />
              </div>
              <span className="score-num">{scores[key] ?? "–"}/10</span>
            </div>
          );
        })}
      </div>

      <div className="pacing">
        <div className="pacing-head">
          <span>Pacing</span>
          <span className={`badge badge-${verdict.tone}`}>
            {wpm} WPM · {verdict.label}
          </span>
        </div>
        <div className="wpm-meter">
          <div
            className="wpm-ideal"
            style={{
              left: `${wpmToPercent(IDEAL_MIN)}%`,
              width: `${wpmToPercent(IDEAL_MAX) - wpmToPercent(IDEAL_MIN)}%`,
            }}
          />
          <div className="wpm-marker" style={{ left: `${wpmToPercent(wpm)}%` }} />
        </div>
        <div className="wpm-scale">
          <span>{WPM_FLOOR}</span>
          <span>ideal {IDEAL_MIN}–{IDEAL_MAX}</span>
          <span>{WPM_CEIL}</span>
        </div>
      </div>

      <div className="fillers">
        <div className="pacing-head">
          <span>Filler words</span>
          <span className={`badge ${fillerTotal === 0 ? "badge-good" : "badge-warn"}`}>
            {fillerTotal} total
          </span>
        </div>
        {fillerEntries.length > 0 ? (
          <ul className="chip-list">
            {fillerEntries.map(([word, count]) => (
              <li key={word} className="chip">
                {word} <strong>×{count}</strong>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">None caught — clean delivery.</p>
        )}
      </div>

      {strengths.length > 0 && (
        <div className="feedback-block">
          <h3>Strengths</h3>
          <ul>
            {strengths.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
      )}

      {improvements.length > 0 && (
        <div className="feedback-block">
          <h3>Work on</h3>
          <ul>
            {improvements.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
      )}

      {coaching && (
        <div className="coaching">
          <h3>Coach's note</h3>
          <p>{coaching}</p>
        </div>
      )}

      <div className="actions result-actions">
        <button onClick={onRestart}>Try another</button>
        <button className="ghost" onClick={onStats}>
          View progress
        </button>
      </div>
    </section>
  );
}
