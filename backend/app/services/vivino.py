from typing import List, Dict
import httpx
from app.core.config import VIVINO_API_URL
import asyncio

# Create a single, reusable client to manage the connection pool.
client = httpx.AsyncClient(follow_redirects=True, headers={"User-agent": "user"})

WINE_TYPES = {
    1: "Red",
    2: "White",
    3: "Sparkling",
    4: "Rosé",
    7: "Dessert",
    24: "Fortified",
}


# API Functions to be executed once
async def get_wine_styles() -> Dict[int, str]:
    """Fetches all wine styles id -> name mappings from the Vivino API."""
    response = await client.get("https://www.vivino.com/api/wine_styles")
    response.raise_for_status()
    return {s["id"]: s["name"] for s in response.json()["wine_styles"]}


async def get_grapes() -> Dict[int, str]:
    """Fetches all grape types id -> name mappings from the Vivino API."""
    response = await client.get("https://www.vivino.com/api/grapes")
    response.raise_for_status()
    return {g["id"]: g["name"] for g in response.json()["grapes"]}


async def get_vivino_data(wine_name: str, vintage: int | None) -> Dict | None:
    """Queries Vivino's public Algolia API for wine data.
    Returns JSON data for the wine if found, otherwise returns None.
        "vivino_match": Name of the wine as found in Vivino
        "rating_average": Average rating of the wine
        "rating_count": Number of ratings for the wine
        "type_id": Vivino type ID of the wine
        "style_id": Vivino style ID of the wine
        "grapes": List of grape IDs used in the wine
    """
    vintage_str = str(vintage) if vintage else ""
    wine_name_full = f"{wine_name} {vintage_str}" if vintage else wine_name
    headers = {
        "x-algolia-api-key": "60c11b2f1068885161d95ca068d3a6ae",
        "x-algolia-application-id": "9TAKGWJUXL",
    }

    try:
        response = await client.post(
            VIVINO_API_URL,
            json={
                "query": wine_name_full,
            },
            headers=headers,
        )
        response.raise_for_status()
    except httpx.HTTPStatusError as e:
        print(f"Vivino API Error: {e.response.status_code} - {e.response.text}")
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
                "wine_name": wine_name_full,
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


async def get_vivino_data_all(wine_details: List[Dict]) -> List[Dict]:
    """Gets Vivino data for all wines in a list concurrently.
    Removes wines that are not found in Vivino or do not have sufficient
    reviews for a rating.

    Args:
        wine_details: A list of wine dictionaries to be enriched.

    Returns:
        A new list of wine dictionaries, enriched with Vivino data.
    """
    tasks = [
        get_vivino_data(wine["wine_name"], wine.get("vintage")) for wine in wine_details
    ]
    results = await asyncio.gather(*tasks)

    updated_wine_details = []
    for original_wine, vivino_data in zip(wine_details, results):
        if vivino_data:
            vivino_data.update(original_wine)
            updated_wine_details.append(vivino_data)
    return updated_wine_details


def update_vivino_ids_to_names(
    wine_details: List[Dict], grapes_map: Dict[int, str], styles_map: Dict[int, str]
) -> List[Dict]:
    """Updates the Vivino IDs to names in the wine details list. Additionally, sets wine vintage to "N.V." for non-vintage wines."""
    for wine in wine_details:
        wine["type_name"] = WINE_TYPES.get(wine["type_id"], "Other")
        wine["style_name"] = styles_map.get(wine["style_id"], "N.A.")
        if wine["grapes"]:
            wine["grapes_name"] = ", ".join(
                [grapes_map.get(grape_id, "N.A.") for grape_id in wine["grapes"]]
            )
        else:
            wine["grapes_name"] = "N.A."
        wine["vintage"] = wine["vintage"] or "N.V."
    return wine_details
