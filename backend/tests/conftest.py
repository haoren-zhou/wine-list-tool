import os

# mock mode avoids requiring a real GEMINI_API_KEY at import time.
os.environ["MOCK_GEMINI_RESPONSE"] = "true"
