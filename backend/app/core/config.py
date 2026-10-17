from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    GEMMA_API_STYLE: str = "gemini"  # "gemini" or "openai"
    GEMMA_API_KEY: str = ""
    GEMMA_API_URL: str = "https://generativelanguage.googleapis.com/v1beta"
    GEMMA_MODEL: str | None = None
    ALLOWED_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000"
    MOCK_MODE: bool = False

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @model_validator(mode="after")
    def validate_model_and_style(self) -> "Settings":
        """Normalizes GEMMA_API_STYLE and provides fallback for empty GEMMA_MODEL based on style."""
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

        return self

    @property
    def cors_origins(self) -> list[str]:
        """Parses comma-separated allowed origins into a list, stripping whitespace."""
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]

    def __repr__(self) -> str:
        """Never log or reveal the secret API key."""
        masked_key = "***" if self.GEMMA_API_KEY else "<not set>"
        return (
            f"Settings(GEMMA_API_STYLE='{self.GEMMA_API_STYLE}', "
            f"GEMMA_API_KEY={masked_key}, "
            f"GEMMA_API_URL='{self.GEMMA_API_URL}', "
            f"GEMMA_MODEL='{self.GEMMA_MODEL}', "
            f"ALLOWED_ORIGINS='{self.ALLOWED_ORIGINS}', "
            f"MOCK_MODE={self.MOCK_MODE})"
        )


settings = Settings()
