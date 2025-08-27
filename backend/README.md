## Backend

This directory contains the FastAPI application.

### Structure

*   `app/main.py`: The main FastAPI application file, defining endpoints.
*   `app/core`: Configuration and schemas.
*   `app/services`: Logic for interacting with external APIs (Gemini, Vivino).

### API Endpoints

*   `GET /health`: Health check endpoint.
*   `POST /upload`: Upload a PDF file for processing.