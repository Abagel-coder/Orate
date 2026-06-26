// Client-side speech metrics. We own WPM + filler counts here; Gemini only
// produces the qualitative scores, so these never round-trip through the model.

// Single words and short phrases people lean on when they stall.
const FILLERS = [
  "um",
  "uh",
  "er",
  "ah",
  "hmm",
  "like",
  "so",
  "actually",
  "basically",
  "literally",
  "right",
  "okay",
  "you know",
  "i mean",
  "kind of",
  "sort of",
];

function countWords(text) {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

// Count filler occurrences. Multi-word phrases are matched first so "you know"
// isn't also tallied as a bare "so"-style single word.
function countFillers(text) {
  const counts = {};
  let haystack = ` ${text.toLowerCase()} `;
  // Longer phrases first to avoid double-counting their component words.
  const ordered = [...FILLERS].sort((a, b) => b.length - a.length);
  for (const filler of ordered) {
    const re = new RegExp(`\\b${filler.replace(/ /g, "\\s+")}\\b`, "g");
    const matches = haystack.match(re);
    if (matches && matches.length) {
      counts[filler] = matches.length;
      // Blank out matches so shorter fillers don't re-count the same words.
      haystack = haystack.replace(re, " ".repeat(filler.length));
    }
  }
  return counts;
}

export function computeMetrics(transcript, elapsedSeconds) {
  const wordCount = countWords(transcript);
  const minutes = elapsedSeconds > 0 ? elapsedSeconds / 60 : 0;
  const wpm = minutes > 0 ? Math.round(wordCount / minutes) : 0;
  return { wpm, wordCount, fillerWords: countFillers(transcript) };
}
