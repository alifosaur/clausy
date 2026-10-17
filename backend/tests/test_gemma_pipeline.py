import pytest
from unittest.mock import AsyncMock, patch
from httpx import AsyncClient, ASGITransport

from app.main import app
from app.core.config import settings
from app.services.gemma import GemmaClient, GemmaError, parse_json_tolerant, JsonParseError

JPEG_SAMPLE = b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x00\x00\x01\x00\x01\x00\x00"
PNG_SAMPLE = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01"


# 1. Pipeline Test: Verified quotes kept, fabricated quotes marked unverified, unverified flags dropped
@pytest.mark.asyncio
async def test_extract_pipeline_verified_and_fabricated_quotes():
    original_mock = settings.MOCK_MODE
    original_key = settings.GEMMA_API_KEY
    settings.MOCK_MODE = False
    settings.GEMMA_API_KEY = "dummy-test-key"

    sample_doc_text = (
        "Clause 1: The monthly rent shall be Rs. 35,000/- per month.\n"
        "Clause 2: The security deposit shall be Rs. 1,75,000/- refundable on exit.\n"
        "Clause 3: Lock-in period is 6 months."
    )

    mock_transcribe_result = {
        "pages": [
            {"page": 1, "text": sample_doc_text}
        ]
    }

    mock_analyze_result = {
        "terms": [
            {
                "key": "rent",
                "label": "Monthly Rent",
                "value": "₹35,000",
                "quote": "The monthly rent shall be Rs. 35,000/- per month.",
                "page": 1,
            },
            {
                "key": "deposit",
                "label": "Security Deposit",
                "value": "₹50,000",  # Fabricated amount & quote
                "quote": "The security deposit shall be Rs. 50,000/- only.",
                "page": 1,
            },
        ],
        "flags": [
            {
                "title": "Lock-in clause clarification",
                "reason": "Lock-in period requires full rent liability on early termination.",
                "quotes": ["Lock-in period is 6 months."],
                "question": "Can we clarify early exit terms?",
            },
            {
                "title": "Fabricated painting flag",
                "reason": "Unfounded repainting requirement.",
                "quotes": ["Landlord shall charge Rs. 50,000 for mandatory wall repainting irrespective of condition."],
                "question": "Can we remove this penalty?",
            },
        ],
    }

    try:
        with patch("app.routes.extract.gemma_client.transcribe", new=AsyncMock(return_value=mock_transcribe_result)), \
             patch("app.routes.extract.gemma_client.analyze", new=AsyncMock(return_value=mock_analyze_result)):

            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                files = [("files", ("page1.jpg", JPEG_SAMPLE, "image/jpeg"))]
                response = await client.post("/extract", files=files)

                assert response.status_code == 200
                data = response.json()

                # Check terms verification
                terms = {t["key"]: t for t in data["terms"]}
                assert terms["rent"]["verified"] is True
                assert terms["deposit"]["verified"] is False

                # Check flags: verified flag kept, fabricated flag dropped
                flag_titles = [f["title"] for f in data["flags"]]
                assert "Lock-in clause clarification" in flag_titles
                assert "Fabricated painting flag" not in flag_titles
                assert len(data["flags"]) == 1

                # Check extracted_text and pages
                assert "Clause 1: The monthly rent" in data["extracted_text"]
                assert len(data["pages"]) == 1
                assert data["pages"][0]["page"] == 1
    finally:
        settings.MOCK_MODE = original_mock
        settings.GEMMA_API_KEY = original_key


# 2. Pipeline Test: Answered without evidence downgraded to not_found
@pytest.mark.asyncio
async def test_ask_answered_without_evidence_downgraded():
    original_mock = settings.MOCK_MODE
    original_key = settings.GEMMA_API_KEY
    settings.MOCK_MODE = False
    settings.GEMMA_API_KEY = "dummy-test-key"

    # Gemma claims "answered" but cites a hallucinated / fabricated sentence not in the agreement
    mock_ask_result = {
        "status": "answered",
        "text": "The agreement allows keeping two dogs and cats on the premises.",
        "quotes": ["Tenants are permitted up to 2 domestic pets without extra fee."],
    }

    try:
        with patch("app.routes.ask.gemma_client.ask", new=AsyncMock(return_value=mock_ask_result)):
            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                payload = {
                    "question": "Can I bring my pet dog?",
                    "extracted_text": "Clause 1: Rent is Rs. 30,000. Clause 2: Deposit is Rs. 1,50,000.",
                }
                response = await client.post("/ask", json=payload)

                assert response.status_code == 200
                data = response.json()

                # Verified: downgraded to not_found because quote is not in document text
                assert data["status"] == "not_found"
                assert len(data["quotes"]) == 0
                assert "Not found in this agreement" in data["text"]
    finally:
        settings.MOCK_MODE = original_mock
        settings.GEMMA_API_KEY = original_key


# 3. Pipeline Test: Answered with verified evidence kept
@pytest.mark.asyncio
async def test_ask_answered_with_verified_evidence():
    original_mock = settings.MOCK_MODE
    original_key = settings.GEMMA_API_KEY
    settings.MOCK_MODE = False
    settings.GEMMA_API_KEY = "dummy-test-key"

    doc_text = "Clause 6: Either party may terminate by serving a 2 months prior written notice."

    mock_ask_result = {
        "status": "answered",
        "text": "The notice period is 2 months in writing.",
        "quotes": ["Either party may terminate by serving a 2 months prior written notice."],
    }

    try:
        with patch("app.routes.ask.gemma_client.ask", new=AsyncMock(return_value=mock_ask_result)):
            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                payload = {
                    "question": "What is the notice period?",
                    "extracted_text": doc_text,
                }
                response = await client.post("/ask", json=payload)

                assert response.status_code == 200
                data = response.json()

                assert data["status"] == "answered"
                assert len(data["quotes"]) == 1
                assert "2 months prior written notice" in data["quotes"][0]
                assert "The notice period is 2 months" in data["text"]
    finally:
        settings.MOCK_MODE = original_mock
        settings.GEMMA_API_KEY = original_key


