import re


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


def verify_quote(quote: str, source_text: str) -> bool:
    """
    Verifies that a quote appears in the source text after whitespace and case normalization.
    Returns True only if the normalized quote appears as a substring in the normalized source text.
    """
    if not quote or not source_text:
        return False

    norm_quote = normalize_text(quote)
    norm_source = normalize_text(source_text)

    if not norm_quote:
        return False

    return norm_quote in norm_source
