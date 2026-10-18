from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


from pathlib import Path

_BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
_ENV_FILE = _BACKEND_DIR / ".env"


class Settings(BaseSettings):
    GEMMA_API_STYLE: str = "gemini"  # "gemini" or "openai"
    GEMMA_API_KEY: str = ""
    GEMMA_API_URL: str = "https://generativelanguage.googleapis.com/v1beta"
    GEMMA_MODEL: str | None = None
    ALLOWED_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000"
    MOCK_MODE: bool = False

    # Sarvam AI configuration
    SARVAM_API_KEY: str = ""
    SARVAM_ENABLED: bool | None = None
    SARVAM_API_URL: str = "https://api.sarvam.ai"
    SARVAM_STT_MODEL: str = "saaras:v3"
    SARVAM_TTS_MODEL: str = "bulbul:v3"
    SARVAM_TRANSLATE_MODEL: str = "mayura:v1"

    model_config = SettingsConfigDict(
        env_file=(str(_ENV_FILE), ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @model_validator(mode="after")
    def validate_model_and_style(self) -> "Settings":
        """Normalizes GEMMA_API_STYLE, SARVAM_ENABLED and provides fallbacks."""
        style = (self.GEMMA_API_STYLE or "gemini").strip().lower()
        if style not in ("gemini", "openai"):
            style = "gemini"
        self.GEMMA_API_STYLE = style

        # If GEMMA_MODEL is unset, empty, or whitespace-only, fall back based on style
        raw_model = self.GEMMA_MODEL
        if raw_model is None or not str(raw_model).strip():
            if style == "openai":
                self.GEMMA_MODEL = "google/gemma-4-26b-a4b-it"
            else:
                self.GEMMA_MODEL = "gemma-4-26b-a4b-it"
        else:
            self.GEMMA_MODEL = str(raw_model).strip()

        # Sarvam enabled defaults to True if key present, else False
        if self.SARVAM_ENABLED is None:
            self.SARVAM_ENABLED = bool(self.SARVAM_API_KEY and self.SARVAM_API_KEY.strip())

        return self

    @property
    def cors_origins(self) -> list[str]:
        """Parses comma-separated allowed origins into a list, stripping whitespace."""
        origins = [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]
        return origins or ["http://localhost:3000"]

    def __repr__(self) -> str:
        """Never log or reveal the secret API keys."""
        masked_gemma = "***" if self.GEMMA_API_KEY else "<not set>"
        masked_sarvam = "***" if self.SARVAM_API_KEY else "<not set>"
        return (
            f"Settings(GEMMA_API_STYLE='{self.GEMMA_API_STYLE}', "
            f"GEMMA_API_KEY={masked_gemma}, "
            f"GEMMA_API_URL='{self.GEMMA_API_URL}', "
            f"GEMMA_MODEL='{self.GEMMA_MODEL}', "
            f"SARVAM_ENABLED={self.SARVAM_ENABLED}, "
            f"SARVAM_API_KEY={masked_sarvam}, "
            f"SARVAM_STT_MODEL='{self.SARVAM_STT_MODEL}', "
            f"SARVAM_TTS_MODEL='{self.SARVAM_TTS_MODEL}', "
            f"SARVAM_TRANSLATE_MODEL='{self.SARVAM_TRANSLATE_MODEL}', "
            f"ALLOWED_ORIGINS='{self.ALLOWED_ORIGINS}', "
            f"MOCK_MODE={self.MOCK_MODE})"
        )


settings = Settings()
