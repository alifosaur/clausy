import io
import json
import base64
from pathlib import Path
from unittest.mock import patch
import pytest
from PIL import Image
from fastapi.testclient import TestClient
from fastapi import HTTPException
import httpx

from app.main import app
from app.core.config import settings
from app.core.ratelimit import limiter
from app.core.image_proc import optimize_image

ASSETS_DIR = Path(__file__).parent / "assets"
CLEAN_PNG_PATH = ASSETS_DIR / "clean" / "page1.png"
MESSY_JPG_PATH = ASSETS_DIR / "messy" / "page1.jpg"


def _create_mock_response(status_code: int, data: dict) -> httpx.Response:
    """
    Creates an HTTP response compatible with both OpenAI style ('choices')
    and Gemini style ('candidates').
    """
    json_str = json.dumps(data)
    combined = {
        "choices": [{"message": {"content": json_str}}],
        "candidates": [{"content": {"parts": [{"text": json_str}]}}],
    }
    return httpx.Response(
        status_code=status_code,
        content=json.dumps(combined).encode("utf-8"),
        headers={"content-type": "application/json"},
        request=httpx.Request("POST", "https://api.example.com/endpoint"),
    )


def test_extract_real_png_and_jpg_at_http_boundary():
    """
    Sends real PNG and JPG files through /extract route using FastAPI TestClient
    with Gemma client mocked at the HTTP boundary (httpx.AsyncClient.post).
    Verifies that the uploaded bytes sent to the model are non-empty.
    """
    assert CLEAN_PNG_PATH.exists(), f"Missing clean PNG asset at {CLEAN_PNG_PATH}"
    assert MESSY_JPG_PATH.exists(), f"Missing messy JPG asset at {MESSY_JPG_PATH}"

    with open(CLEAN_PNG_PATH, "rb") as f:
        png_bytes = f.read()
    with open(MESSY_JPG_PATH, "rb") as f:
        jpg_bytes = f.read()

    assert len(png_bytes) > 0
    assert len(jpg_bytes) > 0

    mock_doc_text = (
        "RENTAL AGREEMENT\n"
        "The monthly rent for the schedule premises shall be Rs. 26,500/- per month.\n"
        "The Lessee has paid a security deposit of Rs. 1,59,000/- only.\n"
        "The society maintenance charges are Rs. 3,500/- payable monthly.\n"
        "Painting charges of Rs. 8,000/- will be deducted upon vacating."
    )

    mock_transcribe_data = {
        "pages": [
            {"page": 1, "text": mock_doc_text},
            {"page": 2, "text": mock_doc_text},
        ]
    }

    mock_analyze_data = {
        "terms": [
            {
                "key": "rent",
                "label": "Monthly Rent",
                "value": "₹26,500",
                "quote": "The monthly rent for the schedule premises shall be Rs. 26,500/- per month.",
                "page": 1,
            },
            {
                "key": "deposit",
                "label": "Security Deposit",
                "value": "₹1,59,000",
                "quote": "The Lessee has paid a security deposit of Rs. 1,59,000/- only.",
                "page": 1,
            },
        ],
        "flags": [],
    }

    captured_http_requests = []

    async def mock_post(self, url, *args, **kwargs):
        payload = kwargs.get("json", {})
        captured_http_requests.append({"url": str(url), "payload": payload})
        payload_str = json.dumps(payload)
        if "TRANSCRIBE" in payload_str or "inlineData" in payload_str or "image_url" in payload_str:
            return _create_mock_response(200, mock_transcribe_data)
        return _create_mock_response(200, mock_analyze_data)

    original_mock = settings.MOCK_MODE
    original_key = settings.GEMMA_API_KEY
    settings.MOCK_MODE = False
    settings.GEMMA_API_KEY = "test-key"

    try:
        with patch.object(httpx.AsyncClient, "post", new=mock_post):
            client = TestClient(app)
            files = [
                ("files", ("page1.png", png_bytes, "image/png")),
                ("files", ("page2.jpg", jpg_bytes, "image/jpeg")),
            ]
            response = client.post("/extract", files=files)

            assert response.status_code == 200, f"Extract failed: {response.text}"
            data = response.json()
            assert "terms" in data
            assert len(data["terms"]) == 2
            # Both terms should be verified
            assert data["terms"][0]["verified"] is True
            assert data["terms"][1]["verified"] is True

            # Verify timing header is returned
            assert "x-timing-ms" in response.headers or "X-Timing-Ms" in response.headers
            timing_hdr = response.headers.get("x-timing-ms") or response.headers.get("X-Timing-Ms")
            timing = json.loads(timing_hdr)
            assert "transcribe" in timing
            assert "analyze" in timing
            assert "verify" in timing
            assert "total" in timing

            # Verify that uploaded bytes sent to the model were non-empty
            assert len(captured_http_requests) >= 2, "Expected at least transcribe and analyze calls"
            transcribe_req = captured_http_requests[0]
            payload = transcribe_req["payload"]

            payload_str = json.dumps(payload)
            # Check for base64 image data in either format
            assert "data:image/jpeg;base64," in payload_str or "inlineData" in payload_str

            # Check that extracted images had non-empty payload
            if "messages" in payload:
                # OpenAI format
                content = payload["messages"][0]["content"]
                image_parts = [p for p in content if p.get("type") == "image_url"]
                assert len(image_parts) > 0
                for img_p in image_parts:
                    url_str = img_p["image_url"]["url"]
                    b64_part = url_str.split(",")[-1]
                    assert len(b64_part) > 0
                    assert len(base64.b64decode(b64_part)) > 0
            else:
                # Gemini format
                parts = payload["contents"][0]["parts"]
                image_parts = [p for p in parts if "inlineData" in p]
                assert len(image_parts) > 0
                for img_p in image_parts:
                    b64_part = img_p["inlineData"]["data"]
                    assert len(b64_part) > 0
                    assert len(base64.b64decode(b64_part)) > 0
    finally:
        settings.MOCK_MODE = original_mock
        settings.GEMMA_API_KEY = original_key


