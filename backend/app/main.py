
from fastapi import FastAPI, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import logging
import io
logging.basicConfig(level=logging.INFO)

from contextlib import asynccontextmanager
from app.core.config import FRONTEND_ORIGINS
from app.services.gemini import extract_wine_details_from_file
from app.services.vivino import get_vivino_data_all, update_vivino_ids_to_names, get_grapes, get_wine_styles

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Asynchronous context manager for FastAPI.

    This context manager is used to load static data for grapes and
    wine styles.

    Args:
        app: FastAPI application instance.
    """
    app.state.grapes = await get_grapes()
    app.state.wine_styles = await get_wine_styles()
    logging.info(app.state.grapes)
    logging.info(app.state.wine_styles)
    yield

app = FastAPI(lifespan=lifespan)

origins = [o.strip() for o in FRONTEND_ORIGINS.split(',')]

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

def deduplicate_wine_list(wine_details: list[dict]) -> list[dict]:
    """Deduplicates a list of wine details based on a composite key.

    This function iterates through a list of wine dictionaries and removes
    duplicates based on the combined values of 'wine_name', 'vintage', and
    'volume'.

    Args:
        wine_details: A list of dictionaries, where each dictionary
                      represents a wine.

    Returns:
        A new list of dictionaries with duplicate wines removed.
    """
    seen = set()
    deduplicated_list = []
    for wine in wine_details:
        # Use a composite key to identify unique wines
        key = (wine.get("wine_name"), wine.get("vintage"), wine.get("volume"))
        if key not in seen:
            seen.add(key)
            deduplicated_list.append(wine)
    return deduplicated_list

@app.post("/upload")
async def parse_pdf(file: UploadFile | None = None) -> dict[str, str | list]:
    """Parses an uploaded PDF file to extract, enrich, and return wine details.

    This endpoint accepts a PDF file, extracts wine names using the Gemini API,
    enriches the data with information from the Vivino API, deduplicates the
    results, and returns a final list of wine details.

    Args:
        file: An uploaded file object, expected to be a PDF.

    Raises:
        HTTPException:
            - 400: If no file is sent or if the file is not a PDF.
            - 500: If any error occurs during the PDF processing, data
              extraction, or API enrichment steps.

    Returns:
        A dictionary containing the filename and a list of dictionaries,
        where each dictionary represents a unique wine and its information.
    """
    if not file or file.filename is None:
        raise HTTPException(status_code=400, detail="No upload file sent.")
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Please upload a PDF file.")
    try:
        pdf_contents = await file.read()
        wine_details = await extract_wine_details_from_file(io.BytesIO(pdf_contents))
        logging.info(f"gemini extracted data: {wine_details}")
        wine_details = await get_vivino_data_all(wine_details)
        wine_details = deduplicate_wine_list(wine_details)
        wine_details = update_vivino_ids_to_names(
            wine_details=wine_details,
            grapes_map=app.state.grapes,
            styles_map=app.state.wine_styles
        )
    except Exception as e:
        logging.error(f"Error processing PDF: {e}")
        raise HTTPException(status_code=500, detail=f"Error processing '{file.filename}': {e}")
    return {"filename": file.filename, "wine_details": wine_details}
