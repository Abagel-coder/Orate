// Static About view — what Orate is, how it works, and the privacy stance.
export default function About({ onBack }) {
  return (
    <main className="app">
      <header className="brand-bar">
        <button className="brand-link" onClick={onBack}>
          Orate
        </button>
      </header>

      <section className="card about">
        <h2>About Orate</h2>
        <p>
          Orate is a speaking-practice tool. It hands you a random topic, gives
          you a moment to read up, records you talking about it for a minute or
          two, then returns coaching on your clarity, pacing, structure, and
          confidence.
        </p>

        <h3>How it works</h3>
        <ol>
          <li>A random Wikipedia article becomes your topic and prep material.</li>
          <li>You record yourself speaking while a live transcript runs.</li>
          <li>
            Your words-per-minute and filler words are measured in the browser.
          </li>
          <li>
            The audio is graded by Google&apos;s Gemini model for qualitative
            feedback.
          </li>
          <li>You get a report card with scores and a coach&apos;s note.</li>
        </ol>

        <h3>Privacy</h3>
        <p>
          There are no accounts. Your recording is sent for grading and then
          discarded — it isn&apos;t stored on any server. Session history (once
          added) lives only in your browser&apos;s local storage.
        </p>

        <h3>Built with</h3>
        <p className="muted">
          React + Vite, Flask, the Wikipedia REST API, and Gemini 2.5 Flash.
        </p>

        <div className="actions">
          <button onClick={onBack}>Back</button>
        </div>
      </section>
    </main>
  );
}
