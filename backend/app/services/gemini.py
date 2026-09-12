import asyncio
import json
import logging
from typing import BinaryIO

from google.genai.client import AsyncClient
from google.genai import errors as genai_errors
from google.genai.types import GenerateContentConfig, ThinkingConfig, ThinkingLevel

from app.core.config import GEMINI_MODEL_ID, MOCK_GEMINI_RESPONSE
from app.core.exceptions import GeminiError
from app.core.schemas import WineDetailsBase

logger = logging.getLogger("backend.app")


async def extract_wine_details_from_file(
    pdf: BinaryIO, client: AsyncClient | None
) -> list[WineDetailsBase]:
    """Extracts wine details from a PDF file using the Gemini API."""
    if MOCK_GEMINI_RESPONSE:
        return [
            WineDetailsBase(**wine)
            for wine in json.loads("""
[
    {
        "wine_name": "Château Margaux",
        "vintage": 2015,
        "price": 1500,
        "volume": 750
    },
    {
        "wine_name": "Domaine de la Romanée-Conti, Romanée-Conti Grand Cru",
        "vintage": 2018,
        "price": 25000,
        "volume": 750
    },
    {
        "wine_name": "Screaming Eagle Cabernet Sauvignon",
        "vintage": 2016,
        "price": 3500,
        "volume": 750
    }
]
""")
        ]
    prompt = """This is a wine list of a restaurant.
    Output a JSON of all the wines in the wine list only. Ignore all non-wine beverages, house wines or any other non-specific wine names.
    The JSON should have the following keys:

    1. "wine_name": The name of the wine. Return the full name of the wine without modification, ensuring that the name of the wine is complete, including the name of the winery if available. Do not include any additional information such as the vintage, region, or grape variety, unless it is part of the wine name.
    2. "vintage": The vintage of the wine. If the vintage is not specified, return null.
    3. "price": The price of the wine as the nearest integer.
    4. "volume": The volume of the wine in mililitres as an integer. Determine the volume based on explicit indications and contextual cues.
    * **Explicit Indications:** Look for specific volume notations (e.g., "750ml", "Magnum", "Glass", "1.5L", "375ml").
        * If "Magnum" or "1.5L" is specified, the volume is 1500ml.
        * If "Half" or "Demi" or "375ml" is specified, the volume is 375ml.
        * If "Split" or "Piccolo" is specified, the volume is 187.5ml (round to 188ml).
        * If "Jeroboam" is specified, the volume is 3000ml (unless context implies still wine Bordeaux Jeroboam, then 4500ml, but default to 3000ml).
        * If "Methuselah" or "Imperial" is specified, the volume is 6000ml.
        * If "1.8L" or "Isshobin" (for sake) is specified, the volume is 1800ml.
    * **Contextual Inference:**
        * If a wine appears under a section/page header or subheading like "By the Glass," "Wines by the Glass," or similar, assume the volume is 150ml unless a different explicit volume is given for that specific wine. If an explicit volume for a glass is stated elsewhere on the list (e.g., "glasses are 125ml"), use that value instead. Note that these sections typically appear towards the beginning of the wine list.
        * If a wine is listed without an explicit volume and is NOT under a "By the Glass" section, assume it is a standard bottle size of 750ml.
        * If the item is clearly identified as **sake** and no specific volume is given, assume a standard sake bottle size of 720ml.
        * If a wine name is followed by multiple prices, it is highly probable that these correspond to different formats. In such cases, the lowest price usually corresponds to the smallest volume (e.g., glass or half bottle), and the highest price to the largest volume (e.g., bottle or magnum). You must infer the volumes for each price point based on typical wine list conventions (e.g., Glass, Bottle, Magnum).
        * **Prioritization for Inference:** Explicit volume indications always override contextual inferences. Section headers apply to all wines listed directly underneath them unless superseded by an explicit volume for an individual wine.

    Do not provide any additional commentary and return only the JSON object. Ensure that every single wine is listed and no page is ignored. Pay attention to but do not include section headers or titles. For wines with multiple formats, return separate objects. Return a list of json objects only.
    """
    if client is None:
        # Unreachable: config validation requires a key when not mocking.
        raise GeminiError("Gemini client is not configured")
    uploaded_file = None
    try:
        uploaded_file = await client.files.upload(
            file=pdf,  # type: ignore
            config={"mime_type": "application/pdf"},
        )
        response = await client.models.generate_content(
            model=GEMINI_MODEL_ID,
            contents=[uploaded_file, "\n\n", prompt],
            config=GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=list[WineDetailsBase],
                seed=42,
                thinking_config=ThinkingConfig(thinking_level=ThinkingLevel.MINIMAL),
            ),
        )
        if not isinstance(response.parsed, list):
            raise GeminiError("Gemini returned no valid extraction result")
        # A parsed empty list is a valid extraction; absent/blocked output isn't.
        return [WineDetailsBase.model_validate(wine) for wine in response.parsed]
    except genai_errors.APIError as e:
        raise GeminiError(f"Gemini API request failed: {e}") from e
    except (ValueError, TypeError) as e:
        raise GeminiError(
            "Gemini returned data that did not match the expected schema"
        ) from e
    finally:
        if uploaded_file is not None and uploaded_file.name:
            try:
                # Also attempt cleanup after cancellation, without waiting forever.
                async with asyncio.timeout(10):
                    await client.files.delete(name=uploaded_file.name)
            except Exception:
                # Cleanup must not replace the extraction result or original error.
                logger.warning("Could not delete uploaded Gemini file", exc_info=True)
