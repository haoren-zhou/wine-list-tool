
from fastapi import FastAPI, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import logging
import io

from contextlib import asynccontextmanager
from app.core.config import FRONTEND_ORIGINS
from app.services.gemini import extract_wine_details_from_file
from app.services.vivino import get_vivino_data_all, update_vivino_ids_to_names, get_grapes, get_wine_styles

@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.grapes = await get_grapes()
    app.state.wine_styles = await get_wine_styles()
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

@app.post("/upload")
async def parse_pdf(file: UploadFile | None = None):
    if not file or file.filename is None:
        raise HTTPException(status_code=400, detail="No upload file sent.")
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Please upload a PDF file.")
    try:
        pdf_contents = await file.read()
        wine_details = await extract_wine_details_from_file(io.BytesIO(pdf_contents))
        logging.info(f"gemini extracted data: {wine_details}")
        wine_details = await get_vivino_data_all(wine_details)
        wine_details = update_vivino_ids_to_names(wine_details)
    except Exception as e:
        logging.error(f"Error processing PDF: {e}")
        raise HTTPException(status_code=500, detail=f"Error processing '{file.filename}': {e}")
    return {"filename": file.filename, "wine_details": wine_details}
