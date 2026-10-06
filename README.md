# Orate - A Speech Trainer

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
`/api/grade` returns mock feedback. 