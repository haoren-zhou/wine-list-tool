from typing import BinaryIO, List, Dict
from fastapi import FastAPI, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pypdf import PdfReader
from dotenv import dotenv_values
import json
import asyncio
import os
from google import genai
from pydantic import BaseModel
import requests
from functools import lru_cache

app = FastAPI()

origins_str = os.getenv("FRONTEND_ORIGINS", "http://localhost:5173,http://localhost:3000")
origins = [o.strip() for o in origins_str.split(',')]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

config = dotenv_values(".env")
GEMINI_API_KEY = config.get("GEMINI_API_KEY")
GEMINI_MODEL_ID = config.get("GEMINI_MODEL_ID") or "gemini-2.5-flash-lite-preview-06-17"
if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY must be set in the environment variables or .env file")
# Configure the Gemini Client
client = genai.Client(api_key=GEMINI_API_KEY)

VIVINO_API = "https://9takgwjuxl-dsn.algolia.net/1/indexes/WINES_prod/query"
# Get IDs for wine types, styles, and grapes from Vivino API
# These are cached to avoid repeated API calls
WINE_TYPES = {1: "Red", 2: "White", 3: "Sparkling", 4: "Rosé", 7: "Dessert", 24: "Fortified"}
WINE_STYLES = {s["id"]: s["name"] for s in requests.get("http://vivino.com/api/wine_styles", headers = {"User-agent": "user"}).json()["wine_styles"]}
GRAPES = {g["id"]: g["name"] for g in requests.get("http://vivino.com/api/grapes", headers = {"User-agent": "user"}).json()["grapes"]}


class WineDetails(BaseModel):
    wine_name: str
    vintage: int | None
    price: int
    volume: int

async def extract_wine_details_from_file(pdf: BinaryIO) -> List[Dict]:
    '''Extracts wine details from a PDF file using the Gemini API.
    '''
    prompt = '''This is a wine list of a restaurant.
    Output a JSON of all the wines in the wine list only. Ignore all non-wine beverages, house wines or any other non-specific wine names.
    The JSON should have the following keys:

    1. "wine_name": The name of the wine. Return the full name of the wine without modification, ensuring that the name of the wine is complete, including the name of the winery if available. Do not include any additional information such as the vintage, region, or grape variety, unless it is part of the wine name.
    2. "vintage": The vintage of the wine. If the vintage is not specified, return null.
    3. "price": The price of the wine as the nearest integer.
    4. "volume": The volume of the wine in mililitres as an integer. You may have to infer the volume (bottles are generally 750ml, a glass is generally 150/125ml). If unclear, return 750.

    Do not provide any additional commentary and return only the JSON object. Ensure that every single wine is listed and no page is ignored. Do not include section headers or titles. For wines with multiple formats, return separate objects. Return a list of json objects only.
    '''
    import io
    uploaded_file = await client.aio.files.upload(
        file = pdf, # type: ignore
        config = { "mime_type": "application/pdf" }
    )
    response = await client.aio.models.generate_content(
        model = GEMINI_MODEL_ID,
        contents = [
            uploaded_file,
            "\n\n",
            prompt
        ],
        config = {
            "response_mime_type": "application/json",
            "response_schema": list[WineDetails],
            "thinking_config": {
                "thinking_budget": 0
            }
        }
    )
    if response.text is None:
        return []
    return json.loads(response.text)

@lru_cache(maxsize = 256)
def get_vivino_data(wine_name: str, vintage: int | None) -> Dict | None:
    '''Queries Vivino's public Algolia API for wine data.
    Returns JSON data for the wine if found, otherwise returns None.
        "vivino_match": Name of the wine as found in Vivino
        "rating_average": Average rating of the wine
        "rating_count": Number of ratings for the wine
        "type_id": Vivino type ID of the wine
        "style_id": Vivino style ID of the wine
        "grapes": List of grape IDs used in the wine
    '''
    vintage_str = str(vintage) if vintage else ""
    wine_name_full = f"{wine_name} {vintage_str}" if vintage else wine_name
    headers = {
        "User-Agent": "user",
        "x-algolia-api-key": "60c11b2f1068885161d95ca068d3a6ae",
        "x-algolia-application-id": "9TAKGWJUXL",
    }
    response = requests.post(
        VIVINO_API,
        json = {
            "query": wine_name_full,
        },
        headers = headers
    )
    if response.status_code != 200:
        print(f"Vivino API Error: {response.status_code} - {response.text}")
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
                "rating_average": float(vintage_details["statistics"]["ratings_average"]),
                "rating_count": int(vintage_details["statistics"]["ratings_count"]),
                "type_id": top_result["type_id"],
                "style_id": top_result["style_id"],
                "grapes": top_result["grapes"]
            }
    return None

async def get_vivino_data_all(wine_details: List[Dict]) -> List[Dict]:
    '''Gets Vivino data for all wines in the list. Removes wines that are not found in Vivino or do not have sufficient reviews for a rating.
    '''
    updated_wine_details = []
    for wine in wine_details:
        vivino_data = await asyncio.to_thread(get_vivino_data, wine["wine_name"], wine["vintage"])
        if vivino_data:
            vivino_data.update(wine)
            updated_wine_details.append(vivino_data)
    return updated_wine_details

def update_vivino_ids_to_names(wine_details: List[Dict]) -> List[Dict]:
    '''Updates the Vivino IDs to names in the wine details list. Additionally, sets wine vintage to "N.V." for non-vintage wines.
    '''
    for wine in wine_details:
        wine["type_name"] = WINE_TYPES.get(wine["type_id"], "Other")
        wine["style_name"] = WINE_STYLES.get(wine["style_id"], "N.A.")
        if wine["grapes"]:
            wine["grapes_name"] = ", ".join([GRAPES.get(grape_id, "N.A.") for grape_id in wine["grapes"]])
        else:
            wine["grapes_name"] = "N.A."
        wine["vintage"] = wine["vintage"] or "N.V."
    return wine_details

@app.post("/upload")
async def parse_pdf(file: UploadFile | None = None):
    if not file or file.filename == None:
        return {"message": "No upload file sent."}
    if not file.filename.lower().endswith(".pdf"):
         return {"message": "Please upload a PDF file."}
    try:
        # wine_details = await extract_pdf_text(file.file)
        # import time
        # time.sleep(4)
        import logging
        wine_details = await extract_wine_details_from_file(file.file)
        logging.info(f"gemini extracted data: {wine_details}")
        wine_details = await get_vivino_data_all(wine_details)
        wine_details = update_vivino_ids_to_names(wine_details)
    except Exception as e:
        print(f"Error processing PDF: {e}")
        raise HTTPException(status_code=500, detail=f"Error processing '{file.filename}': {e}")
    return {"filename": file.filename, "wine_details": wine_details}

# Not in use
def extract_pdf_text_sync(pdf: BinaryIO) -> str:
    '''Extracts text from a PDF file using PyPdf2.
    '''
    reader = PdfReader(pdf)
    text = "\n(End of Page)\n".join(page.extract_text().strip() or "" for page in reader.pages)
    text += "(End of Document)"
    # Clean up weird apostrophes
    replacements = [
        ("’", "'"),
        ("‘", "'"),
        ("“", '"'),
        ("”", '"'),
        ("''", '"')
    ]
    for old, new in replacements:
        text = text.replace(old, new)
    return text
# Not in use
async def extract_pdf_text(pdf: BinaryIO) -> str:
    '''Use asyncio to run extract_pdf_text_sync in a thread pool
    '''
    return await asyncio.to_thread(extract_pdf_text_sync, pdf)