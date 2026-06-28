import { useCallback, useRef, useState } from "react";

const SpeechRecognition =
  typeof window !== "undefined" &&
  (window.SpeechRecognition || window.webkitSpeechRecognition);

export const speechSupported = !!SpeechRecognition;

// Web Speech returns raw lowercase text with no punctuation. Each final chunk is
// one utterance, so capitalize it, fix "i", and add a period.
function tidySentence(text) {
  let s = text.trim();
  if (!s) return "";
  s = s.replace(/\bi\b/g, "I");
  s = s.charAt(0).toUpperCase() + s.slice(1);
  if (!/[.!?]$/.test(s)) s += ".";
  return s + " ";
}

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
      const shownInterim = interimChunk
        ? interimChunk.charAt(0).toUpperCase() + interimChunk.slice(1)
        : "";
      setInterim(shownInterim);
    };

    // The API auto-stops on pauses and after ~60s; re-arm while still listening.
    recognition.onend = () => {
      if (listeningRef.current) {
        try {
          recognition.start();
        } catch {
          // start() throws if already starting.
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
