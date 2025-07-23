from pydantic import BaseModel


class WineDetails(BaseModel):
    wine_name: str
    vintage: int | None
    price: int
    volume: int
