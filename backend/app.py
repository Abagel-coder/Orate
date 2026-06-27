import os

from flask import Flask, jsonify, request
from flask_cors import CORS

from wiki import get_random_briefing, get_briefing_for, TopicUnavailable
from grade import grade_speech

# Cap upload size so a bad/huge file can't exhaust memory. 1-2 min of audio is a
# couple of MB; 15 MB is generous headroom.
MAX_AUDIO_BYTES = 15 * 1024 * 1024

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = MAX_AUDIO_BYTES

# Lock CORS to the deployed frontend origin(s) in prod; defaults to open for
# local dev. Set FRONTEND_ORIGIN to a comma-separated list of allowed origins.
_origins = os.environ.get("FRONTEND_ORIGIN", "*").split(",")
CORS(app, origins=[o.strip() for o in _origins if o.strip()])


@app.get("/api/topic")
def topic():
    """Pull a speaking prompt: a specific article via `?q=title`, else random."""
    query = request.args.get("q", "").strip()
    try:
        briefing = get_briefing_for(query) if query else get_random_briefing()
    except TopicUnavailable as exc:
        return jsonify({"error": str(exc)}), 503
    return jsonify(briefing)


@app.post("/api/grade")
def grade():
    """Grade a recorded speech clip against its topic.

    Expects multipart/form-data: `audio` (the recording) and `topic` (text).
    """
    audio = request.files.get("audio")
    topic_title = request.form.get("topic", "")
    transcript = request.form.get("transcript", "")
    difficulty = request.form.get("difficulty", "")

    if audio is None:
        return jsonify({"error": "no audio uploaded"}), 400

    audio_bytes = audio.read()
    if not audio_bytes:
        return jsonify({"error": "empty audio upload"}), 400

    result = grade_speech(audio_bytes, audio.mimetype, topic_title, transcript, difficulty)
    return jsonify(result)


@app.errorhandler(413)
def too_large(_err):
    return jsonify({"error": "recording too large (max 15 MB)"}), 413


if __name__ == "__main__":
    app.run(port=int(os.environ.get("PORT", 5001)), debug=True)
