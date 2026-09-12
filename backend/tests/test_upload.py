import json
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock

import httpx
import pytest
from fastapi.testclient import TestClient

from app import main
from app.core.exceptions import GeminiError
from app.core.schemas import WineDetailsBase


@pytest.fixture
def services(monkeypatch, tmp_path):
    requests = []
    clients = []

    def handler(request):
        requests.append(request)
        return httpx.Response(503)

    def create_client():
        client = httpx.AsyncClient(transport=httpx.MockTransport(handler))
        clients.append(client)
        return client

    extractor = AsyncMock(return_value=[])
    monkeypatch.setattr(main, "create_client", create_client)
    monkeypatch.setattr(main, "VIVINO_CACHE_PATH", tmp_path / "cache.json")
    monkeypatch.setattr(main, "MOCK_GEMINI_RESPONSE", True)
    monkeypatch.setattr(main, "extract_wine_details_from_file", extractor)
    return SimpleNamespace(requests=requests, clients=clients, extractor=extractor)


def wine(volume=750, price=50):
    return WineDetailsBase(wine_name="Wine", vintage=2020, price=price, volume=volume)


def upload(client):
    return client.post(
        "/upload", files={"file": ("wines.pdf", b"%PDF-fixture", "application/pdf")}
    )


def test_startup_and_health_survive_vivino_outage_without_cache(services):
    with TestClient(main.app) as client:
        assert client.get("/health").status_code == 200
        assert main.app.state.grapes == {}
        assert main.app.state.wine_styles == {}
    assert services.clients[0].is_closed


def test_upload_preserves_wines_on_total_lookup_failure(services):
    services.extractor.return_value = [wine()]
    with TestClient(main.app) as client:
        response = upload(client)
    assert response.status_code == 200
    [result] = response.json()
    assert result["wine_name"] == "Wine"
    assert result["enrichment_status"] == "lookup_failed"
    assert result["style_name"] == result["grapes_name"] == "N.A."
    assert result["match_coefficient"] == 0


def test_deduplicates_before_enrichment_and_reuses_lookup_across_formats(
    services, monkeypatch
):
    services.extractor.return_value = [
        wine(),
        wine(price=60),
        wine(volume=1500, price=100),
    ]
    with TestClient(main.app) as client:
        response = upload(client)
    assert response.status_code == 200
    results = response.json()
    assert [r["volume"] for r in results] == [750, 1500]
    assert [r["price"] for r in results] == [50, 100]
    lookups = [r for r in services.requests if r.method == "POST"]
    assert len(lookups) == 1
    assert json.loads(lookups[0].content)["query"] == "Wine 2020"


def test_valid_empty_extraction_is_empty_success(services):
    with TestClient(main.app) as client:
        response = upload(client)
    assert response.status_code == 200
    assert response.json() == []
    assert not any(r.method == "POST" for r in services.requests)


def test_extraction_failure_is_502_not_empty_success(services):
    services.extractor.side_effect = GeminiError("No valid extraction")
    with TestClient(main.app) as client:
        response = upload(client)
    assert response.status_code == 502
    assert "detail" in response.json()


def test_repeated_lifespans_create_fresh_clients(services):
    for _ in range(2):
        with TestClient(main.app) as client:
            assert not services.clients[-1].is_closed
            assert client.get("/health").status_code == 200
        assert services.clients[-1].is_closed
    assert len(services.clients) == 2
    assert services.clients[0] is not services.clients[1]


@pytest.mark.parametrize("startup_error", [False, True])
def test_both_gemini_transports_close_even_when_startup_fails(
    services, monkeypatch, startup_error
):
    aio = MagicMock()
    aio.__aenter__ = AsyncMock(return_value=aio)
    aio.__aexit__ = AsyncMock(return_value=False)
    sdk = MagicMock(aio=aio)
    monkeypatch.setattr(main, "MOCK_GEMINI_RESPONSE", False)
    factory = MagicMock(return_value=sdk)
    monkeypatch.setattr(main.genai, "Client", factory)
    if startup_error:
        monkeypatch.setattr(
            main, "load_mappings", AsyncMock(side_effect=RuntimeError("startup failed"))
        )
        with pytest.raises(RuntimeError, match="startup failed"):
            with TestClient(main.app):
                pass
    else:
        with TestClient(main.app):
            assert main.app.state.gemini_client is aio
    factory.assert_called_once()
    aio.__aexit__.assert_awaited_once()
    sdk.close.assert_called_once()
    assert services.clients[0].is_closed
