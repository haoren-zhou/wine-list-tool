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

# Create a single, reusable client to manage the connection pool.
# The connection limits bound the number of concurrent requests sent to the
# Vivino API, so large wine lists are queued instead of overwhelming it.
client = httpx.AsyncClient(
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


async def close_client() -> None:
    """Closes the shared HTTP client. Called on application shutdown."""
    await client.aclose()


# API Functions to be executed once
async def get_wine_styles() -> dict[int, str]:
    """Fetches all wine styles id -> name mappings from the Vivino API."""
    try:
        response = await client.get(VIVINO_STYLES_URL)
        response.raise_for_status()
    except httpx.HTTPError as e:
        raise VivinoError("failed to fetch wine styles") from e
    return {s["id"]: s["name"] for s in response.json()["wine_styles"]}


async def get_grapes() -> dict[int, str]:
    """Fetches all grape types id -> name mappings from the Vivino API."""
    try:
        response = await client.get(VIVINO_GRAPES_URL)
        response.raise_for_status()
    except httpx.HTTPError as e:
        raise VivinoError("failed to fetch grapes") from e
    return {g["id"]: g["name"] for g in response.json()["grapes"]}


async def get_vivino_data(wine_name: str, vintage: int | None) -> dict | None:
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
        logger.warning("Vivino request failed for '%s': %s", query, e)
        return None
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
) -> list[WineDetails]:
    """Gets Vivino data for all wines in a list concurrently.
    Removes wines that are not found in Vivino or do not have sufficient
    reviews for a rating.

    Args:
        wine_details: The wines extracted from the wine list.

    Returns:
        A new list of wines, enriched with Vivino data.
    """
    tasks = [get_vivino_data(wine.wine_name, wine.vintage) for wine in wine_details]
    results = await asyncio.gather(*tasks, return_exceptions=True)

    updated_wine_details = []
    for original_wine, vivino_data in zip(wine_details, results):
        if isinstance(vivino_data, Exception):
            logger.warning(
                "Skipping wine '%s': %s",
                original_wine.wine_name,
                vivino_data,
            )
            continue
        if vivino_data:
            # Vivino may return unexpected types for these fields
            type_id = (
                vivino_data["type_id"]
                if isinstance(vivino_data["type_id"], int)
                else -1
            )
            style_id = (
                vivino_data["style_id"]
                if isinstance(vivino_data["style_id"], int)
                else -1
            )
            grapes = (
                vivino_data["grapes"]
                if isinstance(vivino_data["grapes"], list)
                else None
            )

            new_wine_details = WineDetails(
                wine_name=original_wine.wine_name,
                vintage=(
                    original_wine.vintage
                    if original_wine.vintage is not None
                    else "N.V."
                ),
                price=original_wine.price,
                volume=original_wine.volume,
                vivino_match=vivino_data["vivino_match"],
                rating_average=vivino_data["rating_average"],
                rating_count=vivino_data["rating_count"],
                type_id=type_id,
                style_id=style_id,
                grapes=grapes,
            )
            updated_wine_details.append(new_wine_details)

    return updated_wine_details


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
