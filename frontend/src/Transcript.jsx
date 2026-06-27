import { FILLERS } from "./metrics";

// Regex source matching any filler as a whole word, case-insensitive. Longer
// phrases first so "you know" wins over a bare "you"/"know" split. Kept as a
// string and compiled fresh per render to avoid shared mutable regex state.
const FILLER_SOURCE = `\\b(${[...FILLERS]
  .sort((a, b) => b.length - a.length)
  .map((f) => f.replace(/ /g, "\\s+"))
  .join("|")})\\b`;

// Renders the transcript with filler words wrapped in <mark> for quick scanning.
export default function Transcript({ text }) {
  if (!text || !text.trim()) {
    return <p className="muted">No transcript captured for this session.</p>;
  }

  const fillerRe = new RegExp(FILLER_SOURCE, "gi");
  const parts = [];
  let last = 0;
  let match;
  let key = 0;
  while ((match = fillerRe.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    parts.push(
      <mark key={key++} className="filler">
        {match[0]}
      </mark>
    );
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));

  return <p className="transcript-text">{parts}</p>;
}
