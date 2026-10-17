import pytest
from app.core.config import Settings


def test_gemma_model_fallback_when_empty_or_whitespace():
    # Empty string
    s1 = Settings(GEMMA_MODEL="")
    assert s1.GEMMA_MODEL == "gemma-4-26b-a4b-it"

    # Whitespace only
    s2 = Settings(GEMMA_MODEL="   \t\n  ")
    assert s2.GEMMA_MODEL == "gemma-4-26b-a4b-it"

    # None
    s3 = Settings(GEMMA_MODEL=None)
    assert s3.GEMMA_MODEL == "gemma-4-26b-a4b-it"

    # Valid model string preserved and stripped
    s4 = Settings(GEMMA_MODEL="  gemma-4-31b-it  ")
    assert s4.GEMMA_MODEL == "gemma-4-31b-it"
