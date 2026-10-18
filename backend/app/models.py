from typing import Literal
from pydantic import BaseModel, Field


class Term(BaseModel):
    key: str = Field(..., description="Machine-readable key: rent, deposit, lock_in, notice_period, penalties, maintenance")
    label: str = Field(..., description="Human-readable label for display")
    value: str = Field(..., description="Extracted value (e.g. ₹32,000, 6 months)")
    quote: str = Field(..., description="Verbatim source sentence extracted from agreement")
    page: int = Field(default=1, ge=1, description="1-indexed page number where quote was found")
    verified: bool = Field(default=False, description="Whether the quote was verified in the extracted document text")


class Flag(BaseModel):
    title: str = Field(..., description="Short summary title of the interacting clause issue")
    reason: str = Field(..., description="Calm explanation of why this interaction is worth clarifying")
    quotes: list[str] = Field(default_factory=list, description="Verbatim source clauses side by side")
    question: str = Field(..., description="Suggested question to ask your landlord")


class Answer(BaseModel):
    text: str = Field(..., description="Explanation answering the tenant's question")
    quotes: list[str] = Field(default_factory=list, description="Exact cited quotes supporting the answer")
    status: Literal["answered", "not_found"] = Field(..., description="Either answered with citations or refused")


class DocumentPage(BaseModel):
    page: int = Field(default=1, description="1-indexed page number")
    pageNumber: int = Field(default=1, description="Alias matching frontend DocumentPage")
    text: str = Field(default="", description="Verbatim extracted text of the page")


class ExtractResponse(BaseModel):
    terms: list[Term]
    flags: list[Flag]
    extracted_text: str = Field(default="", description="Full extracted agreement text")
    rawText: str = Field(default="", description="Alias for extracted_text matching frontend")
    pages: list[DocumentPage] = Field(default_factory=list, description="Extracted pages list")


class AskRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=500, description="Tenant question about the agreement")
    extracted_text: str = Field(default="", description="Full extracted agreement text")
    text: str = Field(default="", description="Alias for extracted_text from frontend")


class HealthResponse(BaseModel):
    status: str = "ok"
    sarvam_enabled: bool = False


class TranslateRequest(BaseModel):
    texts: list[str] = Field(..., max_length=20, description="List of texts to translate (max 20 items)")
    target: Literal["kn", "hi", "en"] = Field(..., description="Target language: 'kn', 'hi', or 'en'")


class TranslateResponse(BaseModel):
    texts: list[str]


class SpeakRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=800, description="Text to synthesize to speech (max 800 chars)")
    lang: Literal["kn", "hi", "en"] = Field(..., description="Language: 'kn', 'hi', or 'en'")


class SpeakResponse(BaseModel):
    audio: str = Field(..., description="Base64 encoded audio in WAV format")
    content_type: str = Field(default="audio/wav", description="Audio MIME type")


class TranscribeResponse(BaseModel):
    text: str = Field(..., description="Transcribed text from speech")
    language: str = Field(default="unknown", description="Detected language code")
