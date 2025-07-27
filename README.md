# Wine List Tool

This is a web application that allows users to upload a PDF of a wine list, and it will extract the wine names, enrich the data with information from Vivino, and display it in a filterable list.

## Features

*   Upload a PDF wine list.
*   Extract wine names from the PDF using Google's Gemini API.
*   Enrich wine data with information from the Vivino API.
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
*   Python 3.11+ and `uv` (for backend development without Docker)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/haoren-zhou/wine-list-tool.git
    cd wine-list-tool
    ```

2.  **Set up environment variables:**
    *   Create a `.env` file in the `backend` directory. You can copy `sample.env` as a template.
        *   `GOOGLE_API_KEY`: Your Google Gemini API key, from [Google AI Studio](https://aistudio.google.com/apikey).
        *   `GEMINI_MODEL_ID` *(Optional)*: Specific Gemini model ID, see [Gemini API Docs](https://ai.google.dev/gemini-api/docs/models) for valid model IDs
            *   Default: `gemini-2.5-flash-lite-preview-06-17`

3.  **Build and run with Docker Compose:**
    ```bash
    docker network create front-tier
    docker compose up --build
    ```

The application will be available at http://localhost.

## Usage

1.  Navigate to http://localhost.
2.  Click the "Choose File" button and select a `.pdf` wine list.
3.  Click "Upload".
4.  The application will process the PDF, and the extracted and enriched wine list will be displayed.
5.  You can filter the list by various criteria and sort by price or Vivino rating.

## Project Structure

### Frontend

The `frontend` directory contains the React application.

*   `src/pages`: Main page components (`App.jsx`, `FormPage.jsx`, `FilterableWineList.jsx`).
*   `src/components`: Reusable React components.
*   `src/contexts`: React context for managing application state.
*   `src/hooks`: Custom React hooks.
*   `src/services`: API communication logic.
*   `src/styles`: CSS files.
*   `src/utils`: Utility functions and constants.

### Backend

The `backend` directory contains the FastAPI application.

*   `app/main.py`: The main FastAPI application file, defining endpoints.
*   `app/core`: Configuration and schemas.
*   `app/services`: Logic for interacting with external APIs (Gemini, Vivino).

## API Endpoints

*   `GET /health`: Health check endpoint.
*   `POST /upload`: Upload a PDF file for processing.

## Docker Compose Environment Variables

### Frontend

*   `FASTAPI_SERVER_ADDR`: The address of the FastAPI backend (`backend:8000`).

### Backend

*   `FRONTEND_ORIGINS`: Comma-separated list of allowed frontend origins for CORS. Change this if deploying service externally.
*   `GOOGLE_API_KEY` and `GEMINI_MODEL_ID` can also be set here, overriding the `.env` file in the `backend` directory.