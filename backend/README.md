## Backend

This directory contains the FastAPI application.

### Structure

*   `app/main.py`: The main FastAPI application file, defining endpoints.
*   `app/core`: Configuration, schemas, logging, and exception types.
*   `app/services`: Logic for interacting with external APIs (Gemini, Vivino) and computing wine name similarity.
*   `tests`: Offline Pytest tests for extraction, enrichment, upload responses, caching, client lifecycle, and pure logic. Run with `uv run --locked pytest`.

### API Endpoints

*   `GET /health`: Health check endpoint.
*   `POST /upload`: Upload a PDF file for processing. Returns a list of wines with `enrichment_status`:
    *   `matched`: Vivino returned a rated vintage.
    *   `unmatched`: No suitable rated vintage was found.
    *   `lookup_failed`: The lookup failed, including HTTP errors or malformed upstream data.

The response preserves original names, prices, vintages, and formats when enrichment is unavailable. Unmatched/failed wines have empty Vivino names and zero rating fields; clients must use `enrichment_status` rather than displaying these zeroes as ratings. A valid empty extraction returns `[]`; absent or invalid Gemini output returns HTTP 502.

## Service lifecycle and caching

The application owns the Vivino and Gemini clients for its lifespan and closes them on shutdown or startup failure. After each extraction attempt, it tries to delete the uploaded Gemini file, with a 10-second cleanup timeout. Cleanup failures are logged without replacing the extraction result or error.

Before enrichment, the backend deduplicates by name, vintage, and volume, keeping the first price. It reuses name/vintage lookups across formats within an upload and limits active Vivino lookups to ten per application process.

At startup, the backend refreshes grape/style mappings and saves them to `VIVINO_CACHE_PATH` (default: `.cache/vivino-mappings.json`, relative to the working directory). Failed refreshes use the last-known-good cached mapping. Without a cache, uploads still work with `N.A.` for unavailable grape/style names. Restart to attempt another refresh. Cache writes are best-effort and contain public reference data only, not uploaded documents or wine lists.

Docker Compose stores this cache in the `vivino-cache` named volume. If you override `VIVINO_CACHE_PATH`, place it under `/app/.cache` to retain it across container recreation. `docker compose down -v` removes the cache.