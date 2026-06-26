import os

from flask import Flask, jsonify, request
from flask_cors import CORS

from wiki import get_random_briefing, TopicUnavailable
from grade import grade_speech

app = Flask(__name__)
CORS(app)


@app.get("/api/topic")
def topic():
    """Pull a random Wikipedia article to use as the speaking prompt."""
    try:
        briefing = get_random_briefing()
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

    result = grade_speech(
        audio.read(), audio.mimetype, topic_title, transcript, difficulty
    )
    return jsonify(result)


if __name__ == "__main__":
    app.run(port=int(os.environ.get("PORT", 5001)), debug=True)
