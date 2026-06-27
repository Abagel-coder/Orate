import { useEffect, useRef, useState } from "react";
import { useRecorder } from "./useRecorder";
import { useTranscript, speechSupported } from "./useTranscript";
import { computeMetrics } from "./metrics";

const MIN_SECONDS = 30; // below this we nudge but still allow stopping
const MAX_SECONDS = 120; // hard cap — auto-stop at 2 minutes

function formatTime(s) {
  const m = Math.floor(s / 60);
  const sec = String(s % 60).padStart(2, "0");
  return `${m}:${sec}`;
}

// Records the user speaking about `topic`, shows a live transcript + timer,
// and hands the blob, transcript, and client metrics back via onComplete.
export default function Recorder({ topic, onComplete, busy }) {
  const { recording, elapsed, level, start: startRec, stop: stopRec } =
    useRecorder();
  const { finalText, interim, start: startTx, stop: stopTx } = useTranscript();
  const [error, setError] = useState(null);
  const finishingRef = useRef(false);

  async function begin() {
    setError(null);
    try {
      await startRec();
      startTx();
    } catch {
      setError(
        "Couldn't access your microphone. Check the browser permission and try again."
      );
    }
  }

  async function finish() {
    if (finishingRef.current) return;
    finishingRef.current = true;
    const transcript = stopTx();
    const blob = await stopRec();
    const metrics = computeMetrics(transcript, elapsed);
    onComplete({ audioBlob: blob, transcript, metrics });
  }

  // Hard stop at the cap so recordings never run past 2 minutes.
  useEffect(() => {
    if (recording && elapsed >= MAX_SECONDS) finish();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recording, elapsed]);

  const liveTranscript = (finalText + interim).trim();

  // Rough running pace; only meaningful after a few seconds of speech.
  const liveWords = liveTranscript ? liveTranscript.split(/\s+/).length : 0;
  const liveWpm =
    elapsed >= 4 && liveWords > 0
      ? Math.round(liveWords / (elapsed / 60))
      : null;

  // Once stopped, grading runs while stage is still "record" — show a dedicated
  // analyzing state so the start button can't be re-triggered mid-grade.
  if (busy) {
    return (
      <section className="card center">
        <div className="spinner" />
        <p>Analyzing your delivery…</p>
      </section>
    );
  }

  return (
    <section className="card">
      <h2>Speak about: {topic.title}</h2>

      {!speechSupported && (
        <p className="muted">
          Live transcript needs Chrome or Edge — recording still works, but
          words-per-minute won't be available in this browser.
        </p>
      )}

      {error && <p className="error">{error}</p>}

      {!recording ? (
        <div className="actions">
          <button onClick={begin}>Start recording</button>
          <p className="muted">Aim for 1–2 minutes. Auto-stops at 2:00.</p>
          <p className="muted">
            🔒 Your audio is sent for grading, then discarded — never stored.
          </p>
        </div>
      ) : (
        <>
          <div className="rec-status">
            <span className="rec-dot" /> Recording {formatTime(elapsed)} /{" "}
            {formatTime(MAX_SECONDS)}
            {liveWpm != null && (
              <span className="live-wpm">· ~{liveWpm} WPM</span>
            )}
          </div>

          <div className="mic-meter" aria-hidden="true">
            <div className="mic-meter-fill" style={{ width: `${level * 100}%` }} />
          </div>

          <div className="transcript">
            {liveTranscript ? (
              <p>
                {finalText}
                <span className="interim">{interim}</span>
              </p>
            ) : (
              <p className="muted">Listening… start speaking.</p>
            )}
          </div>

          <div className="actions">
            <button onClick={finish}>
              {elapsed < MIN_SECONDS ? "Stop early & grade" : "Stop & grade"}
            </button>
          </div>
        </>
      )}
    </section>
  );
}
