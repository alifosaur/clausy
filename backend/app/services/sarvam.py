"""
Async client for Sarvam AI language services:
- Translation (Mayura / Sarvam-Translate)
- Text-to-Speech (Bulbul v3)
- Speech-to-Text (Saaras v3)

Strict Confidentiality & Security:
- Never logs input text, translated text, audio bytes, or secret API keys.
- Uses timeouts and single-retry backoff on transient errors.
- Maps upstream errors to friendly domain exceptions.
"""

import asyncio
import logging
from typing import Literal
import httpx
from fastapi import HTTPException

from app.core.config import settings

logger = logging.getLogger("clausy.sarvam")

# Standard BCP-47 language mappings for Sarvam
LANG_CODE_MAP = {
    "kn": "kn-IN",
    "hi": "hi-IN",
    "en": "en-IN",
}

# 1-second silent WAV base64 for mock / fallback audio
MOCK_WAV_BASE64 = "UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA="


class SarvamError(HTTPException):
    """Friendly domain exception for Sarvam AI errors without leaking secrets or data."""
    def __init__(self, detail: str = "Language service is currently unavailable.", status_code: int = 502):
        super().__init__(status_code=status_code, detail=detail)


class SarvamClient:
    """Async client interacting with Sarvam AI REST APIs."""

    def __init__(
        self,
        api_key: str | None = None,
        api_url: str | None = None,
        timeout: float = 30.0,
    ):
        self.api_key = api_key or settings.SARVAM_API_KEY
        self.api_url = (api_url or settings.SARVAM_API_URL).rstrip("/")
        self.timeout = timeout

    def _get_headers(self) -> dict[str, str]:
        if not self.api_key:
            raise SarvamError(
                "Sarvam API key is not configured on the server. Please set SARVAM_API_KEY or enable MOCK_MODE.",
                status_code=503,
            )
        return {
            "api-subscription-key": self.api_key,
        }

    async def _request_with_retry(
        self,
        method: str,
        url: str,
        headers: dict[str, str],
        json_data: dict | None = None,
        files: dict | None = None,
        data: dict | None = None,
    ) -> httpx.Response:
        """Executes HTTP request with one retry on 429/5xx and friendly error mapping."""
        for attempt in range(2):
            try:
                async with httpx.AsyncClient(timeout=self.timeout) as client:
                    if method.upper() == "POST":
                        if files:
                            response = await client.post(url, headers=headers, files=files, data=data)
                        else:
                            response = await client.post(url, headers=headers, json=json_data)
                    else:
                        response = await client.get(url, headers=headers)

                if response.status_code == 200:
                    return response

                # Retry on 429 / 5xx once
                if response.status_code in (429, 500, 502, 503, 504) and attempt == 0:
                    await asyncio.sleep(1.5)
                    continue

                if response.status_code in (401, 403):
                    logger.warning("Sarvam authentication rejected: status=%d", response.status_code)
                    raise SarvamError("Authentication with language service failed.", status_code=401)
                elif response.status_code == 429:
                    raise SarvamError("Language service rate limit reached. Please wait a moment.", status_code=429)
                elif response.status_code == 400:
                    raise SarvamError("Invalid request parameters sent to language service.", status_code=400)
                else:
                    logger.warning("Sarvam upstream error: status=%d", response.status_code)
                    raise SarvamError(
                        f"Language service request failed with status {response.status_code}.",
                        status_code=502,
                    )

            except (SarvamError, HTTPException):
                raise
            except httpx.TimeoutException:
                if attempt == 0:
                    await asyncio.sleep(1.5)
                    continue
                raise SarvamError("The language service timed out. Please try again.", status_code=504)
            except httpx.RequestError as err:
                if attempt == 0:
                    await asyncio.sleep(1.5)
                    continue
                logger.warning("Sarvam network error: %s", type(err).__name__)
                raise SarvamError("Network error contacting language service.", status_code=503)

        raise SarvamError("Failed to communicate with language service after retrying.", status_code=502)

    async def translate_single(self, text: str, target: Literal["kn", "hi", "en"]) -> str:
        """Translates a single string to target language."""
        if not text or not text.strip():
            return text

        if settings.MOCK_MODE:
            prefix = {"kn": "[ಕನ್ನಡ] ", "hi": "[हिन्दी] ", "en": ""}.get(target, "")
            return f"{prefix}{text}" if prefix else text

        target_code = LANG_CODE_MAP.get(target)
        if not target_code:
            raise SarvamError(f"Unsupported target language '{target}'.", status_code=400)

        url = f"{self.api_url}/translate"
        headers = self._get_headers()
        headers["Content-Type"] = "application/json"

        payload = {
            "input": text,
            "source_language_code": "auto",
            "target_language_code": target_code,
            "model": settings.SARVAM_TRANSLATE_MODEL,
            "mode": "formal",
        }

        response = await self._request_with_retry("POST", url, headers, json_data=payload)
        res_json = response.json()
        return res_json.get("translated_text", text)

    async def translate(self, texts: list[str], target: Literal["kn", "hi", "en"]) -> list[str]:
        """
        Translates a list of texts (max 20 items, up to 1000 chars each) to the target language.
        Concurrently translates items using a semaphore of 4.
        """
        if not texts:
            return []

        if target == "en":
            # If target is English and items are already in English, return as-is
            # unless mock mode or explicitly requested
            pass

        sem = asyncio.Semaphore(4)

        async def _translate_with_sem(t: str) -> str:
            async with sem:
                return await self.translate_single(t, target)

        results = await asyncio.gather(*[_translate_with_sem(t) for t in texts])
        return list(results)

    async def speak(self, text: str, lang: Literal["kn", "hi", "en"]) -> dict[str, str]:
        """
        Synthesizes text (up to 800 chars) to spoken audio using Bulbul v3.
        Returns dict {"audio": base64_str, "content_type": "audio/wav"}.
        """
        if not text or not text.strip():
            raise SarvamError("Text for speech synthesis cannot be empty.", status_code=400)

        if settings.MOCK_MODE:
            return {"audio": MOCK_WAV_BASE64, "content_type": "audio/wav"}

        lang_code = LANG_CODE_MAP.get(lang)
        if not lang_code:
            raise SarvamError(f"Unsupported speech language '{lang}'.", status_code=400)

        url = f"{self.api_url}/text-to-speech"
        headers = self._get_headers()
        headers["Content-Type"] = "application/json"

        payload = {
            "text": text,
            "language_code": lang_code,
            "model": settings.SARVAM_TTS_MODEL,
        }

        response = await self._request_with_retry("POST", url, headers, json_data=payload)
        res_json = response.json()
        audios = res_json.get("audios", [])
        if not audios or not audios[0]:
            raise SarvamError("No audio returned from speech synthesis.", status_code=502)

        return {
            "audio": audios[0],
            "content_type": "audio/wav",
        }

    async def transcribe(
        self,
        audio_bytes: bytes,
        filename: str = "audio.webm",
        mime_type: str = "audio/webm",
    ) -> dict[str, str]:
        """
        Transcribes speech audio (up to 10 MB, ~30s) to text using Saaras v3.
        Returns dict {"text": transcript, "language": language_code}.
        """
        if not audio_bytes:
            raise SarvamError("Audio file is empty.", status_code=400)

        if settings.MOCK_MODE:
            return {
                "text": "What is the security deposit refund timeline?",
                "language": "en-IN",
            }

        url = f"{self.api_url}/speech-to-text"
        headers = self._get_headers()

        files = {
            "file": (filename, audio_bytes, mime_type),
        }
        data = {
            "model": settings.SARVAM_STT_MODEL,
            "language_code": "unknown",
        }

        response = await self._request_with_retry("POST", url, headers, files=files, data=data)
        res_json = response.json()

        transcript = res_json.get("transcript", "")
        detected_lang = res_json.get("language_code", "unknown")

        return {
            "text": transcript,
            "language": detected_lang or "unknown",
        }


# Global singleton instance
sarvam_client = SarvamClient()
