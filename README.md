# Speech Trainer

A web app that helps people practice speaking — enunciation, pacing, structure.
It pulls a random topic from Wikipedia, gives you time to read up, records you
talking about it for 1–2 minutes, then grades the recording with the Gemini API.

## How it works

1. **Topic** — backend fetches a random Wikipedia article; its summary becomes
   the reading material and the speaking prompt.
2. **Prep** — user reads the summary on a short timer.
3. **Record** — browser records audio (`MediaRecorder`) while the Web Speech API
   produces a live transcript and client-side metrics (words per minute, filler
   words).
4. **Grade** — audio is sent to the backend, which forwards it to Gemini for
   feedback on clarity, pacing, structure, and confidence.
5. **Results** — scores + coaching notes are shown; history is kept in
   `localStorage` (no accounts).

## Stack

| Layer    | Choice                                                         |
| -------- | -------------------------------------------------------------- |
| Frontend | React (Vite), `MediaRecorder`, Web Speech API                  |
| Backend  | Flask + `flask-cors`, `requests`, `google-genai`              |
| Content  | Wikipedia (Action API `generator=random` for random; REST summary for typed topics) — no key |
| Grading  | Gemini `2.5-flash` — audio in, structured JSON out             |
| Storage  | None server-side; audio is discarded after grading             |

The backend exists mainly to **hide the Gemini API key** — the browser never
sees it. Recordings are 1–2 min, small enough to send inline (base64), so no
cloud storage or database is needed.

## Endpoints

### `GET /api/topic`

Returns a Wikipedia article to speak about. With `?q=<title>` it fetches that
specific article (REST summary); otherwise it pulls a batch of random articles
via the Action API in one request and keeps the first that's long enough and not
a disambiguation page.

```json
{
  "title": "Photosynthesis",
  "summary": "Photosynthesis is the process by which...",
  "url": "https://en.wikipedia.org/wiki/Photosynthesis"
}
```

### `POST /api/grade`

`multipart/form-data`: `audio` (the recording), `topic` (string),
`transcript` (string, from Web Speech).

```json
{
  "scores": { "clarity": 7, "pacing": 6, "structure": 8, "confidence": 7 },
  "wpm": 138,
  "fillerWords": { "um": 3, "like": 5 },
  "strengths": ["Clear opening", "Stayed on topic"],
  "improvements": ["Slow down mid-section", "Cut 'like' as filler"],
  "coaching": "One short, specific paragraph of feedback."
}
```

## Build plan

Each step is a working, demoable increment.

### Step 1 — Scaffold

- Vite React frontend + Flask backend skeleton.
- `/api/topic` and `/api/grade` stubbed (grade returns mock data).
- Frontend screen flow: start → topic → record → results.
- **Done when:** both run locally and the stubbed flow clicks through.

### Step 2 — Wikipedia topics

- Implement `/api/topic` against the Wikipedia REST API.
- Filter out stubs/disambiguation; show real summary + "read more" link.
- **Done when:** clicking start shows a real, readable topic each time.

### Step 3 — Recording + client metrics

- `MediaRecorder` to capture audio into a blob.
- Web Speech API for a live transcript shown while speaking.
- Compute WPM and filler-word counts in the browser.
- Record timer (1–2 min) with a stop button.
- **Done when:** user records, sees their live transcript, and gets a blob +
  basic metrics.

### Step 4 — Gemini grading

- Wire `google-genai` in `/api/grade`; send audio + topic with a JSON schema.
- Merge Gemini's qualitative scores with client-side WPM/filler metrics.
- **Done when:** a real recording returns real, structured feedback.

### Step 5 — Results UI

- Render scores as bars/dials, list strengths/improvements, show coaching.
- Compare pacing to an "ideal range."
- **Done when:** results screen reads like a coach's report card.

### Step 6 — Polish (optional)

- Attempt history in `localStorage` + a progress chart over time.
- Topic categories / difficulty.
- Loading and error states, mobile layout.

### Step 7 — Stats & progression (local-only)

This is where the app turns from a one-off tool into something people return to.
No accounts and no backend DB — everything lives in `localStorage`, keyed per
browser. Simpler to build and plenty for a portfolio demo.

- **Stats dashboard** — history of attempts with trends over time
  (clarity/pacing/structure/confidence, WPM, filler-word rate).
- **Progress tracking** — streaks, total sessions, personal bests, and
  improvement deltas vs. earlier attempts.
- **Difficulty levels** — easy/medium/hard scale the prep time (more for easy,
  less for hard) and how strictly Gemini grades. Topic stays random: the
  Wikipedia REST summary endpoint returns short, fairly uniform intros, so
  sorting topics by length proved an unreliable difficulty signal.
- **Goals & feedback loop** — let users set a focus (e.g. "cut filler words")
  and surface progress against it.
- **Export/import** (optional) — a JSON download/upload so stats can be backed
  up or moved between browsers, covering the "no accounts" gap cheaply.
- **Done when:** a returning user sees how they've improved over multiple
  sessions and can pick a difficulty — all without signing in.

> Note: stats are per-browser and clear if the user wipes site data. That's an
> accepted tradeoff here; real accounts + a database are intentionally out of
> scope.

## Project layout

```
speech-trainer/
  backend/
    app.py            # Flask app, the two routes
    wiki.py           # Wikipedia fetch
    grade.py          # Gemini grading (mock until keyed)
    requirements.txt
    .env.example      # GEMINI_API_KEY, PORT
  frontend/
    src/
      App.jsx         # screen-flow state machine
      api.js          # fetch helpers
      styles.css
    package.json
    vite.config.js    # proxies /api -> :5001
```

## Running locally

```bash
# backend
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
flask --app app run --port 5001

# frontend (needs Node 18+; this repo pins 20 via .nvmrc)
cd frontend
nvm use            # or: nvm install 20
npm install
npm run dev
```

Set `GEMINI_API_KEY` in `backend/.env` to enable real grading; without it,
`/api/grade` returns mock feedback so the rest of the app stays demoable.

## Deploy (single service on Render)

The included multi-stage `Dockerfile` builds the SPA with Node, then serves both the
static SPA and the API from one Flask/gunicorn process — one URL, no CORS, no
`VITE_API_BASE` needed.

1. Push to GitHub (already done for this repo).
2. Render → **New → Web Service** → connect the repo → Runtime **Docker** (the
   `Dockerfile` is auto-detected) → pick the Free instance.
3. Add env var **`GEMINI_API_KEY`** (a freshly rotated key) to enable real grading.
   Omit it for a zero-cost mock demo. `FRONTEND_ORIGIN` is unnecessary (same origin).
4. Health check path `/`; auto-deploy on push to `main`.

> Free instances idle out, so the first request after inactivity cold-starts (~30–60s).

Run the container locally to test the production build:

```bash
docker build -t orate .
docker run -p 5001:5001 -e PORT=5001 -e GEMINI_API_KEY=<key> orate
# open http://localhost:5001
```

Or without Docker: `cd frontend && npm run build`, then from `backend/`
`STATIC_DIR=../frontend/dist GEMINI_API_KEY=<key> ./.venv/bin/gunicorn app:app -b 0.0.0.0:5001`.

> Never commit `backend/.env` — it's gitignored. Configure secrets via the host's
> environment instead. (The Gemini key that was previously committed lives in git
> history; rotate it before the repo is shared or made public.)
