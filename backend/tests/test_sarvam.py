import pytest
from unittest.mock import patch, AsyncMock
from fastapi.testclient import TestClient
import httpx

from app.main import app
from app.core.config import settings

client = TestClient(app)

# Dummy valid audio magic bytes
VALID_WEBM = b"\x1a\x45\xdf\xa3" + b"\x00" * 50
VALID_WAV = b"RIFF" + b"\x24\x00\x00\x00" + b"WAVE" + b"\x00" * 50
VALID_MP3_ID3 = b"ID3" + b"\x03\x00\x00\x00\x00\x00\x00" + b"\x00" * 50
VALID_OGG = b"OggS" + b"\x00" * 50
INVALID_AUDIO = b"NOT_AUDIO_FILE_DATA"


@pytest.fixture(autouse=True)
def enable_sarvam():
    """Ensure Sarvam is enabled and in mock mode by default for route tests."""
    orig_mock = settings.MOCK_MODE
    orig_enabled = settings.SARVAM_ENABLED
    orig_key = settings.SARVAM_API_KEY
    settings.MOCK_MODE = True
    settings.SARVAM_ENABLED = True
    settings.SARVAM_API_KEY = "test-sarvam-key"
    yield
    settings.MOCK_MODE = orig_mock
    settings.SARVAM_ENABLED = orig_enabled
    settings.SARVAM_API_KEY = orig_key


def test_health_includes_sarvam_enabled():
    res = client.get("/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ok"
    assert "sarvam_enabled" in data
    assert data["sarvam_enabled"] is True


def test_translate_success_mock():
    res = client.post(
        "/translate",
        json={"texts": ["Hello", "World"], "target": "kn"},
    )
    assert res.status_code == 200
    data = res.json()
    assert "texts" in data
    assert len(data["texts"]) == 2
    assert "[ಕನ್ನಡ]" in data["texts"][0]


def test_translate_validation_too_many_items():
    too_many = [f"Item {i}" for i in range(25)]
    res = client.post("/translate", json={"texts": too_many, "target": "hi"})
    assert res.status_code == 400


def test_translate_validation_item_too_long():
    long_text = "x" * 1005
    res = client.post("/translate", json={"texts": [long_text], "target": "hi"})
    assert res.status_code == 400
    assert "1000 characters limit" in res.json().get("detail", "")


def test_translate_validation_invalid_target():
    res = client.post("/translate", json={"texts": ["hello"], "target": "fr"})
    assert res.status_code == 400


def test_speak_success_mock():
    res = client.post("/speak", json={"text": "Hello world", "lang": "hi"})
    assert res.status_code == 200
    data = res.json()
    assert "audio" in data
    assert data["content_type"] == "audio/wav"


def test_speak_validation_empty_text():
    res = client.post("/speak", json={"text": "   ", "lang": "hi"})
    assert res.status_code == 400


def test_speak_validation_too_long():
    long_text = "a" * 850
    res = client.post("/speak", json={"text": long_text, "lang": "kn"})
    assert res.status_code == 400


def test_speak_validation_invalid_lang():
    res = client.post("/speak", json={"text": "Valid text", "lang": "es"})
    assert res.status_code == 400


def test_transcribe_success_mock_webm():
    files = {"file": ("recording.webm", VALID_WEBM, "audio/webm")}
    res = client.post("/transcribe", files=files)
    assert res.status_code == 200
    data = res.json()
    assert "text" in data
    assert "language" in data


def test_transcribe_success_mock_wav():
    files = {"file": ("audio.wav", VALID_WAV, "audio/wav")}
    res = client.post("/transcribe", files=files)
    assert res.status_code == 200
    data = res.json()
    assert len(data["text"]) > 0


def test_transcribe_validation_empty_file():
    files = {"file": ("empty.wav", b"", "audio/wav")}
    res = client.post("/transcribe", files=files)
    assert res.status_code == 400
    assert "empty" in res.json().get("detail", "").lower()


def test_transcribe_validation_invalid_signature():
    files = {"file": ("fake.wav", INVALID_AUDIO, "audio/wav")}
    res = client.post("/transcribe", files=files)
    assert res.status_code == 400
    assert "unsupported" in res.json().get("detail", "").lower()


def test_transcribe_validation_too_large():
    huge_bytes = VALID_WAV + b"\x00" * (10 * 1024 * 1024 + 10)
    files = {"file": ("large.wav", huge_bytes, "audio/wav")}
    res = client.post("/transcribe", files=files)
    assert res.status_code == 400
    assert "too large" in res.json().get("detail", "").lower()


def test_disabled_service_returns_503():
    settings.MOCK_MODE = False
    settings.SARVAM_ENABLED = False
    res = client.post("/translate", json={"texts": ["Hi"], "target": "kn"})
    assert res.status_code == 503
    assert "disabled" in res.json().get("detail", "").lower()


@pytest.mark.asyncio
async def test_upstream_error_mapping_401():
    from app.services.sarvam import SarvamClient, SarvamError

    settings.MOCK_MODE = False
    mock_resp = httpx.Response(401, json={"error": {"message": "Invalid API key"}})
    client_instance = SarvamClient(api_key="bad-key")

    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = mock_resp
        with pytest.raises(SarvamError) as exc_info:
            await client_instance.translate_single("test", "kn")
        assert exc_info.value.status_code == 401


@pytest.mark.asyncio
async def test_upstream_error_mapping_429():
    from app.services.sarvam import SarvamClient, SarvamError

    settings.MOCK_MODE = False
    mock_resp = httpx.Response(429, json={"error": {"message": "Rate limit reached"}})
    client_instance = SarvamClient(api_key="valid-key")

    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = mock_resp
        with pytest.raises(SarvamError) as exc_info:
            await client_instance.translate_single("test", "kn")
        assert exc_info.value.status_code == 429


@pytest.mark.asyncio
async def test_upstream_error_mapping_500():
    from app.services.sarvam import SarvamClient, SarvamError

    settings.MOCK_MODE = False
    mock_resp = httpx.Response(500, json={"error": {"message": "Internal error"}})
    client_instance = SarvamClient(api_key="valid-key")

    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = mock_resp
        with pytest.raises(SarvamError) as exc_info:
            await client_instance.translate_single("test", "kn")
        assert exc_info.value.status_code == 502

