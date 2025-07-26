from pydantic import BaseModel


class WineDetailsBase(BaseModel):
    """
    Base schema for wine details extracted from
    a PDF file, used for Gemini API responses.
    """

    wine_name: str
    vintage: int | None
    price: int
    volume: int


class WineDetails(WineDetailsBase):
    vintage: int | str | None  # Allow vintage to be a string for non-vintage wines
    vivino_match: str = ""
    rating_average: float = 0.0
    rating_count: int = 0
    type_id: int = -1
    style_id: int = -1
    grapes: list[int] | None = None
    type_name: str = ""
    style_name: str = ""
    grapes_name: str = ""
