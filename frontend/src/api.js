// Empty in dev (Vite proxies /api); set VITE_API_BASE in prod if split-hosted.
const API_BASE = import.meta.env.VITE_API_BASE || "";

export async function fetchTopic(query) {
  const qs = query ? `?q=${encodeURIComponent(query)}` : "";
  const res = await fetch(`${API_BASE}/api/topic${qs}`);
  if (!res.ok) throw new Error("failed to fetch topic");
  return res.json();
}

export async function gradeSpeech({ audioBlob, topic, transcript, difficulty }) {
  const form = new FormData();
  form.append("audio", audioBlob, "speech.webm");
  form.append("topic", topic);
  form.append("transcript", transcript);
  form.append("difficulty", difficulty || "");

  const res = await fetch(`${API_BASE}/api/grade`, { method: "POST", body: form });
  if (!res.ok) throw new Error("failed to grade speech");
  return res.json();
}
