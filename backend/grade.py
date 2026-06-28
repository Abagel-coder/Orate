import json
import logging
import os

from google import genai
from google.genai import types

log = logging.getLogger(__name__)

# Difficulty scales how strictly Gemini grades, not which topic is shown.
DIFFICULTY_GUIDANCE = {
    "easy": "This speaker is a beginner — grade gently and lead with encouragement.",
    "medium": "Grade at a normal, balanced standard for a casual speaker.",
    "hard": "Hold a high bar — grade strictly, as you would an experienced speaker.",
}
DEFAULT_GUIDANCE = DIFFICULTY_GUIDANCE["medium"]

# WPM/fillers come from the client, so the prompt asks only for qualitative scores.
GRADING_PROMPT = """You are a speech coach. The speaker was asked to talk about
the topic "{topic}" for 1-2 minutes. Listen to the audio and grade them.

{guidance}

Return ONLY JSON matching this shape:
{{
  "scores": {{ "clarity": 0-10, "pacing": 0-10, "structure": 0-10, "confidence": 0-10 }},
  "strengths": ["..."],
  "improvements": ["..."],
  "coaching": "one short warm, specific paragraph"
}}
"""


def grade_speech(audio_bytes, mimetype, topic, transcript, difficulty=""):
    """Send the recording to Gemini and return structured feedback.

    `difficulty` (easy|medium|hard) scales how strictly the speaker is graded.
    Falls back to a mock when no API key is set so the frontend stays demoable.
    """
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return _mock_result(topic)

    log.info("grade_speech: mimetype=%s bytes=%d difficulty=%s", mimetype, len(audio_bytes), difficulty)

    guidance = DIFFICULTY_GUIDANCE.get(difficulty, DEFAULT_GUIDANCE)
    try:
        client = genai.Client(api_key=api_key)
        resp = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=[
                GRADING_PROMPT.format(topic=topic, guidance=guidance),
                types.Part.from_bytes(data=audio_bytes, mime_type=mimetype),
            ],
            config={"response_mime_type": "application/json"},
        )
        return json.loads(resp.text)
    except Exception as exc:
        # Return the failure to the client rather than raising a 500.
        log.exception("Gemini grading failed")
        return {"error": str(exc), "_failed": True}


def _mock_result(topic):
    return {
        "scores": {"clarity": 7, "pacing": 6, "structure": 8, "confidence": 7},
        "wpm": 138,
        "fillerWords": {"um": 3, "like": 5},
        "strengths": ["Clear opening", f"Stayed on topic ({topic})"],
        "improvements": ["Slow down mid-section", "Cut 'like' as filler"],
        "coaching": "Solid effort. Your structure was easy to follow — focus next "
        "on steadying your pace so key points land.",
        "_mock": True,
    }
