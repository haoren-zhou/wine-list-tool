## Backend

This directory contains the FastAPI application.

### Structure

*   `app/main.py`: The main FastAPI application file, defining endpoints.
*   `app/core`: Configuration, schemas, logging, and exception types.
*   `app/services`: Logic for interacting with external APIs (Gemini, Vivino) and computing wine name similarity.
*   `tests`: Pytest suite for the pure-logic modules. Run with `uv run pytest`.

### API Endpoints

*   `GET /health`: Health check endpoint.
*   `POST /upload`: Upload a PDF file for processing.