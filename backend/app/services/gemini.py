from typing import BinaryIO, List, Dict
import json
from google import genai
from app.core.config import GEMINI_API_KEY, GEMINI_MODEL_ID, MOCK_GEMINI_RESPONSE
from app.core.schemas import WineDetails

# Configure the Gemini Client
client = genai.Client(api_key=GEMINI_API_KEY)

async def extract_wine_details_from_file(pdf: BinaryIO) -> List[Dict]:
    '''Extracts wine details from a PDF file using the Gemini API.
    '''
    if MOCK_GEMINI_RESPONSE:
        return json.loads('''
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
''')
    prompt = '''This is a wine list of a restaurant.
    Output a JSON of all the wines in the wine list only. Ignore all non-wine beverages, house wines or any other non-specific wine names.
    The JSON should have the following keys:

    1. "wine_name": The name of the wine. Return the full name of the wine without modification, ensuring that the name of the wine is complete, including the name of the winery if available. Do not include any additional information such as the vintage, region, or grape variety, unless it is part of the wine name.
    2. "vintage": The vintage of the wine. If the vintage is not specified, return null.
    3. "price": The price of the wine as the nearest integer.
    4. "volume": The volume of the wine in mililitres as an integer. You may have to infer the volume (bottles are generally 750ml, a glass is generally 150/125ml). If unclear, return 750.

    Do not provide any additional commentary and return only the JSON object. Ensure that every single wine is listed and no page is ignored. Do not include section headers or titles. For wines with multiple formats, return separate objects. Return a list of json objects only.
    '''
    uploaded_file = await client.aio.files.upload(
        file=pdf,  # type: ignore
        config={"mime_type": "application/pdf"}
    )
    response = await client.aio.models.generate_content(
        model=GEMINI_MODEL_ID,
        contents=[
            uploaded_file,
            "\n\n",
            prompt
        ],
        config={
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
