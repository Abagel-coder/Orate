import { useState } from "react";
import { fetchTopic, gradeSpeech } from "./api";
import { saveAttempt, loadAttempts } from "./storage";
import Landing from "./Landing";
import About from "./About";
import Stats from "./Stats";
import Topic from "./Topic";
import Recorder from "./Recorder";
import Results from "./Results";

// Screen flow: start -> topic -> record -> results (with about/stats side views)
export default function App() {
  const [stage, setStage] = useState("start");
  const [difficulty, setDifficulty] = useState("medium");
  const [topic, setTopic] = useState(null);
  const [result, setResult] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [transcript, setTranscript] = useState("");
  const [previous, setPrevious] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // `query` is an optional user-typed topic; empty means random.
  async function startSession(query) {
    setLoading(true);
    setError(null);
    try {
      setTopic(await fetchTopic(query));
      setStage("topic");
    } catch {
      setError(
        query
          ? `Couldn't find a topic for "${query}". Try another, or go random.`
          : "Couldn't load a topic. Check the backend and try again."
      );
    } finally {
      setLoading(false);
    }
  }

  // Gemini owns the qualitative scores; we attach the client-side WPM and
  // filler counts so the model never has to (unreliably) count them, then
  // persist the session for the stats dashboard.
  async function finishRecording({ audioBlob, transcript: spoken, metrics }) {
    setLoading(true);
    setError(null);
    try {
      const graded = await gradeSpeech({
        audioBlob,
        topic: topic.title,
        transcript: spoken,
        difficulty,
      });
      const merged = {
        ...graded,
        wpm: metrics.wpm,
        fillerWords: metrics.fillerWords,
      };

      // Grab the prior attempt for the comparison before saving this one.
      const history = loadAttempts();
      setPrevious(history.length ? history[history.length - 1] : null);

      setResult(merged);
      setTranscript(spoken);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      setAudioUrl(URL.createObjectURL(audioBlob));

      if (!merged._failed) {
        saveAttempt({
          topic: topic.title,
          difficulty,
          scores: merged.scores || {},
          wpm: merged.wpm || 0,
          fillerTotal: Object.values(merged.fillerWords || {}).reduce(
            (sum, n) => sum + n,
            0
          ),
        });
      }
      setStage("results");
    } catch {
      setError("Grading failed. Check the backend and try again.");
    } finally {
      setLoading(false);
    }
  }

  function restart() {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setTranscript("");
    setPrevious(null);
    setResult(null);
    setTopic(null);
    setStage("start");
  }

  // The landing page is its own full-screen view.
  if (stage === "start") {
    return (
      <Landing
        onStart={startSession}
        onAbout={() => setStage("about")}
        onStats={() => setStage("stats")}
        loading={loading}
        error={error}
        difficulty={difficulty}
        setDifficulty={setDifficulty}
      />
    );
  }

  if (stage === "about") {
    return <About onBack={() => setStage("start")} />;
  }

  if (stage === "stats") {
    return <Stats onBack={() => setStage("start")} />;
  }

  return (
    <main className="app">
      <header className="brand-bar">
        <button className="brand-link" onClick={restart}>
          Orate
        </button>
      </header>

      {error && <p className="error">{error}</p>}

      {stage === "topic" && topic && (
        <Topic
          topic={topic}
          difficulty={difficulty}
          onReady={() => setStage("record")}
        />
      )}

      {stage === "record" && topic && (
        <Recorder topic={topic} onComplete={finishRecording} busy={loading} />
      )}

      {stage === "results" && result && (
        <Results
          result={result}
          audioUrl={audioUrl}
          transcript={transcript}
          previous={previous}
          onRestart={restart}
          onStats={() => setStage("stats")}
        />
      )}
    </main>
  );
}
