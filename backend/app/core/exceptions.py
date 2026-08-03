class UpstreamServiceError(Exception):
    """Base class for failures of external services the backend depends on."""


class GeminiError(UpstreamServiceError):
    """Raised when the Gemini API fails to extract wine details."""


class VivinoError(UpstreamServiceError):
    """Raised when the Vivino API fails to return wine data."""
