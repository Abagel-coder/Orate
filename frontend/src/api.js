// Thin client for the Flask backend. Vite proxies /api -> :5001 in dev.

export async function fetchTopic() {
  const res = await fetch("/api/topic");
  if (!res.ok) throw new Error("failed to fetch topic");
  return res.json();
}

export async function gradeSpeech({ audioBlob, topic, transcript, difficulty }) {
  const form = new FormData();
  form.append("audio", audioBlob, "speech.webm");
  form.append("topic", topic);
  form.append("transcript", transcript);
  form.append("difficulty", difficulty || "");

  const res = await fetch("/api/grade", { method: "POST", body: form });
  if (!res.ok) throw new Error("failed to grade speech");
  return res.json();
}
