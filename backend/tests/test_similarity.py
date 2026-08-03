import pytest

from app.core.schemas import WineDetails
from app.services.similarity import (
    generate_ngrams,
    remove_punctuation,
    sorensen_dice_similarity,
    update_wine_similarity,
)


class TestRemovePunctuation:
    def test_removes_punctuation(self):
        assert remove_punctuation("Château Margaux, 2015!") == "Château Margaux 2015"

    def test_no_punctuation_unchanged(self):
        assert remove_punctuation("Margaux") == "Margaux"


class TestGenerateNgrams:
    def test_bigrams(self):
        assert generate_ngrams("abcd", 2) == ["ab", "bc", "cd"]

    def test_default_n_is_two(self):
        assert generate_ngrams("abc") == ["ab", "bc"]

    def test_string_shorter_than_n_returns_empty(self):
        assert generate_ngrams("a", 2) == []

    def test_empty_string(self):
        assert generate_ngrams("", 2) == []


class TestSorensenDiceSimilarity:
    def test_identical_strings_score_one(self):
        assert sorensen_dice_similarity("Chateau Margaux", "Chateau Margaux") == 1.0

    def test_completely_different_strings_score_zero(self):
        assert sorensen_dice_similarity("aaa", "zzz") == 0.0

    def test_case_and_punctuation_insensitive(self):
        assert sorensen_dice_similarity("Château Margaux!", "château margaux") == 1.0

    def test_known_value(self):
        # bigrams of "night": {ni, ig, gh, ht}; of "nacht": {na, ac, ch, ht}
        assert sorensen_dice_similarity("night", "nacht") == pytest.approx(0.25)

    def test_partial_overlap_scores_between_zero_and_one(self):
        score = sorensen_dice_similarity("Chateau Margaux", "Chateau Lafite")
        assert 0.0 < score < 1.0

    def test_both_strings_too_short_for_ngrams(self):
        assert sorensen_dice_similarity("a", "a", n=2) == 1.0
        assert sorensen_dice_similarity("a", "b", n=2) == 0.0

    def test_one_string_too_short_for_ngrams(self):
        assert sorensen_dice_similarity("a", "abc", n=2) == 0.0

    def test_non_string_input_raises_type_error(self):
        with pytest.raises(TypeError):
            sorensen_dice_similarity("abc", 123)  # type: ignore[arg-type]

    def test_invalid_n_raises_value_error(self):
        with pytest.raises(ValueError):
            sorensen_dice_similarity("abc", "abc", n=0)


class TestUpdateWineSimilarity:
    def test_sets_match_coefficient(self):
        wine = WineDetails(
            wine_name="Chateau Margaux",
            vintage=2015,
            price=1500,
            volume=750,
            vivino_match="Chateau Margaux",
        )

        [result] = update_wine_similarity([wine])

        assert result.match_coefficient == 1.0

    def test_returns_same_list(self):
        wines = [
            WineDetails(
                wine_name="Chateau Margaux",
                vintage=2015,
                price=1500,
                volume=750,
                vivino_match="Chateau Lafite",
            )
        ]

        result = update_wine_similarity(wines)

        assert result is wines
        assert 0.0 < result[0].match_coefficient < 1.0
