import { useCallback, useRef, useState } from "react";

const SpeechRecognition =
  typeof window !== "undefined" &&
  (window.SpeechRecognition || window.webkitSpeechRecognition);

// Whether this browser can do live transcription at all (Chrome/Edge yes,
// Firefox no, Safari flaky). Callers degrade gracefully when false.
export const speechSupported = !!SpeechRecognition;

// Web Speech returns raw lowercase text with no punctuation. Chrome finalizes a
// result on each pause, so we treat every final chunk as one sentence: fix "i",
// capitalize the start, and end with a period if it lacks terminal punctuation.
function tidySentence(text) {
  let s = text.trim();
  if (!s) return "";
  s = s.replace(/\bi\b/g, "I"); // also catches i'm / i've / i'll via the boundary
  s = s.charAt(0).toUpperCase() + s.slice(1);
  if (!/[.!?]$/.test(s)) s += ".";
  return s + " ";
}

// Live transcript via the Web Speech API. The API auto-stops on pauses and
// after ~60s, so we re-arm it on `onend` for as long as we're still listening,
// keeping a single continuous transcript across the whole recording.
export function useTranscript() {
  const [finalText, setFinalText] = useState("");
  const [interim, setInterim] = useState("");

  const recognitionRef = useRef(null);
  const listeningRef = useRef(false);
  const finalRef = useRef("");

  const start = useCallback(() => {
    if (!SpeechRecognition) return;

    finalRef.current = "";
    setFinalText("");
    setInterim("");
    listeningRef.current = true;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      let interimChunk = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) finalRef.current += tidySentence(result[0].transcript);
        else interimChunk += result[0].transcript;
      }
      setFinalText(finalRef.current);
      // The interim chunk starts a new sentence, so capitalize it for display.
      const shownInterim = interimChunk
        ? interimChunk.charAt(0).toUpperCase() + interimChunk.slice(1)
        : "";
      setInterim(shownInterim);
    };

    recognition.onend = () => {
      // Re-arm if the user is still recording; the API ends on its own.
      if (listeningRef.current) {
        try {
          recognition.start();
        } catch {
          // start() throws if it's already starting — safe to ignore.
        }
      }
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch {
      // Ignore double-start races.
    }
  }, []);

  const stop = useCallback(() => {
    listeningRef.current = false;
    try {
      recognitionRef.current?.stop();
    } catch {
      // Ignore.
    }
    setInterim("");
    return finalRef.current.trim();
  }, []);

  return { finalText, interim, start, stop, supported: speechSupported };
}
