import json
import pytest
import httpx
from unittest.mock import AsyncMock, patch

from app.services.gemma import (
    GemmaClient,
    GemmaError,
    ApiKeyRejected,
    ProviderCreditsExhausted,
)


@pytest.mark.asyncio
async def test_openai_style_success_json_in_string():
    """Test successful OpenAI-style response with JSON returned as a string."""
    client = GemmaClient(
        api_style="openai",
        api_key="mock-openrouter-key",
        api_url="https://openrouter.ai/api/v1",
        model="google/gemma-4-26b-a4b-it",
    )

    mock_resp_data = {
        "id": "gen-123",
        "choices": [
            {
                "message": {
                    "role": "assistant",
                    "content": json.dumps({"pages": [{"page": 1, "text": "Clause 1: Rent is Rs 18,000"}]}),
                }
            }
        ],
    }

    mock_response = httpx.Response(
        status_code=200,
        json=mock_resp_data,
        request=httpx.Request("POST", "https://openrouter.ai/api/v1/chat/completions"),
    )

    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = mock_response

        parts = [{"text": "Transcribe the document"}]
        raw, parsed = await client.generate_json(parts)

        assert "Clause 1: Rent is Rs 18,000" in raw
        assert parsed["pages"][0]["page"] == 1
        assert parsed["pages"][0]["text"] == "Clause 1: Rent is Rs 18,000"

        # Verify call headers and payload
        assert mock_post.call_count == 1
        call_kwargs = mock_post.call_args.kwargs
        assert call_kwargs["headers"]["Authorization"] == "Bearer mock-openrouter-key"
        assert call_kwargs["headers"]["HTTP-Referer"] == "https://github.com/alifosaur/clausy"
        assert call_kwargs["headers"]["X-Title"] == "Clausy"
        assert call_kwargs["json"]["model"] == "google/gemma-4-26b-a4b-it"
        assert call_kwargs["json"]["temperature"] == 0
        assert call_kwargs["json"]["response_format"] == {"type": "json_object"}


@pytest.mark.asyncio
async def test_openai_style_content_as_list_of_parts():
    """Test OpenAI-style response when message content is returned as a list of parts."""
    client = GemmaClient(
        api_style="openai",
        api_key="mock-openrouter-key",
        api_url="https://openrouter.ai/api/v1",
    )

    mock_resp_data = {
        "choices": [
            {
                "message": {
                    "role": "assistant",
                    "content": [
                        {"type": "text", "text": '{"terms": [{"key": "rent", '},
                        {"type": "text", "text": '"value": "18,000"}]}'},
                    ],
                }
            }
        ]
    }

    mock_response = httpx.Response(
        status_code=200,
        json=mock_resp_data,
        request=httpx.Request("POST", "https://openrouter.ai/api/v1/chat/completions"),
    )

    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = mock_response

        parts = [{"text": "Analyze terms"}]
        _, parsed = await client.generate_json(parts)

        assert isinstance(parsed, dict)
        assert parsed["terms"][0]["key"] == "rent"
        assert parsed["terms"][0]["value"] == "18,000"


@pytest.mark.asyncio
async def test_openai_style_response_format_rejected_then_retried():
    """Test that if 400 is returned with response_format, client immediately retries without it."""
    client = GemmaClient(
        api_style="openai",
        api_key="mock-openrouter-key",
        api_url="https://openrouter.ai/api/v1",
    )

    resp_400 = httpx.Response(
        status_code=400,
        json={"error": {"message": "response_format is not supported for this model"}},
        request=httpx.Request("POST", "https://openrouter.ai/api/v1/chat/completions"),
    )

    success_content = json.dumps({"status": "not_found", "text": "Not found in this agreement.", "quotes": []})
    resp_200 = httpx.Response(
        status_code=200,
        json={"choices": [{"message": {"role": "assistant", "content": success_content}}]},
        request=httpx.Request("POST", "https://openrouter.ai/api/v1/chat/completions"),
    )

    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.side_effect = [resp_400, resp_200]

        parts = [{"text": "Ask question"}]
        _, parsed = await client.generate_json(parts)

        assert parsed["status"] == "not_found"
        assert mock_post.call_count == 2

        # First attempt had response_format
        first_payload = mock_post.call_args_list[0].kwargs["json"]
        assert "response_format" in first_payload

        # Second attempt retried without response_format
        second_payload = mock_post.call_args_list[1].kwargs["json"]
        assert "response_format" not in second_payload
        assert client.supports_json_object is False


