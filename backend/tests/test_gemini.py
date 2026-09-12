import asyncio
import io
from types import SimpleNamespace
from unittest.mock import AsyncMock

import pytest
from google.genai import errors

from app.core.exceptions import GeminiError
from app.core.schemas import WineDetailsBase
from app.services import gemini


@pytest.fixture
def client(monkeypatch):
    monkeypatch.setattr(gemini, "MOCK_GEMINI_RESPONSE", False)
    return SimpleNamespace(
        files=SimpleNamespace(
            upload=AsyncMock(return_value=SimpleNamespace(name="files/test-document")),
            delete=AsyncMock(),
        ),
        models=SimpleNamespace(
            generate_content=AsyncMock(
                return_value=SimpleNamespace(
                    text="[]",
                    parsed=[],
                )
            )
        ),
    )


def extract(client):
    return asyncio.run(
        gemini.extract_wine_details_from_file(io.BytesIO(b"fixture"), client)
    )


def api_error():
    return errors.APIError(
        503, {"error": {"message": "Unavailable", "status": "UNAVAILABLE"}}
    )


def test_valid_empty_list_is_success_and_file_is_deleted(client):
    assert extract(client) == []
    client.files.delete.assert_awaited_once_with(name="files/test-document")


def test_valid_wines_are_returned_and_file_is_deleted(client):
    wine = WineDetailsBase(wine_name="Wine", vintage=2020, price=50, volume=750)
    client.models.generate_content.return_value = SimpleNamespace(parsed=[wine])
    assert extract(client) == [wine]
    client.files.delete.assert_awaited_once()


@pytest.mark.parametrize("parsed", [None, {}, "", [{"wine_name": "Incomplete"}]])
def test_absent_or_invalid_output_is_error_not_empty_list(client, parsed):
    client.models.generate_content.return_value = SimpleNamespace(parsed=parsed)
    with pytest.raises(GeminiError):
        extract(client)
    client.files.delete.assert_awaited_once()


def test_generation_failure_still_deletes_uploaded_file(client):
    client.models.generate_content.side_effect = api_error()
    with pytest.raises(GeminiError, match="API request failed"):
        extract(client)
    client.files.delete.assert_awaited_once()


def test_upload_failure_does_not_attempt_delete(client):
    client.files.upload.side_effect = api_error()
    with pytest.raises(GeminiError):
        extract(client)
    client.files.delete.assert_not_awaited()


def test_cleanup_failure_does_not_replace_success(client):
    client.files.delete.side_effect = RuntimeError("Cleanup unavailable")
    assert extract(client) == []


def test_cleanup_failure_does_not_replace_original_error(client):
    client.models.generate_content.side_effect = api_error()
    client.files.delete.side_effect = RuntimeError("Cleanup unavailable")
    with pytest.raises(GeminiError, match="API request failed"):
        extract(client)


def test_cancellation_propagates_after_cleanup(client):
    client.models.generate_content.side_effect = asyncio.CancelledError
    with pytest.raises(asyncio.CancelledError):
        extract(client)
    client.files.delete.assert_awaited_once()


def test_mock_extraction_needs_no_client(monkeypatch):
    monkeypatch.setattr(gemini, "MOCK_GEMINI_RESPONSE", True)
    assert len(extract(None)) == 3
