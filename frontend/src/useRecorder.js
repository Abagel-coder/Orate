import { useCallback, useRef, useState } from "react";

// Captures microphone audio into a single blob and tracks elapsed seconds.
// Returns the recorded blob from stop() so callers can await it.
export function useRecorder() {
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  const recorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  const start = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    streamRef.current = stream;

    const recorder = new MediaRecorder(stream);
    chunksRef.current = [];
    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size) chunksRef.current.push(e.data);
    };
    recorderRef.current = recorder;

    recorder.start();
    setElapsed(0);
    setRecording(true);
    timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
  }, []);

  const stop = useCallback(() => {
    return new Promise((resolve) => {
      const recorder = recorderRef.current;
      clearInterval(timerRef.current);
      setRecording(false);

      if (!recorder || recorder.state === "inactive") {
        resolve(new Blob(chunksRef.current, { type: "audio/webm" }));
        return;
      }

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType });
        streamRef.current?.getTracks().forEach((t) => t.stop());
        resolve(blob);
      };
      recorder.stop();
    });
  }, []);

  return { recording, elapsed, start, stop };
}
