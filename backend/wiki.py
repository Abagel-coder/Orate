import time

import requests

SUMMARY_URL = "https://en.wikipedia.org/api/rest_v1/page/random/summary"
HEADERS = {"User-Agent": "SpeechTrainer/0.1 (portfolio project)"}

# Skip pages too thin or too meta to speak about.
MIN_EXTRACT_CHARS = 350
SKIP_TYPES = {"disambiguation"}

# Small pause between retries to stay polite and avoid tripping rate limits.
RETRY_DELAY_S = 0.25


class TopicUnavailable(RuntimeError):
    """Raised when no suitable topic could be fetched right now."""


def _format(data):
    return {
        "title": data.get("title", ""),
        "summary": data.get("extract", ""),
        "url": data.get("content_urls", {}).get("desktop", {}).get("page", ""),
    }


def get_random_briefing(max_tries=8):
    """Fetch a random Wikipedia article suitable as a speaking prompt.

    Returns a dict: title, summary, url. Retries past stubs/disambiguations.
    Transient network/HTTP errors are tolerated; raises TopicUnavailable only if
    nothing usable came back across all tries.
    """
    for attempt in range(max_tries):
        if attempt:
            time.sleep(RETRY_DELAY_S)
        try:
            resp = requests.get(SUMMARY_URL, headers=HEADERS, timeout=10)
            resp.raise_for_status()
            data = resp.json()
        except (requests.RequestException, ValueError):
            continue  # transient (429/5xx/timeout/bad JSON) — just retry

        if data.get("type") in SKIP_TYPES:
            continue
        if len(data.get("extract", "")) < MIN_EXTRACT_CHARS:
            continue

        return _format(data)

    raise TopicUnavailable("Could not fetch a topic from Wikipedia right now.")
