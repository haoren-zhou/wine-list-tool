from fastapi import FastAPI, UploadFile, HTTPException, Request
from google import genai
import asyncio
from fastapi.middleware.cors import CORSMiddleware
import logging
import os
import io

from contextlib import AsyncExitStack, asynccontextmanager
from typing import TypeVar
from app.core.config import (
    FRONTEND_ORIGINS,
    MAX_UPLOAD_SIZE_BYTES,
    SORENSEN_DICE_N,
    GEMINI_API_KEY,
    MOCK_GEMINI_RESPONSE,
    VIVINO_CACHE_PATH,
)
from app.core.logging import setup_logging
from app.core.exceptions import UpstreamServiceError
from app.services.gemini import extract_wine_details_from_file
from app.services.vivino import (
    create_client,
    get_vivino_data_all,
    update_vivino_ids_to_names,
)
from app.services.vivino_cache import load_mappings
from app.services.similarity import update_wine_similarity
from app.core.schemas import WineDetails, WineDetailsBase

current_dir = os.path.dirname(os.path.abspath(__file__))
backend_root = os.path.dirname(current_dir)
LOGGING_CONFIG_PATH = os.path.join(backend_root, "config", "logging_config.json")

setup_logging(LOGGING_CONFIG_PATH)
logger = logging.getLogger("backend.app")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Own service clients and refresh reference data with cached fallbacks."""
    async with AsyncExitStack() as stack:
        app.state.vivino_client = await stack.enter_async_context(create_client())
        app.state.vivino_semaphore = asyncio.Semaphore(10)
        app.state.gemini_client = None
        if not MOCK_GEMINI_RESPONSE:
            gemini = genai.Client(api_key=GEMINI_API_KEY)
            # The SDK maintains separate synchronous and asynchronous transports.
            stack.callback(gemini.close)
            app.state.gemini_client = await stack.enter_async_context(gemini.aio)
        mappings = await load_mappings(app.state.vivino_client, VIVINO_CACHE_PATH)
        app.state.grapes = mappings["grapes"]
        app.state.wine_styles = mappings["wine_styles"]
        logger.info("Loaded grape ID mapping, size: %d", len(app.state.grapes))
        logger.info(
            "Loaded wine style ID mapping, size: %d", len(app.state.wine_styles)
        )
        yield


app = FastAPI(lifespan=lifespan)

origins = [o.strip() for o in FRONTEND_ORIGINS.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, str]:
    """Health check endpoint."""
    return {"message": "health ok"}


Wine = TypeVar("Wine", bound=WineDetailsBase)


def deduplicate_wine_list(wine_details: list[Wine]) -> list[Wine]:
    """Deduplicates a list of wines based on a composite key.

    Removes duplicates based on the combined values of 'wine_name',
    'vintage', and 'volume', keeping the first occurrence.

    Args:
        wine_details: The list of wines to deduplicate.

    Returns:
        A new list with duplicate wines removed.
    """
    seen = set()
    deduplicated_list = []
    for wine in wine_details:
        # Use a composite key to identify unique wines
        key = (wine.wine_name, wine.vintage, wine.volume)
        if key not in seen:
            seen.add(key)
            deduplicated_list.append(wine)
    return deduplicated_list


@app.post("/upload", response_model=list[WineDetails])
async def parse_pdf(
    request: Request, file: UploadFile | None = None
) -> list[WineDetails]:
    """Parses an uploaded PDF file to extract, enrich, and return wine details.

    This endpoint accepts a PDF file, extracts wine names using the Gemini API,
    deduplicates extracted wines, and enriches them with Vivino data. Wines
    without a match or with a failed lookup remain in the returned list.

    Args:
        file: An uploaded file object, expected to be a PDF.

    Raises:
        HTTPException:
            - 400: If no file is sent or if the file is not a PDF.
            - 413: If the file exceeds the upload size limit.
            - 502: If Gemini fails to extract a valid wine list.
            - 500: If any unexpected error occurs during processing.

    Returns:
        A list of wine details for each unique wine found in the PDF.
    """
    if not file or file.filename is None:
        raise HTTPException(status_code=400, detail="No upload file sent.")
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Please upload a PDF file.")

    pdf_contents = await file.read()
    if len(pdf_contents) > MAX_UPLOAD_SIZE_BYTES:
        raise HTTPException(status_code=413, detail="File exceeds the 10MB size limit.")

    try:
        logger.info("Processing file: %s", file.filename)
        extracted = await extract_wine_details_from_file(
            io.BytesIO(pdf_contents), request.app.state.gemini_client
        )
        logger.debug("Gemini extracted data: %s", extracted)
        wine_details = await get_vivino_data_all(
            deduplicate_wine_list(extracted),
            request.app.state.vivino_client,
            request.app.state.vivino_semaphore,
        )
        wine_details = update_vivino_ids_to_names(
            wine_details=wine_details,
            grapes_map=request.app.state.grapes,
            styles_map=request.app.state.wine_styles,
        )
        wine_details = update_wine_similarity(wine_details, n=SORENSEN_DICE_N)

    except UpstreamServiceError as e:
        logger.exception(
            "Upstream service error while processing %s: %s", file.filename, e
        )
        raise HTTPException(
            status_code=502,
            detail=f"Upstream service error while processing '{file.filename}'.",
        )
    except Exception:
        logger.exception("Unexpected error processing %s", file.filename)
        raise HTTPException(
            status_code=500, detail=f"Error processing '{file.filename}'."
        )

    logger.info("Processed %d wines from %s", len(wine_details), file.filename)
    logger.debug("Wine details: %s", wine_details)

    return wine_details
