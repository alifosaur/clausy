import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.core.config import settings

JPEG_SAMPLE = b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x00\x00\x01\x00\x01\x00\x00"
PNG_SAMPLE = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01"


@pytest.fixture(autouse=True)
def enable_mock_mode_for_test_api():
    original = settings.MOCK_MODE
    settings.MOCK_MODE = True
    yield
    settings.MOCK_MODE = original


@pytest.mark.asyncio
async def test_get_health():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/health")
        assert response.status_code == 200
        assert response.json()["status"] == "ok"


@pytest.mark.asyncio
async def test_post_ask_valid():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        payload = {
            "question": "Can the landlord enter my apartment without notice?",
            "extracted_text": "The Lessor or authorized representatives reserve the right to enter and inspect the premises at reasonable hours with 24 hours prior written notice to the Lessee."
        }
        response = await client.post("/ask", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "text" in data
        assert "quotes" in data
        assert data["status"] in ["answered", "not_found"]


@pytest.mark.asyncio
async def test_post_ask_refusal():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        payload = {
            "question": "Are pets allowed in the apartment?",
            "extracted_text": "Standard rental agreement text without pet clause."
        }
        response = await client.post("/ask", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "not_found"
        assert len(data["quotes"]) == 0
        assert "Not found in this agreement" in data["text"]


@pytest.mark.asyncio
async def test_post_ask_question_too_long():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        payload = {
            "question": "A" * 501,
            "extracted_text": "Some text"
        }
        response = await client.post("/ask", json=payload)
        assert response.status_code == 400


@pytest.mark.asyncio
async def test_post_extract_valid_jpeg():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        files = [
            ("files", ("page1.jpg", JPEG_SAMPLE, "image/jpeg")),
        ]
        response = await client.post("/extract", files=files)
        assert response.status_code == 200
        data = response.json()
        assert "terms" in data
        assert "flags" in data
        assert len(data["terms"]) > 0


@pytest.mark.asyncio
async def test_post_extract_invalid_magic_bytes():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        fake_file = b"Not an image file at all"
        files = [
            ("files", ("fake.jpg", fake_file, "image/jpeg")),
        ]
        response = await client.post("/extract", files=files)
        assert response.status_code == 400
        detail = response.json()["detail"].lower()
        assert "unsupported file type" in detail or "magic bytes" in detail


@pytest.mark.asyncio
async def test_post_extract_empty_file():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        files = [
            ("files", ("empty.png", b"", "image/png")),
        ]
        response = await client.post("/extract", files=files)
        assert response.status_code == 400
        assert "empty file" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_post_extract_too_large_file():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Create a header of valid JPEG followed by > 10MB of zeros
        large_file = JPEG_SAMPLE + b"\x00" * (10 * 1024 * 1024 + 10)
        files = [
            ("files", ("huge.jpg", large_file, "image/jpeg")),
        ]
        response = await client.post("/extract", files=files)
        assert response.status_code == 400
        assert "file too large" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_post_extract_too_many_files():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        files = [
            ("files", (f"page{i}.jpg", JPEG_SAMPLE, "image/jpeg"))
            for i in range(6)
        ]
        response = await client.post("/extract", files=files)
        assert response.status_code == 400
        assert "too many files" in response.json()["detail"].lower()