# 4. Unit Test: Tolerant JSON parsing & repair instruction retry
@pytest.mark.asyncio
async def test_gemma_client_malformed_json_repaired():
    client = GemmaClient(api_key="fake-key")

    malformed_raw = "Here is the result: { pages: [{'page': 1, 'text': unquoted} "
    repaired_raw = '{"pages": [{"page": 1, "text": "Repaired valid verbatim text"}]}'

    # First call fails tolerant JSON parsing; second call (repair instruction) succeeds
    mock_generate = AsyncMock(side_effect=[malformed_raw, repaired_raw])

    with patch.object(client, "generate_content", new=mock_generate):
        parts = [{"text": "transcribe prompt"}]
        raw, parsed = await client.generate_json(parts)

        assert mock_generate.call_count == 2
        assert isinstance(parsed, dict)
        assert parsed["pages"][0]["text"] == "Repaired valid verbatim text"


# 5. Unit & API Test: Upstream 429/500 returns friendly error without exposing keys
@pytest.mark.asyncio
async def test_upstream_429_returns_friendly_error():
    original_mock = settings.MOCK_MODE
    original_key = settings.GEMMA_API_KEY
    settings.MOCK_MODE = False
    settings.GEMMA_API_KEY = "secret-super-key-12345"

    try:
        with patch("app.routes.extract.gemma_client.transcribe", side_effect=GemmaError("AI rate limit reached. Please wait a moment and try again.", status_code=429)):
            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                files = [("files", ("page1.jpg", JPEG_SAMPLE, "image/jpeg"))]
                response = await client.post("/extract", files=files)

                assert response.status_code == 429
                data = response.json()
                assert "rate limit reached" in data["detail"].lower()
                # Ensure secret key is NEVER leaked in response
                assert "secret-super-key-12345" not in response.text
    finally:
        settings.MOCK_MODE = original_mock
        settings.GEMMA_API_KEY = original_key


@pytest.mark.asyncio
async def test_upstream_500_returns_friendly_error():
    original_mock = settings.MOCK_MODE
    original_key = settings.GEMMA_API_KEY
    settings.MOCK_MODE = False
    settings.GEMMA_API_KEY = "secret-super-key-12345"

    try:
        with patch("app.routes.extract.gemma_client.transcribe", side_effect=GemmaError("The AI service is temporarily unavailable. Please try again.", status_code=502)):
            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                files = [("files", ("page1.jpg", JPEG_SAMPLE, "image/jpeg"))]
                response = await client.post("/extract", files=files)

                assert response.status_code == 502
                data = response.json()
                assert "temporarily unavailable" in data["detail"].lower()
                assert "secret-super-key-12345" not in response.text
    finally:
        settings.MOCK_MODE = original_mock
        settings.GEMMA_API_KEY = original_key


# 6. Test file rejection: Oversized file (> 10 MB)
@pytest.mark.asyncio
async def test_extract_rejects_oversized_file():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # File exceeding 10 MB limit
        oversized_content = JPEG_SAMPLE + (b"\x00" * (10 * 1024 * 1024 + 100))
        files = [
            ("files", ("oversized.jpg", oversized_content, "image/jpeg"))
        ]
        response = await client.post("/extract", files=files)
        assert response.status_code == 400
        assert "exceeds the maximum allowed size" in response.json()["detail"].lower()


# 7. Test MOCK_MODE keeps mock behavior
@pytest.mark.asyncio
async def test_mock_mode_preserves_mock_responses():
    original_mock = settings.MOCK_MODE
    settings.MOCK_MODE = True

    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            files = [("files", ("page1.jpg", JPEG_SAMPLE, "image/jpeg"))]
            response = await client.post("/extract", files=files)

            assert response.status_code == 200
            data = response.json()
            assert len(data["terms"]) > 0
            assert len(data["flags"]) > 0
            assert len(data["pages"]) == 2
            assert "1. TERM & LOCK-IN:" in data["extracted_text"]
    finally:
        settings.MOCK_MODE = original_mock


# 8. Test QuotaNotAvailable distinct error and user-facing generic response
@pytest.mark.asyncio
async def test_quota_not_available_distinct_error():
    from app.services.gemma import QuotaNotAvailable

    err = QuotaNotAvailable()
    assert str(err) == "This API key's project has no quota. Create the key in a new AI Studio project or enable billing."
    assert err.status_code == 429
    assert err.detail == "AI rate limit reached. Please wait a moment and try again."

    # Test API handling of QuotaNotAvailable
    original_mock = settings.MOCK_MODE
    original_key = settings.GEMMA_API_KEY
    settings.MOCK_MODE = False
    settings.GEMMA_API_KEY = "test-key"

    try:
        with patch("app.routes.extract.gemma_client.transcribe", side_effect=QuotaNotAvailable()):
            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                files = [("files", ("page1.jpg", JPEG_SAMPLE, "image/jpeg"))]
                response = await client.post("/extract", files=files)

                assert response.status_code == 429
                data = response.json()
                # User-facing API stays generic and friendly
                assert data["detail"] == "AI rate limit reached. Please wait a moment and try again."
    finally:
        settings.MOCK_MODE = original_mock
        settings.GEMMA_API_KEY = original_key

