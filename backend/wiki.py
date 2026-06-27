import time

import requests

# MediaWiki Action API: one request returns a batch of random articles with
# their intro extracts, so we filter locally instead of making many calls (the
# REST random/summary endpoint rate-limited quickly under bursts).
API_URL = "https://en.wikipedia.org/w/api.php"
PAGE_SUMMARY_URL = "https://en.wikipedia.org/api/rest_v1/page/summary/{title}"
HEADERS = {"User-Agent": "Orate/0.1 (speech-practice portfolio project)"}

# Skip pages too thin or too meta to speak about.
MIN_EXTRACT_CHARS = 350
SKIP_TYPES = {"disambiguation"}

# How many random candidates to pull per request, and how many requests to try.
RANDOM_BATCH = 10
RETRY_DELAY_S = 0.25


class TopicUnavailable(RuntimeError):
    """Raised when no suitable topic could be fetched right now."""


def _format(data):
    return {
        "title": data.get("title", ""),
        "summary": data.get("extract", ""),
        "url": data.get("content_urls", {}).get("desktop", {}).get("page", ""),
    }


def _fetch_random_pages(limit):
    """One Action API call → dict of random main-namespace pages with extracts."""
    params = {
        "action": "query",
        "format": "json",
        "generator": "random",
        "grnnamespace": "0",
        "grnlimit": str(limit),
        "prop": "extracts|info|pageprops",
        "exintro": "1",
        "explaintext": "1",
        "exlimit": "max",
        "inprop": "url",
        "ppprop": "disambiguation",
    }
    resp = requests.get(API_URL, params=params, headers=HEADERS, timeout=10)
    resp.raise_for_status()
    return resp.json().get("query", {}).get("pages", {})


def get_random_briefing(max_tries=3):
    """Fetch a random Wikipedia article suitable as a speaking prompt.

    Returns a dict: title, summary, url. Each try pulls a batch and keeps the
    first article that's long enough and not a disambiguation page. Transient
    errors are tolerated; raises TopicUnavailable only if nothing usable came back.
    """
    for attempt in range(max_tries):
        if attempt:
            time.sleep(RETRY_DELAY_S)
        try:
            pages = _fetch_random_pages(RANDOM_BATCH)
        except (requests.RequestException, ValueError):
            continue  # transient (429/5xx/timeout/bad JSON) — just retry

        for page in pages.values():
            if "disambiguation" in page.get("pageprops", {}):
                continue
            extract = page.get("extract", "")
            if len(extract) < MIN_EXTRACT_CHARS:
                continue
            return {
                "title": page.get("title", ""),
                "summary": extract,
                "url": page.get("fullurl", ""),
            }

    raise TopicUnavailable("Could not fetch a topic from Wikipedia right now.")


def get_briefing_for(title):
    """Fetch a specific Wikipedia article by title as a speaking prompt.

    Wikipedia resolves near-matches/redirects, so loose user input usually works.
    Raises TopicUnavailable if the page is missing or has no usable summary.
    """
    url = PAGE_SUMMARY_URL.format(title=requests.utils.quote(title.strip(), safe=""))
    try:
        resp = requests.get(url, headers=HEADERS, timeout=10)
        resp.raise_for_status()
        data = resp.json()
    except (requests.RequestException, ValueError):
        raise TopicUnavailable(f'Could not find a Wikipedia article for "{title}".')

    if data.get("type") in SKIP_TYPES or not data.get("extract"):
        raise TopicUnavailable(f'"{title}" isn\'t a good speaking topic — try another.')

    return _format(data)
