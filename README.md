# Wine List Tool

This is a web application that allows users to upload a PDF of a wine list, and it will extract the wine names, enrich the data with information from Vivino, and display it in a filterable list.

## Features

*   Upload a PDF wine list.
*   Extract wine names from the PDF using Google's Gemini API.
*   Enrich wine data with information from the Vivino API while keeping unmatched wines and failed lookups visible.
*   Calculate the Vivino match similarity with the original wine name using Sorensen-Dice coefficient.
*   Display the enriched wine list in a filterable and sortable format.
*   Containerized with Docker for easy setup and deployment.

## Tech Stack

*   **Frontend:**
    *   React
    *   TypeScript
    *   Vite
    *   Tailwind CSS
*   **Backend:**
    *   FastAPI (Python)
    *   Uvicorn
*   **APIs:**
    *   Google Gemini
    *   Vivino (unofficial)
*   **Containerization:**
    *   Docker
    *   Docker Compose

## Getting Started

### Prerequisites

*   Docker and Docker Compose
*   Node.js and `npm` (for frontend development without Docker)
*   Python 3.12+ and `uv` (for backend development without Docker)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/haoren-zhou/wine-list-tool.git
    cd wine-list-tool
    ```

2.  **Set up environment variables:**
    *   Create a `.env` file in the `backend` directory. You can copy `sample.env` as a template. Docker Compose loads this file at runtime; the image excludes it.
        *   `GEMINI_API_KEY`: Your Google Gemini API key, from [Google AI Studio](https://aistudio.google.com/apikey).
        *   `GEMINI_MODEL_ID` *(Optional)*: Specific Gemini model ID, see [Gemini API Docs](https://ai.google.dev/gemini-api/docs/models) for valid model IDs
            *   Default: `gemini-3.5-flash-lite`

3.  **Build and run with Docker Compose:**
    ```bash
    docker network create front-tier
    docker compose up --build
    ```

The application will be available at http://localhost.

## Usage

1.  Navigate to http://localhost.
2.  Click the upload area, use the keyboard-accessible file picker, or drop a `.pdf` wine list onto the upload area. Processing starts when you select or drop a valid file.
3.  Review the extracted, matched, and visible counts. The extracted count includes unique name/vintage/volume entries. Unmatched wines keep their original names; temporary lookup failures show a warning instead of removing entries.
4.  Filter or sort the list. Initial filters include all wines, including unrated entries and prices above the slider range. Use "Reset filters" to restore this view.
5.  Expand a wine for details, or choose "Upload another file" to start over.

## Docker Compose Environment Variables

### Frontend

*   `FASTAPI_SERVER_ADDR`: The address of the FastAPI backend (`backend:8000`).

### Backend

*   `FRONTEND_ORIGINS`: Comma-separated list of allowed frontend origins for CORS. Change this if deploying service externally.
*   `GEMINI_API_KEY` and `GEMINI_MODEL_ID` can also be set here, overriding the `.env` file in the `backend` directory.
*   `VIVINO_CACHE_PATH`: Optional reference-mapping cache path, default `.cache/vivino-mappings.json`. Compose persists `/app/.cache` in a named volume. Cached mappings allow startup during a Vivino outage; without a cache, unavailable grape/style names display as `N.A.`. See [backend documentation](backend/README.md) for refresh and cleanup behavior.

## Checks

```bash
(cd backend && uv run --locked pytest && uv run --locked ruff check .)
(cd frontend && npm ci && npm test && npm run lint && npm run build)
```

The tests mock Gemini and Vivino, so they do not upload documents or require API access.

## TODO

*   [x] Improve error handling in frontend (output meaningful message if error occurs)
*   [ ] Add screenshots/demo to docs
*   [ ] Test using event stream to construct wine list from API stream (use `generate_content_stream` instead of `generate_content`)
    *   [ ] Parse JSON format in backend
