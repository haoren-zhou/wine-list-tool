"""Exercise the serialized response contract consumed by the React app."""

import json
from unittest.mock import AsyncMock

import httpx
from fastapi.testclient import TestClient

from app import main
from app.core.schemas import WineDetailsBase


def test_upload_emits_all_enrichment_statuses_and_original_fields(
    monkeypatch, tmp_path
):
    wines = [
        WineDetailsBase(wine_name=name, vintage=2020, price=50, volume=750)
        for name in ("Matched", "Unknown", "Failed")
    ]

    def handler(request):
        if request.method == "GET":
            key = "grapes" if request.url.path.endswith("grapes") else "wine_styles"
            return httpx.Response(200, json={key: [{"id": 1, "name": "Fixture"}]})
        query = json.loads(request.content)["query"]
        if query.startswith("Failed"):
            return httpx.Response(503)
        if query.startswith("Unknown"):
            return httpx.Response(200, json={"nbHits": 0, "hits": []})
        return httpx.Response(
            200,
            json={
                "nbHits": 1,
                "hits": [
                    {
                        "type_id": 1,
                        "style_id": 1,
                        "grapes": [1],
                        "vintages": [
                            {
                                "year": "2020",
                                "name": "Matched 2020",
                                "statistics": {
                                    "status": "Normal",
                                    "ratings_average": 4.2,
                                    "ratings_count": 100,
                                },
                            }
                        ],
                    }
                ],
            },
        )

    monkeypatch.setattr(main, "MOCK_GEMINI_RESPONSE", True)
    monkeypatch.setattr(main, "VIVINO_CACHE_PATH", tmp_path / "cache.json")
    monkeypatch.setattr(
        main,
        "create_client",
        lambda: httpx.AsyncClient(transport=httpx.MockTransport(handler)),
    )
    monkeypatch.setattr(
        main, "extract_wine_details_from_file", AsyncMock(return_value=wines)
    )
    with TestClient(main.app) as client:
        response = client.post("/upload", files={"file": ("list.pdf", b"%PDF-fixture")})
    assert response.status_code == 200
    results = response.json()
    assert [w["enrichment_status"] for w in results] == [
        "matched",
        "unmatched",
        "lookup_failed",
    ]
    assert [w["wine_name"] for w in results] == [w.wine_name for w in wines]
    assert [w["rating_average"] for w in results] == [4.2, 0, 0]
    assert [w["vivino_match"] for w in results] == ["Matched 2020", "", ""]
    assert all(w["price"] == 50 and w["volume"] == 750 for w in results)
    assert results[0]["grapes_name"] == results[0]["style_name"] == "Fixture"
    assert results[1]["style_name"] == results[1]["grapes_name"] == "N.A."
