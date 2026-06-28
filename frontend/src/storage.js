// Per-browser attempt history + focus goal, versioned for future migration.
const KEY = "orate.history";
const GOAL_KEY = "orate.goal";
const SCHEMA_VERSION = 1;

function empty() {
  return { schemaVersion: SCHEMA_VERSION, attempts: [] };
}

function read() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return empty();
    const data = JSON.parse(raw);
    if (!data || !Array.isArray(data.attempts)) return empty();
    return { schemaVersion: SCHEMA_VERSION, attempts: data.attempts };
  } catch {
    return empty();
  }
}

function write(data) {
  localStorage.setItem(KEY, JSON.stringify(data));
}

export function loadAttempts() {
  return read().attempts;
}

export function saveAttempt({ topic, difficulty, scores, wpm, fillerTotal }) {
  const data = read();
  const entry = {
    id: Date.now(),
    date: new Date().toISOString(),
    topic,
    difficulty: difficulty || "any",
    scores: scores || {},
    wpm: wpm || 0,
    fillerTotal: fillerTotal || 0,
  };
  data.attempts.push(entry);
  write(data);
  return entry;
}

export function clearAttempts() {
  write(empty());
}

export function loadGoal() {
  try {
    return localStorage.getItem(GOAL_KEY) || "";
  } catch {
    return "";
  }
}

export function saveGoal(id) {
  if (id) localStorage.setItem(GOAL_KEY, id);
  else localStorage.removeItem(GOAL_KEY);
}

export function exportJSON() {
  return JSON.stringify(read(), null, 2);
}

export function importJSON(json) {
  const data = JSON.parse(json);
  if (!data || !Array.isArray(data.attempts)) {
    throw new Error("That doesn't look like an Orate export.");
  }
  write({ schemaVersion: SCHEMA_VERSION, attempts: data.attempts });
  return data.attempts.length;
}
