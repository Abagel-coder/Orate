// Pure derivations over the attempt history — no storage or UI concerns here.

export function avgScore(scores) {
  const vals = Object.values(scores || {});
  if (!vals.length) return 0;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

// Local calendar-day key (not UTC) so streaks line up with the user's clock.
function dayKey(dateish) {
  const d = new Date(dateish);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

// Consecutive days with at least one session, counting back from today (or the
// most recent day if there's nothing today yet, so it doesn't read 0 mid-day).
export function dayStreak(attempts) {
  if (!attempts.length) return 0;
  const days = new Set(attempts.map((a) => dayKey(a.date)));
  const cursor = new Date();
  if (!days.has(dayKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (days.has(dayKey(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

// Whether any attempt happened on the local calendar's today.
export function practicedToday(attempts) {
  const today = dayKey(new Date());
  return attempts.some((a) => dayKey(a.date) === today);
}

export function computeStats(attempts) {
  const sorted = [...attempts].sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  );
  const total = sorted.length;
  if (!total) {
    return { total: 0, streak: 0, bestAvg: 0, latestAvg: 0, delta: 0, avgWpm: 0, series: [] };
  }

  const avgs = sorted.map((a) => avgScore(a.scores));
  const bestAvg = Math.max(...avgs);
  const latestAvg = avgs[avgs.length - 1];
  const firstAvg = avgs[0];
  const delta = latestAvg - firstAvg;
  const avgWpm = Math.round(
    sorted.reduce((sum, a) => sum + (a.wpm || 0), 0) / total
  );

  // Chronological series for the trend chart: overall average, WPM, and each
  // individual criterion so the dashboard can plot any of them.
  const series = sorted.map((a) => ({
    date: a.date,
    avg: avgScore(a.scores),
    wpm: a.wpm || 0,
    clarity: a.scores?.clarity ?? 0,
    pacing: a.scores?.pacing ?? 0,
    structure: a.scores?.structure ?? 0,
    confidence: a.scores?.confidence ?? 0,
  }));

  return { total, streak: dayStreak(sorted), bestAvg, latestAvg, delta, avgWpm, series };
}
