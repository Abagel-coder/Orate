import grade


def test_mock_result_has_full_shape():
    r = grade._mock_result("Photosynthesis")
    for key in ("scores", "wpm", "fillerWords", "strengths", "improvements", "coaching"):
        assert key in r
    assert set(r["scores"]) == {"clarity", "pacing", "structure", "confidence"}
    assert r["_mock"] is True


def test_grade_speech_falls_back_to_mock_without_key(monkeypatch):
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    r = grade.grade_speech(b"audio", "audio/webm", "Topic", "transcript", "medium")
    assert r.get("_mock") is True


def test_difficulty_guidance_has_all_levels():
    assert set(grade.DIFFICULTY_GUIDANCE) == {"easy", "medium", "hard"}
