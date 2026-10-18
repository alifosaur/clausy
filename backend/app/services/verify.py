import re

# Minimum quote thresholds to prevent verifying trivial or ambiguous fragments
MIN_QUOTE_LENGTH_CHARS: int = 25
MIN_QUOTE_LENGTH_WORDS: int = 4


def normalize_text(text: str) -> str:
    """
    Normalises text by:
    1. Converting to lower case
    2. Standardizing unicode single and double quotes
    3. Collapsing all whitespace (newlines, tabs, spaces) into single spaces
    4. Stripping leading and trailing whitespace
    """
    if not text:
        return ""

    # Standardize single & double quotation marks
    cleaned = text.lower()
    cleaned = re.sub(r"[\u2018\u2019`]", "'", cleaned)
    cleaned = re.sub(r"[\u201c\u201d]", '"', cleaned)

    # Collapse all whitespace sequences into a single space
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    return cleaned


def normalize_digit_grouping(text: str) -> str:
    """
    Removes commas between digits (normalizing Indian 1,59,000 and Western 159,000 grouping).
    E.g. 'Rs. 1,59,000/-' -> 'Rs. 159000/-', '26,500' -> '26500'.
    """
    if not text:
        return ""
    return re.sub(r"(?<=\d)[,](?=\d)", "", text)


def extract_numbers_from_value(value: str) -> list[str]:
    """
    Extracts numbers from a term value (digits with commas/periods removed,
    e.g. '₹1,59,000' -> ['159000'], '26,500/month' -> ['26500'], '6 months' -> ['6']).
    """
    if not value:
        return []
    # Match digit sequences with internal commas or periods
    raw_matches = re.findall(r"\d[\d,\.]*", value)
    numbers: list[str] = []
    for m in raw_matches:
        # Strip commas and periods
        cleaned = re.sub(r"[,]", "", m).rstrip(".")
        if "." in cleaned:
            parts = cleaned.split(".")
            if len(parts) == 2 and parts[1] == "00":
                cleaned = parts[0]
            else:
                cleaned = cleaned.replace(".", "")
        digits = re.sub(r"\D", "", cleaned)
        if digits:
            numbers.append(digits)
    return numbers


def verify_term_value(value: str, quote: str) -> bool:
    """
    Verifies that every number in term.value (e.g. 159000, 26500, 6)
    also appears in the quote, after normalising Indian digit grouping.
    Returns True if all numbers appear or if the value has no numbers.
    """
    if not value or not quote:
        return False

    value_numbers = extract_numbers_from_value(value)
    if not value_numbers:
        return True

    norm_quote = normalize_digit_grouping(quote)
    for num in value_numbers:
        # Match whole number token in normalized quote
        pattern = rf"(?<!\d){re.escape(num)}(?!\d)"
        if not re.search(pattern, norm_quote):
            return False

    return True


def verify_quote(
    quote: str,
    source_text: str,
    min_chars: int = MIN_QUOTE_LENGTH_CHARS,
    min_words: int = MIN_QUOTE_LENGTH_WORDS,
) -> bool:
    """
    Verifies that a quote appears in the source text after whitespace and case normalization.
    Returns False for quotes under min_chars characters (default 25) or under min_words words (default 4).
    Returns True only if the normalized quote appears as a substring in the normalized source text.
    """
    if not quote or not source_text:
        return False

    norm_quote = normalize_text(quote)
    norm_source = normalize_text(source_text)

    if not norm_quote:
        return False

    # Check minimum quote length in characters and words
    if len(norm_quote) < min_chars:
        return False
    if len(norm_quote.split()) < min_words:
        return False

    return norm_quote in norm_source
