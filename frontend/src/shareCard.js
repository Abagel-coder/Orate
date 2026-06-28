// Draws a branded square PNG summary of a session on a canvas (no deps), then
// shares it via the Web Share API or falls back to a download.

const W = 1080;
const H = 1080;
const PAD = 90;
const SCORE_KEYS = ["clarity", "pacing", "structure", "confidence"];

const CREAM = "#f8f1e4";
const FILL = "#f0d9b8";

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function avg(scores) {
  const vals = SCORE_KEYS.map((k) => scores[k]).filter((v) => typeof v === "number");
  if (!vals.length) return 0;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

function wrapLines(ctx, text, maxWidth) {
  const words = text.split(/\s+/);
  const lines = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export function buildShareCanvas({ topic = "", scores = {}, wpm = 0, fillerTotal = 0 }) {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");

  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#9c7440");
  bg.addColorStop(1, "#3f2814");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";

  ctx.fillStyle = CREAM;
  ctx.font = "800 76px system-ui, sans-serif";
  ctx.fillText("Orate", PAD, 150);
  ctx.fillStyle = "rgba(248,241,228,0.75)";
  ctx.font = "500 30px system-ui, sans-serif";
  ctx.fillText("SPEAKING SESSION", PAD, 196);

  ctx.fillStyle = CREAM;
  ctx.font = "600 46px system-ui, sans-serif";
  const topicLines = wrapLines(ctx, topic || "Untitled topic", W - PAD * 2).slice(0, 2);
  let ty = 290;
  for (const line of topicLines) {
    ctx.fillText(line, PAD, ty);
    ty += 58;
  }

  const overall = avg(scores);
  ctx.fillStyle = CREAM;
  ctx.font = "800 150px system-ui, sans-serif";
  ctx.fillText(overall.toFixed(1), PAD, 510);
  ctx.font = "500 40px system-ui, sans-serif";
  ctx.fillStyle = "rgba(248,241,228,0.8)";
  ctx.fillText("/ 10 overall", PAD + 250, 510);

  let by = 590;
  const labelW = 300;
  const barX = PAD + labelW;
  const barW = W - PAD - barX - 130;
  for (const key of SCORE_KEYS) {
    const value = typeof scores[key] === "number" ? scores[key] : 0;
    ctx.fillStyle = CREAM;
    ctx.font = "600 38px system-ui, sans-serif";
    ctx.fillText(key.charAt(0).toUpperCase() + key.slice(1), PAD, by + 30);

    ctx.fillStyle = "rgba(255,255,255,0.18)";
    roundRect(ctx, barX, by, barW, 30, 15);
    ctx.fill();
    ctx.fillStyle = FILL;
    roundRect(ctx, barX, by, Math.max(barW * (value / 10), 4), 30, 15);
    ctx.fill();

    ctx.fillStyle = CREAM;
    ctx.font = "700 34px system-ui, sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(`${value}/10`, W - PAD, by + 30);
    ctx.textAlign = "left";
    by += 80;
  }

  const chipY = by + 30;
  ctx.font = "600 36px system-ui, sans-serif";
  ctx.fillStyle = CREAM;
  ctx.fillText(`${wpm} WPM`, PAD, chipY + 38);
  ctx.fillText(
    `${fillerTotal} filler${fillerTotal === 1 ? "" : "s"}`,
    PAD + 360,
    chipY + 38
  );

  ctx.fillStyle = "rgba(248,241,228,0.7)";
  ctx.font = "500 32px system-ui, sans-serif";
  ctx.fillText("Practice speaking with Orate", PAD, H - 70);

  return canvas;
}

function canvasToBlob(canvas) {
  return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
}

// Returns "shared" | "downloaded" | "cancelled".
export async function shareCard(data) {
  const canvas = buildShareCanvas(data);
  const blob = await canvasToBlob(canvas);
  if (!blob) return "cancelled";

  const file = new File([blob], "orate-session.png", { type: "image/png" });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: "My Orate session" });
      return "shared";
    } catch {
      return "cancelled";
    }
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "orate-session.png";
  a.click();
  URL.revokeObjectURL(url);
  return "downloaded";
}
