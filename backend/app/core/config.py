import os
import json
from dotenv import load_dotenv, find_dotenv

load_dotenv(find_dotenv())

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL_ID = os.getenv("GEMINI_MODEL_ID", "gemini-2.5-flash-lite-preview-06-17")
VIVINO_API_URL = "https://9takgwjuxl-dsn.algolia.net/1/indexes/WINES_prod/query"
FRONTEND_ORIGINS = os.getenv("FRONTEND_ORIGINS", "http://localhost:5173,http://localhost:3000")
MOCK_GEMINI_RESPONSE = os.getenv("MOCK_GEMINI_RESPONSE", "false").lower() in ("true", "1", "t")

if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY must be set in the environment variables or .env file")

LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()

def setup_logging(config_file_path: str):
    import logging.config
    import logging.handlers
    import atexit

    with open(config_file_path, 'r') as logging_config:
        config = json.load(logging_config)

    logging.config.dictConfig(config)

    queue_handler = logging.getHandlerByName("queue_handler")
    if queue_handler is not None:
        queue_handler.listener.start() # type: ignore
        atexit.register(queue_handler.listener.stop) # type: ignore