// Focus areas, each mapped to a tracked metric.
export const GOALS = {
  filler: {
    label: "Cut filler words",
    metric: "fillerTotal",
    lowerIsBetter: true,
    unit: "",
  },
  pacing: {
    label: "Steadier pacing",
    metric: "pacing",
    lowerIsBetter: false,
    unit: "/10",
  },
  clarity: {
    label: "Clearer delivery",
    metric: "clarity",
    lowerIsBetter: false,
    unit: "/10",
  },
  structure: {
    label: "Better structure",
    metric: "structure",
    lowerIsBetter: false,
    unit: "/10",
  },
  confidence: {
    label: "More confidence",
    metric: "confidence",
    lowerIsBetter: false,
    unit: "/10",
  },
};

// Reads the tracked metric from a live result or a stored attempt.
export function goalValue(goalId, source) {
  if (!source) return null;
  const metric = GOALS[goalId]?.metric;
  if (!metric) return null;
  if (metric === "fillerTotal") {
    if (typeof source.fillerTotal === "number") return source.fillerTotal;
    if (source.fillerWords) {
      return Object.values(source.fillerWords).reduce((s, n) => s + n, 0);
    }
    return null;
  }
  return source.scores?.[metric] ?? null;
}
