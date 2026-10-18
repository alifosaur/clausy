"""
FastAPI route endpoints for Sarvam language layer:
- POST /translate: Batch translate texts to Kannada, Hindi, or English
- POST /speak: Text-to-speech synthesis
- POST /transcribe: Speech-to-text audio transcription
"""

import io
from fastapi import APIRouter, File, UploadFile, Request, HTTPException
from app.models import (
    TranslateRequest,
    TranslateResponse,
    SpeakRequest,
    SpeakResponse,
    TranscribeResponse,
)
from app.core.config import settings
from app.core.ratelimit import limiter
from app.services.sarvam import sarvam_client

router = APIRouter(tags=["Sarvam Language Layer"])

MAX_AUDIO_BYTES = 10 * 1024 * 1024  # 10 MB


def validate_audio_signature(content: bytes) -> tuple[bool, str, str]:
    """
    Checks real magic bytes / file signatures for audio files.
    Returns (is_valid, detected_format, detected_mime).
    Supported formats: WebM, WAV, MP3, OGG.
    """
    if len(content) < 4:
        return False, "unknown", "application/octet-stream"

    # 1. WebM (EBML header 1A 45 DF A3)
    if content.startswith(b"\x1a\x45\xdf\xa3"):
        return True, "webm", "audio/webm"

    # 2. WAV (RIFF....WAVE)
    if content.startswith(b"RIFF") and len(content) >= 12 and content[8:12] == b"WAVE":
        return True, "wav", "audio/wav"

    # 3. OGG (OggS)
    if content.startswith(b"OggS"):
        return True, "ogg", "audio/ogg"

    # 4. MP3 (ID3 tag or MPEG sync bytes)
    if content.startswith(b"ID3"):
        return True, "mp3", "audio/mpeg"
    if len(content) >= 2 and content[0] == 0xFF and (content[1] & 0xE0) == 0xE0:
        return True, "mp3", "audio/mpeg"

    return False, "unknown", "application/octet-stream"


def ensure_sarvam_available():
    """Validates that Sarvam services are enabled or running in mock mode."""
    if not settings.SARVAM_ENABLED and not settings.MOCK_MODE:
        raise HTTPException(
            status_code=503,
            detail="Sarvam language services are currently disabled. Please configure SARVAM_API_KEY and set SARVAM_ENABLED=true.",
        )


@router.post("/translate", response_model=TranslateResponse)
@limiter.limit("30/minute")
async def translate_texts(request: Request, body: TranslateRequest):
    """
    Translates up to 20 text strings (max 1000 characters each) to 'kn', 'hi', or 'en'.
    Never logs document content or secret keys.
    """
    ensure_sarvam_available()

    # Validate texts count and item lengths
    if len(body.texts) > 20:
        raise HTTPException(status_code=400, detail="Too many texts to translate. Maximum 20 allowed per request.")

    for idx, text in enumerate(body.texts):
        if len(text) > 1000:
            raise HTTPException(
                status_code=400,
                detail=f"Text item at index {idx} exceeds 1000 characters limit ({len(text)} chars).",
            )

    translated = await sarvam_client.translate(body.texts, body.target)
    return TranslateResponse(texts=translated)


@router.post("/speak", response_model=SpeakResponse)
@limiter.limit("20/minute")
async def speak_text(request: Request, body: SpeakRequest):
    """
    Synthesizes text (up to 800 characters) into speech audio in Kannada, Hindi, or English.
    Returns audio as base64-encoded WAV.
    """
    ensure_sarvam_available()

    if not body.text or not body.text.strip():
        raise HTTPException(status_code=400, detail="Text for speech synthesis cannot be empty.")

    if len(body.text) > 800:
        raise HTTPException(
            status_code=400,
            detail=f"Text exceeds the 800 character limit for speech synthesis ({len(body.text)} chars).",
        )

    result = await sarvam_client.speak(body.text, body.lang)
    return SpeakResponse(
        audio=result.get("audio", ""),
        content_type=result.get("content_type", "audio/wav"),
    )


@router.post("/transcribe", response_model=TranscribeResponse)
@limiter.limit("20/minute")
async def transcribe_audio(request: Request, file: UploadFile = File(...)):
    """
    Transcribes uploaded audio (max 10 MB, WebM/WAV/MP3/OGG).
    Validates magic bytes / real file signatures before forwarding.
    Returns transcribed text and detected language code.
    """
    ensure_sarvam_available()

    content = await file.read()

    if len(content) == 0:
        raise HTTPException(status_code=400, detail="Empty audio file provided.")

    if len(content) > MAX_AUDIO_BYTES:
        raise HTTPException(
            status_code=400,
            detail=f"Audio file too large. Maximum size is 10 MB ({len(content)} bytes uploaded).",
        )

    is_valid, fmt, mime_type = validate_audio_signature(content)
    if not is_valid:
        raise HTTPException(
            status_code=400,
            detail="Unsupported audio format. Only WebM, WAV, MP3, and OGG audio are supported.",
        )

    filename = file.filename or f"audio.{fmt}"
    result = await sarvam_client.transcribe(content, filename=filename, mime_type=mime_type)

    return TranscribeResponse(
        text=result.get("text", ""),
        language=result.get("language", "unknown"),
    )
