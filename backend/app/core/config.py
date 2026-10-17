from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    GEMMA_API_KEY: str = ""
    GEMMA_API_URL: str = "https://generativelanguage.googleapis.com/v1beta"
    GEMMA_MODEL: str = "gemma-4-26b-a4b-it"
    ALLOWED_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000"
    MOCK_MODE: bool = False

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @field_validator("GEMMA_MODEL", mode="before")
    @classmethod
    def validate_gemma_model(cls, v: str | None) -> str:
        """Treat empty or whitespace-only GEMMA_MODEL as unset, falling back to gemma-4-26b-a4b-it."""
        if v is None or not str(v).strip():
            return "gemma-4-26b-a4b-it"
        return str(v).strip()

    @property
    def cors_origins(self) -> list[str]:
        """Parses comma-separated allowed origins into a list, stripping whitespace."""
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]

    def __repr__(self) -> str:
        """Never log or reveal the secret API key."""
        masked_key = "***" if self.GEMMA_API_KEY else "<not set>"
        return (
            f"Settings(GEMMA_API_KEY={masked_key}, "
            f"GEMMA_API_URL='{self.GEMMA_API_URL}', "
            f"GEMMA_MODEL='{self.GEMMA_MODEL}', "
            f"ALLOWED_ORIGINS='{self.ALLOWED_ORIGINS}', "
            f"MOCK_MODE={self.MOCK_MODE})"
        )


settings = Settings()