@pytest.mark.asyncio
async def test_openai_style_401_and_403_mapped_to_api_key_rejected():
    """Test 401 and 403 map to ApiKeyRejected with internal hint and generic user message."""
    client = GemmaClient(
        api_style="openai",
        api_key="invalid-key",
        api_url="https://openrouter.ai/api/v1",
    )

    resp_401 = httpx.Response(
        status_code=401,
        json={"error": {"message": "Invalid API key provided", "code": 401}},
        request=httpx.Request("POST", "https://openrouter.ai/api/v1/chat/completions"),
    )

    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = resp_401

        with pytest.raises(ApiKeyRejected) as exc_info:
            await client.generate_content([{"text": "hello"}])

        err = exc_info.value
        # Internal hint for scripts / logs
        assert "API key rejected" in str(err)
        assert err.internal_reason == "API key rejected"
        # User-facing detail stays generic and does not leak provider payload or key
        assert err.detail == "Authentication failed with the AI service. Please check server configuration."
        assert "invalid-key" not in err.detail
        assert err.status_code == 401

    resp_403 = httpx.Response(
        status_code=403,
        json={"error": {"message": "Forbidden", "code": 403}},
        request=httpx.Request("POST", "https://openrouter.ai/api/v1/chat/completions"),
    )

    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = resp_403

        with pytest.raises(ApiKeyRejected) as exc_info:
            await client.generate_content([{"text": "hello"}])

        assert "API key rejected" in str(exc_info.value)
        assert exc_info.value.status_code == 403


@pytest.mark.asyncio
async def test_openai_style_402_mapped_to_provider_credits_exhausted():
    """Test 402 maps to ProviderCreditsExhausted with internal hint and generic user message."""
    client = GemmaClient(
        api_style="openai",
        api_key="valid-key-no-credits",
        api_url="https://openrouter.ai/api/v1",
    )

    resp_402 = httpx.Response(
        status_code=402,
        json={"error": {"message": "Insufficient credits", "code": 402}},
        request=httpx.Request("POST", "https://openrouter.ai/api/v1/chat/completions"),
    )

    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = resp_402

        with pytest.raises(ProviderCreditsExhausted) as exc_info:
            await client.generate_content([{"text": "hello"}])

        err = exc_info.value
        assert "Provider credits exhausted" in str(err)
        assert err.internal_reason == "Provider credits exhausted"
        assert err.detail == "AI service credits exhausted. Please try again later."
        assert err.status_code == 402


@pytest.mark.asyncio
async def test_openai_style_empty_content_handled():
    """Test that empty string, empty list, or None content raises a friendly GemmaError."""
    client = GemmaClient(
        api_style="openai",
        api_key="mock-key",
        api_url="https://openrouter.ai/api/v1",
    )

    # Case 1: content is empty string
    resp_empty_str = httpx.Response(
        status_code=200,
        json={"choices": [{"message": {"role": "assistant", "content": "   "}}]},
        request=httpx.Request("POST", "https://openrouter.ai/api/v1/chat/completions"),
    )

    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = resp_empty_str
        with pytest.raises(GemmaError) as exc_info:
            await client.generate_content([{"text": "hello"}])
        assert exc_info.value.status_code == 502
        assert "Empty response content" in exc_info.value.detail

    # Case 2: content is None
    resp_none = httpx.Response(
        status_code=200,
        json={"choices": [{"message": {"role": "assistant", "content": None}}]},
        request=httpx.Request("POST", "https://openrouter.ai/api/v1/chat/completions"),
    )

    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = resp_none
        with pytest.raises(GemmaError) as exc_info:
            await client.generate_content([{"text": "hello"}])
        assert exc_info.value.status_code == 502
        assert "Empty response content" in exc_info.value.detail

    # Case 3: content is empty list of parts
    resp_empty_list = httpx.Response(
        status_code=200,
        json={"choices": [{"message": {"role": "assistant", "content": []}}]},
        request=httpx.Request("POST", "https://openrouter.ai/api/v1/chat/completions"),
    )

    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = resp_empty_list
        with pytest.raises(GemmaError) as exc_info:
            await client.generate_content([{"text": "hello"}])
        assert exc_info.value.status_code == 502
        assert "Empty response content" in exc_info.value.detail


@pytest.mark.asyncio
async def test_openai_style_multimodal_content_conversion():
    """Test that image parts are properly converted into OpenAI data URL image_url format."""
    client = GemmaClient(
        api_style="openai",
        api_key="mock-key",
        api_url="https://openrouter.ai/api/v1",
    )

    parts = [
        {"text": "Transcribe this page"},
        {
            "inlineData": {
                "mimeType": "image/png",
                "data": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
            }
        },
    ]

    mock_resp = httpx.Response(
        status_code=200,
        json={"choices": [{"message": {"role": "assistant", "content": '{"pages": []}'}}]},
        request=httpx.Request("POST", "https://openrouter.ai/api/v1/chat/completions"),
    )

    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = mock_resp
        await client.generate_content(parts)

        call_json = mock_post.call_args.kwargs["json"]
        user_content = call_json["messages"][0]["content"]

        assert len(user_content) == 2
        assert user_content[0] == {"type": "text", "text": "Transcribe this page"}
        assert user_content[1]["type"] == "image_url"
        assert user_content[1]["image_url"]["url"].startswith("data:image/png;base64,iVBORw0KG")
