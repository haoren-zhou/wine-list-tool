
import os
from dotenv import load_dotenv, find_dotenv

load_dotenv(find_dotenv())

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL_ID = os.getenv("GEMINI_MODEL_ID", "gemini-1.5-flash-preview-0514")
VIVINO_API_URL = "https://9takgwjuxl-dsn.algolia.net/1/indexes/WINES_prod/query"
FRONTEND_ORIGINS = os.getenv("FRONTEND_ORIGINS", "http://localhost:5173,http://localhost:3000")
MOCK_GEMINI_RESPONSE = os.getenv("MOCK_GEMINI_RESPONSE", "false").lower() in ("true", "1", "t")

if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY must be set in the environment variables or .env file")
