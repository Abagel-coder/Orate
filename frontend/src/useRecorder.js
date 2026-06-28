import { useCallback, useRef, useState } from "react";

// Records mic audio to a blob (returned from stop()), tracks elapsed seconds,
// and exposes a live 0–1 input level.
export function useRecorder() {
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [level, setLevel] = useState(0);

  const recorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const audioCtxRef = useRef(null);
  const rafRef = useRef(null);

  const startMeter = useCallback((stream) => {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    audioCtxRef.current = ctx;
    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 512;
    source.connect(analyser);
    const data = new Uint8Array(analyser.fftSize);

    const tick = () => {
      analyser.getByteTimeDomainData(data);
      let sum = 0;
      for (let i = 0; i < data.length; i++) {
        const v = (data[i] - 128) / 128;
        sum += v * v;
      }
      const rms = Math.sqrt(sum / data.length);
      setLevel(Math.min(1, rms * 2.5)); // speech RMS is small; scale + clamp

      rafRef.current = requestAnimationFrame(tick);
    };
    tick();
  }, []);

  const stopMeter = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    audioCtxRef.current?.close().catch(() => {});
    audioCtxRef.current = null;
    setLevel(0);
  }, []);

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
    startMeter(stream);
    setElapsed(0);
    setRecording(true);
    timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
  }, [startMeter]);

  const stop = useCallback(() => {
    return new Promise((resolve) => {
      const recorder = recorderRef.current;
      clearInterval(timerRef.current);
      stopMeter();
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
  }, [stopMeter]);

  return { recording, elapsed, level, start, stop };
}
