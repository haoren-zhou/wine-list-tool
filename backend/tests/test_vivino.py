import asyncio
from unittest.mock import AsyncMock

import httpx
import pytest

from app.core.schemas import WineDetailsBase
from app.services import vivino


def wine(name="Wine", vintage=2020, volume=750, price=50):
    return WineDetailsBase(wine_name=name, vintage=vintage, volume=volume, price=price)


def hit(**overrides):
    return {
        "nbHits": 1,
        "hits": [
            {
                "type_id": 1,
                "style_id": 2,
                "grapes": [3],
                "vintages": [
                    {
                        "year": "2020",
                        "name": "Wine 2020",
                        "statistics": {
                            "status": "Normal",
                            "ratings_average": 4.2,
                            "ratings_count": 50,
                        },
                    }
                ],
                **overrides,
            }
        ],
    }


def enrich(wines, handler):
    async def run():
        async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
            return await vivino.get_vivino_data_all(
                wines, client, asyncio.Semaphore(10)
            )

    return asyncio.run(run())


def test_preserves_mixed_results_in_original_order():
    responses = iter(
        [
            httpx.Response(200, json=hit()),
            httpx.Response(200, json={"nbHits": 0, "hits": []}),
            httpx.Response(503),
        ]
    )
    originals = [wine("Matched"), wine("Unknown", vintage=None), wine("Failed")]
    results = enrich(originals, lambda request: next(responses))
    assert [w.enrichment_status for w in results] == [
        "matched",
        "unmatched",
        "lookup_failed",
    ]
    assert [w.wine_name for w in results] == [w.wine_name for w in originals]
    assert results[0].rating_average == 4.2
    assert results[1].vintage == "N.V."
    assert all(w.price == 50 and w.volume == 750 for w in results)
    assert results[2].vivino_match == ""


@pytest.mark.parametrize(
    "response",
    [
        httpx.Response(429),
        httpx.Response(503),
        httpx.Response(200, text="not JSON"),
        httpx.Response(200, json={"nbHits": 1, "hits": []}),
        httpx.Response(200, json=hit(grapes=[{}])),
    ],
)
def test_failed_or_malformed_response_does_not_remove_wine(response):
    [result] = enrich([wine()], lambda request: response)
    assert result.enrichment_status == "lookup_failed"
    assert result.wine_name == "Wine"


def test_transport_error_does_not_remove_wine():
    def handler(request):
        raise httpx.ConnectError("offline", request=request)

    [result] = enrich([wine()], handler)
    assert result.enrichment_status == "lookup_failed"


@pytest.mark.parametrize(
    "vintages",
    [
        [],
        [
            {
                "year": "2020",
                "statistics": {"status": "NotEnoughRatings"},
            }
        ],
    ],
)
def test_no_rated_vintage_is_unmatched_not_failed(vintages):
    [result] = enrich(
        [wine()], lambda request: httpx.Response(200, json=hit(vintages=vintages))
    )
    assert result.enrichment_status == "unmatched"


def test_reuses_lookup_across_formats_but_not_vintages():
    calls = []

    def handler(request):
        calls.append(request)
        return httpx.Response(200, json=hit())

    results = enrich(
        [wine(), wine(volume=1500, price=100), wine(vintage=2021)], handler
    )
    assert len(calls) == 2
    assert len(results) == 3
    assert [w.volume for w in results] == [750, 1500, 750]
    assert [w.price for w in results] == [50, 100, 50]


def test_failed_lookup_is_reused_across_formats():
    calls = []

    def handler(request):
        calls.append(request)
        return httpx.Response(503)

    results = enrich([wine(), wine(volume=1500)], handler)
    assert len(calls) == 1
    assert [w.enrichment_status for w in results] == ["lookup_failed", "lookup_failed"]


def test_shared_semaphore_limits_concurrent_uploads(monkeypatch):
    active = maximum = 0

    async def lookup(*args):
        nonlocal active, maximum
        active += 1
        maximum = max(active, maximum)
        await asyncio.sleep(0)
        active -= 1
        return None

    monkeypatch.setattr(vivino, "get_vivino_data", lookup)

    async def run():
        semaphore = asyncio.Semaphore(2)
        async with httpx.AsyncClient() as client:
            results = await asyncio.gather(
                *(
                    vivino.get_vivino_data_all(
                        [wine(str(i)) for i in range(5)], client, semaphore
                    )
                    for _ in range(2)
                )
            )
        assert [len(r) for r in results] == [5, 5]

    asyncio.run(run())
    assert maximum == 2


def test_cancellation_is_not_swallowed(monkeypatch):
    monkeypatch.setattr(
        vivino, "get_vivino_data", AsyncMock(side_effect=asyncio.CancelledError)
    )
    with pytest.raises(asyncio.CancelledError):
        enrich([wine()], lambda request: httpx.Response(200, json=hit()))


def test_empty_input_makes_no_requests():
    def handler(request):
        pytest.fail("Empty wine list must not call Vivino")

    assert enrich([], handler) == []
