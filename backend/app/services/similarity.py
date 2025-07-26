import string
import logging
from app.core.schemas import WineDetails

logger = logging.getLogger("backend.app")


def remove_punctation(s: str) -> str:
    """Utility function to remove punctuation from a given string."""
    translator = str.maketrans("", "", string.punctuation)
    return s.translate(translator)


def generate_ngrams(text: str, n: int = 2) -> list[str]:
    """Generates a list of n-grams from a given text."""
    # Handle empty or very short strings gracefully
    if len(text) < n:
        return []

    ngrams = [text[i : i + n] for i in range(len(text) - n + 1)]
    return ngrams


def sorensen_dice_similarity(s1: str, s2: str, n: int = 2) -> float:
    """
    Calculates the Sorensen-Dice coefficient between two strings based on their n-gram tokenization.

    DSC = (2 * |Intersection of n-grams|) / (|Set of n-grams from s1| + |Set of n-grams from s2|)

    Args:
        s1 (str): The first string to compare.
        s2 (str): The second string to compare.
        n (int): The size of the n-gram to use for tokenization. Defaults to 2 (bigrams).

    Returns:
        float: The Sørensen-Dice similarity score, ranging from 0.0 to 1.0.
    """
    if not isinstance(s1, str) or not isinstance(s2, str):
        raise TypeError("Both s1 and s2 must be strings.")
    if not isinstance(n, int) or n < 1:
        raise ValueError("n must be a positive integer.")

    s1 = remove_punctation(s1.lower())
    s2 = remove_punctation(s2.lower())

    ngrams1 = generate_ngrams(s1, n)
    ngrams2 = generate_ngrams(s2, n)

    set1 = set(ngrams1)
    set2 = set(ngrams2)

    # Handle cases where one or both sets of n-grams are empty
    if not set1 and not set2:
        return 1.0 if s1 == s2 else 0.0
    elif not set1 or not set2:
        # If one set is empty and the other is not, there's no commonality
        return 0.0

    intersection = set1.intersection(set2)

    denominator = len(set1) + len(set2)

    if denominator == 0:
        return 0.0

    dice_coefficient = (2.0 * len(intersection)) / denominator

    logger.debug(
        f"sorensen_dice_similarity(s1='{s1}', s2='{s2}', n={n}) = {dice_coefficient}\n"
    )
    return dice_coefficient


def update_wine_similarity(
    wine_details: list[WineDetails], n: int = 2
) -> list[WineDetails]:
    """
    Updates the wine details with similarity scores based on the Sorensen-Dice coefficient.

    Args:
        wine_details (list[dict]): A list of dictionaries, each representing a wine.
        n (int): The size of the n-gram to use.

    Returns:
        list[dict]: The updated list of wine details with similarity scores.
    """
    for wine in wine_details:
        dice_coefficient = sorensen_dice_similarity(
            wine.wine_name, wine.vivino_match, n
        )
        wine.match_coefficient = dice_coefficient

    return wine_details
