import asyncio
import json

import httpx
import pytest

from app.services.vivino_cache import load_mappings


CACHED = {
    "version": 1,
    "grapes": {"1": "Cached grape"},
    "wine_styles": {"2": "Cached style"},
}


def load(path, handler):
    async def run():
        async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
            return await load_mappings(client, path)

    return asyncio.run(run())


def fresh_response(request):
    key = "grapes" if request.url.path.endswith("grapes") else "wine_styles"
    return httpx.Response(200, json={key: [{"id": 3, "name": "Fresh"}]})


def test_refresh_persists_public_mappings(tmp_path):
    path = tmp_path / "nested" / "mappings.json"
    assert load(path, fresh_response) == {
        "grapes": {3: "Fresh"},
        "wine_styles": {3: "Fresh"},
    }
    stored = json.loads(path.read_text())
    assert stored == {
        "version": 1,
        "grapes": {"3": "Fresh"},
        "wine_styles": {"3": "Fresh"},
    }
    assert list(path.parent.iterdir()) == [path]


def test_outage_uses_last_known_good_cache(tmp_path):
    path = tmp_path / "cache.json"
    path.write_text(json.dumps(CACHED))
    mappings = load(path, lambda request: httpx.Response(503))
    assert mappings == {
        "grapes": {1: "Cached grape"},
        "wine_styles": {2: "Cached style"},
    }
    assert json.loads(path.read_text()) == CACHED


def test_partial_refresh_preserves_other_cached_mapping(tmp_path):
    path = tmp_path / "cache.json"
    path.write_text(json.dumps(CACHED))

    def handler(request):
        return (
            fresh_response(request)
            if request.url.path.endswith("grapes")
            else httpx.Response(503)
        )

    mappings = load(path, handler)
    assert mappings == {"grapes": {3: "Fresh"}, "wine_styles": {2: "Cached style"}}
    assert json.loads(path.read_text())["wine_styles"] == CACHED["wine_styles"]


@pytest.mark.parametrize(
    "contents",
    [
        None,
        "broken JSON",
        "[]",
        '{"version": 99}',
        '{"version": 1, "grapes": {"bad": null}, "wine_styles": {}}',
    ],
)
def test_cold_or_corrupt_cache_is_nonfatal_during_outage(tmp_path, contents):
    path = tmp_path / "cache.json"
    if contents is not None:
        path.write_text(contents)
    assert load(path, lambda request: httpx.Response(503)) == {
        "grapes": {},
        "wine_styles": {},
    }


@pytest.mark.parametrize(
    "payload", [{}, {"grapes": []}, {"grapes": [{"id": "1", "name": 10}]}]
)
def test_malformed_upstream_preserves_cache(tmp_path, payload):
    path = tmp_path / "cache.json"
    path.write_text(json.dumps(CACHED))
    result = load(path, lambda request: httpx.Response(200, json=payload))
    assert result["grapes"] == {1: "Cached grape"}
    assert result["wine_styles"] == {2: "Cached style"}


def test_unwritable_cache_does_not_prevent_fresh_mappings(tmp_path):
    not_directory = tmp_path / "file"
    not_directory.write_text("not a directory")
    result = load(not_directory / "cache.json", fresh_response)
    assert result == {"grapes": {3: "Fresh"}, "wine_styles": {3: "Fresh"}}