def test_rate_limiter_keying_on_x_forwarded_for():
    """
    Verifies that rate limiter keys on X-Forwarded-For when proxy headers are present.
    IP1 exhausts quota and receives 429, while IP2 retains quota and receives 200.
    """
    original_limiter_enabled = limiter.enabled
    original_mock = settings.MOCK_MODE
    limiter.enabled = True
    settings.MOCK_MODE = True

    try:
        client = TestClient(app)
        ip_1 = "198.51.100.101"
        ip_2 = "198.51.100.102"

        with open(CLEAN_PNG_PATH, "rb") as f:
            png_bytes = f.read()

        # /extract is limited to 10/minute
        # Send 10 requests from ip_1
        for i in range(10):
            files = [("files", ("page1.png", png_bytes, "image/png"))]
            res = client.post("/extract", files=files, headers={"X-Forwarded-For": ip_1})
            assert res.status_code == 200, f"Request {i+1} from ip_1 failed: {res.text}"

        # 11th request from ip_1 should be rate limited (429)
        files = [("files", ("page1.png", png_bytes, "image/png"))]
        res_ip1_exceeded = client.post("/extract", files=files, headers={"X-Forwarded-For": ip_1})
        assert res_ip1_exceeded.status_code == 429, f"Expected 429 for rate-limited IP1, got {res_ip1_exceeded.status_code}"

        # Request from ip_2 should succeed (200) because it is a distinct client IP
        files = [("files", ("page1.png", png_bytes, "image/png"))]
        res_ip2 = client.post("/extract", files=files, headers={"X-Forwarded-For": ip_2})
        assert res_ip2.status_code == 200, "Expected 200 for distinct IP2"
    finally:
        limiter.enabled = original_limiter_enabled
        settings.MOCK_MODE = original_mock


def test_image_proc_rejects_exceeding_pixel_limit():
    """
    Verifies that images exceeding 40 million pixels are rejected with a 400 status.
    """
    buf = io.BytesIO()
    img = Image.new("RGB", (7000, 6000), color="white")
    img.save(buf, format="JPEG")
    large_image_bytes = buf.getvalue()

    with pytest.raises(HTTPException) as exc_info:
        optimize_image(large_image_bytes)
    assert exc_info.value.status_code == 400
    assert "40 million pixels" in str(exc_info.value.detail)


def test_image_proc_rejects_corrupt_image():
    """
    Verifies that invalid or corrupt image bytes raise a 400 status code.
    """
    corrupt_bytes = b"\xff\xd8\xff\xe0CORRUPT_NOT_AN_IMAGE_DATA_123456"
    with pytest.raises(HTTPException) as exc_info:
        optimize_image(corrupt_bytes)
    assert exc_info.value.status_code == 400
    assert "Invalid or corrupt image" in str(exc_info.value.detail)
