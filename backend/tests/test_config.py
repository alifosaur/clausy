import pytest
from app.core.config import Settings


def test_gemma_model_fallback_when_empty_or_whitespace():
    # Gemini style (default) empty string
    s1 = Settings(GEMMA_API_STYLE="gemini", GEMMA_MODEL="")
    assert s1.GEMMA_MODEL == "gemma-4-26b-a4b-it"
    assert s1.GEMMA_API_STYLE == "gemini"

    # Whitespace only
    s2 = Settings(GEMMA_MODEL="   \t\n  ")
    assert s2.GEMMA_MODEL == "gemma-4-26b-a4b-it"

    # None
    s3 = Settings(GEMMA_MODEL=None)
    assert s3.GEMMA_MODEL == "gemma-4-26b-a4b-it"

    # Valid model string preserved and stripped
    s4 = Settings(GEMMA_MODEL="  gemma-4-31b-it  ")
    assert s4.GEMMA_MODEL == "gemma-4-31b-it"

    # OpenAI style empty string fallback
    s5 = Settings(GEMMA_API_STYLE="openai", GEMMA_MODEL="")
    assert s5.GEMMA_MODEL == "google/gemma-4-26b-a4b-it"
    assert s5.GEMMA_API_STYLE == "openai"

    # OpenAI style None fallback
    s6 = Settings(GEMMA_API_STYLE="openai", GEMMA_MODEL=None)
    assert s6.GEMMA_MODEL == "google/gemma-4-26b-a4b-it"

    # OpenAI style custom model preserved
    s7 = Settings(GEMMA_API_STYLE="openai", GEMMA_MODEL=" google/gemma-4-31b-it ")
    assert s7.GEMMA_MODEL == "google/gemma-4-31b-it"
