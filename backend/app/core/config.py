import os
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    GEMMA_API_KEY: str = ""
    GEMMA_API_URL: str = "https://generativelanguage.googleapis.com/v1beta"
    GEMMA_MODEL: str = ""
    ALLOWED_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

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
            f"ALLOWED_ORIGINS='{self.ALLOWED_ORIGINS}')"
        )


settings = Settings()
