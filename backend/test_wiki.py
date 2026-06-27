import pytest
import requests

import wiki


class FakeResp:
    def __init__(self, data, status=200):
        self._data = data
        self.status_code = status

    def raise_for_status(self):
        if self.status_code >= 400:
            raise requests.HTTPError(f"status {self.status_code}")

    def json(self):
        return self._data


def test_format_maps_fields():
    data = {
        "title": "T",
        "extract": "E",
        "content_urls": {"desktop": {"page": "U"}},
    }
    assert wiki._format(data) == {"title": "T", "summary": "E", "url": "U"}


def _action_response(pages):
    """Shape the Action API returns: {"query": {"pages": {id: page, ...}}}."""
    return FakeResp({"query": {"pages": pages}})


def test_random_skips_short_and_disambig_then_returns_good(monkeypatch):
    pages = {
        "1": {"title": "Short", "extract": "too short", "fullurl": "u1"},
        "2": {"title": "Disambig", "extract": "x" * 400, "fullurl": "u2",
              "pageprops": {"disambiguation": ""}},
        "3": {"title": "Good", "extract": "x" * 400, "fullurl": "u3"},
    }
    monkeypatch.setattr(wiki.requests, "get", lambda *a, **k: _action_response(pages))
    monkeypatch.setattr(wiki.time, "sleep", lambda *_: None)

    out = wiki.get_random_briefing(max_tries=2)
    assert out == {"title": "Good", "summary": "x" * 400, "url": "u3"}


def test_random_raises_when_all_attempts_fail(monkeypatch):
    def boom(*a, **k):
        raise requests.RequestException("network down")

    monkeypatch.setattr(wiki.requests, "get", boom)
    monkeypatch.setattr(wiki.time, "sleep", lambda *_: None)

    with pytest.raises(wiki.TopicUnavailable):
        wiki.get_random_briefing(max_tries=3)


def test_briefing_for_rejects_empty_extract(monkeypatch):
    data = {"title": "X", "extract": "", "type": "standard"}
    monkeypatch.setattr(wiki.requests, "get", lambda *a, **k: FakeResp(data))

    with pytest.raises(wiki.TopicUnavailable):
        wiki.get_briefing_for("X")


def test_briefing_for_returns_good_page(monkeypatch):
    data = {
        "title": "Photosynthesis",
        "extract": "x" * 500,
        "content_urls": {"desktop": {"page": "u"}},
    }
    monkeypatch.setattr(wiki.requests, "get", lambda *a, **k: FakeResp(data))

    out = wiki.get_briefing_for("Photosynthesis")
    assert out["title"] == "Photosynthesis"
