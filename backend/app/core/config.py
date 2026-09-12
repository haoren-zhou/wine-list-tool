import os
from pathlib import Path

from dotenv import load_dotenv, find_dotenv

load_dotenv(find_dotenv())

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL_ID = os.getenv("GEMINI_MODEL_ID", "gemini-3.5-flash-lite")
VIVINO_API_URL = "https://9takgwjuxl-dsn.algolia.net/1/indexes/WINES_prod/query"
# Public credentials from Vivino's frontend, required to query their Algolia index
VIVINO_ALGOLIA_API_KEY = "60c11b2f1068885161d95ca068d3a6ae"
VIVINO_ALGOLIA_APP_ID = "9TAKGWJUXL"
VIVINO_STYLES_URL = "https://www.vivino.com/api/wine_styles"
VIVINO_GRAPES_URL = "https://www.vivino.com/api/grapes"
VIVINO_CACHE_PATH = Path(os.getenv("VIVINO_CACHE_PATH", ".cache/vivino-mappings.json"))
FRONTEND_ORIGINS = os.getenv(
    "FRONTEND_ORIGINS", "http://localhost:5173,http://localhost:3000"
)
MOCK_GEMINI_RESPONSE = os.getenv("MOCK_GEMINI_RESPONSE", "false").lower() in (
    "true",
    "1",
    "t",
)
LOG_LEVEL = os.getenv("LOG_LEVEL", "WARNING").upper()
SORENSEN_DICE_N = int(os.getenv("SORENSEN_DICE_N", 2))
# Matches the frontend validation and nginx client_max_body_size
MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024

# Mock mode exists for local development without a real API key.
if not GEMINI_API_KEY and not MOCK_GEMINI_RESPONSE:
    raise ValueError(
        "GEMINI_API_KEY must be set in the environment variables or .env file"
    )
