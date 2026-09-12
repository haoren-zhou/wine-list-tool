import asyncio
import logging

import httpx

from app.core.config import (
    VIVINO_ALGOLIA_API_KEY,
    VIVINO_ALGOLIA_APP_ID,
    VIVINO_API_URL,
    VIVINO_GRAPES_URL,
    VIVINO_STYLES_URL,
)
from app.core.exceptions import VivinoError
from app.core.schemas import WineDetails, WineDetailsBase

logger = logging.getLogger("backend.app")


def create_client() -> httpx.AsyncClient:
    """Create a pooled client owned and closed by the application lifespan."""
    return httpx.AsyncClient(
        follow_redirects=True,
        headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        },
        limits=httpx.Limits(max_connections=10, max_keepalive_connections=10),
        timeout=httpx.Timeout(10.0, pool=60.0),
    )


WINE_TYPES = {
    1: "Red",
    2: "White",
    3: "Sparkling",
    4: "Rosé",
    7: "Dessert",
    24: "Fortified",
}


async def get_wine_styles(client: httpx.AsyncClient) -> dict[int, str]:
    """Fetches all wine styles id -> name mappings from the Vivino API."""
    try:
        response = await client.get(VIVINO_STYLES_URL)
        response.raise_for_status()
        return _parse_mapping(response.json()["wine_styles"])
    except (httpx.HTTPError, ValueError, KeyError, TypeError) as e:
        raise VivinoError("failed to fetch wine styles") from e


async def get_grapes(client: httpx.AsyncClient) -> dict[int, str]:
    """Fetches all grape types id -> name mappings from the Vivino API."""
    try:
        response = await client.get(VIVINO_GRAPES_URL)
        response.raise_for_status()
        return _parse_mapping(response.json()["grapes"])
    except (httpx.HTTPError, ValueError, KeyError, TypeError) as e:
        raise VivinoError("failed to fetch grapes") from e


def _parse_mapping(items: list[dict]) -> dict[int, str]:
    mapping = {}
    for item in items:
        if type(item["id"]) is not int or not isinstance(item["name"], str):
            raise ValueError("Invalid Vivino mapping entry")
        mapping[item["id"]] = item["name"]
    if not mapping:
        raise ValueError("Empty Vivino mapping")
    return mapping


async def get_vivino_data(
    wine_name: str, vintage: int | None, client: httpx.AsyncClient
) -> dict | None:
    """Queries Vivino's public Algolia API for wine data.

    Returns a dict of Vivino data for the top matching vintage, or None if
    no suitable match is found. Keys:
        "vivino_match": Name of the wine as found in Vivino
        "rating_average": Average rating of the wine
        "rating_count": Number of ratings for the wine
        "type_id": Vivino type ID of the wine
        "style_id": Vivino style ID of the wine
        "grapes": List of grape IDs used in the wine
    """
    vintage_str = str(vintage) if vintage else ""
    # Appending the vintage improves the Algolia query, but the original
    # wine name is what we keep and display.
    query = f"{wine_name} {vintage_str}" if vintage else wine_name
    headers = {
        "x-algolia-api-key": VIVINO_ALGOLIA_API_KEY,
        "x-algolia-application-id": VIVINO_ALGOLIA_APP_ID,
    }

    try:
        response = await client.post(
            VIVINO_API_URL,
            json={
                "query": query,
            },
            headers=headers,
        )
        response.raise_for_status()
    except httpx.HTTPError as e:
        raise VivinoError("Vivino lookup request failed") from e
    results = response.json()
    if results["nbHits"] == 0:
        return None

    top_result = results["hits"][0]
    for vintage_details in top_result["vintages"]:
        if vintage_details["year"] == vintage_str:
            if vintage_details["statistics"]["status"] != "Normal":
                return None
            return {
                "vivino_match": vintage_details["name"],
                "rating_average": float(
                    vintage_details["statistics"]["ratings_average"]
                ),
                "rating_count": int(vintage_details["statistics"]["ratings_count"]),
                "type_id": top_result["type_id"],
                "style_id": top_result["style_id"],
                "grapes": top_result["grapes"],
            }
    return None


async def get_vivino_data_all(
    wine_details: list[WineDetailsBase],
    client: httpx.AsyncClient,
    semaphore: asyncio.Semaphore,
) -> list[WineDetails]:
    """Enrich every wine, preserving missing matches and failed lookups.

    Reuse each name/vintage lookup across formats within this upload. The
    application-wide semaphore bounds active lookups across concurrent uploads.
    """

    async def lookup(wine_name: str, vintage: int | None) -> dict | None:
        async with semaphore:
            return await get_vivino_data(wine_name, vintage, client)

    keys = list(dict.fromkeys((w.wine_name, w.vintage) for w in wine_details))
    results = await asyncio.gather(
        *(lookup(name, vintage) for name, vintage in keys), return_exceptions=True
    )
    lookups = dict(zip(keys, results))

    enriched = []
    for wine in wine_details:
        result = lookups[(wine.wine_name, wine.vintage)]
        original = wine.model_dump()
        original["vintage"] = wine.vintage if wine.vintage is not None else "N.V."
        if isinstance(result, BaseException):
            # Never convert cancellation into a successful partial response.
            if not isinstance(result, Exception):
                raise result
            logger.warning("Vivino lookup failed for '%s': %s", wine.wine_name, result)
            enriched.append(WineDetails(**original, enrichment_status="lookup_failed"))
        elif result is None:
            enriched.append(WineDetails(**original, enrichment_status="unmatched"))
        else:
            # Validate each result independently so a malformed hit cannot lose
            # this wine or abort the other wines in the upload.
            try:
                enriched.append(
                    WineDetails(
                        **original,
                        enrichment_status="matched",
                        vivino_match=result["vivino_match"],
                        rating_average=result["rating_average"],
                        rating_count=result["rating_count"],
                        type_id=result["type_id"]
                        if type(result["type_id"]) is int
                        else -1,
                        style_id=result["style_id"]
                        if type(result["style_id"]) is int
                        else -1,
                        grapes=result["grapes"]
                        if isinstance(result["grapes"], list)
                        else None,
                    )
                )
            except (ValueError, KeyError, TypeError):
                logger.warning("Invalid Vivino data for '%s'", wine.wine_name)
                enriched.append(
                    WineDetails(**original, enrichment_status="lookup_failed")
                )
    return enriched


def update_vivino_ids_to_names(
    wine_details: list[WineDetails],
    grapes_map: dict[int, str],
    styles_map: dict[int, str],
) -> list[WineDetails]:
    """Updates the Vivino IDs to names in the wine details list."""
    for wine in wine_details:
        wine.type_name = WINE_TYPES.get(wine.type_id, "Other")
        wine.style_name = styles_map.get(wine.style_id, "N.A.")
        if wine.grapes:
            wine.grapes_name = ", ".join(
                [grapes_map.get(grape_id, "N.A.") for grape_id in wine.grapes]
            )
        else:
            wine.grapes_name = "N.A."
    return wine_details
