from app.core.schemas import WineDetails
from app.main import deduplicate_wine_list


def make_wine(
    wine_name: str = "Chateau Margaux",
    vintage: int | str | None = 2015,
    price: int = 100,
    volume: int = 750,
) -> WineDetails:
    return WineDetails(wine_name=wine_name, vintage=vintage, price=price, volume=volume)


class TestDeduplicateWineList:
    def test_removes_exact_duplicates(self):
        wines = [make_wine(), make_wine()]

        result = deduplicate_wine_list(wines)

        assert len(result) == 1

    def test_keeps_first_occurrence(self):
        first = make_wine(price=100)
        duplicate = make_wine(price=200)

        result = deduplicate_wine_list([first, duplicate])

        assert result == [first]

    def test_different_vintage_is_not_a_duplicate(self):
        wines = [make_wine(vintage=2015), make_wine(vintage=2016)]

        result = deduplicate_wine_list(wines)

        assert len(result) == 2

    def test_different_volume_is_not_a_duplicate(self):
        wines = [make_wine(volume=750), make_wine(volume=1500)]

        result = deduplicate_wine_list(wines)

        assert len(result) == 2

    def test_preserves_order(self):
        wines = [
            make_wine(wine_name="Wine A"),
            make_wine(wine_name="Wine B"),
            make_wine(wine_name="Wine A"),
        ]

        result = deduplicate_wine_list(wines)

        assert [w.wine_name for w in result] == ["Wine A", "Wine B"]

    def test_empty_list(self):
        assert deduplicate_wine_list([]) == []
