#!/usr/bin/env python3
"""
Diagnostic test script for Gemma 4 Google Gemini API integration.
Usage:
    python scripts/test_gemma.py path/to/image.jpg
"""

import sys
import os
import time
import base64
import json
import asyncio
import mimetypes
from pathlib import Path

# Add backend directory to sys.path so app modules import cleanly
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from app.core.config import settings
from app.services.gemma import GemmaClient
from app.services.prompts import TRANSCRIBE_SYSTEM_PROMPT


async def test_image(image_path: str):
    path = Path(image_path)
    if not path.is_file():
        print(f"Error: File not found: {image_path}", file=sys.stderr)
        sys.exit(1)

    # Determine MIME type
    mime_type, _ = mimetypes.guess_type(str(path))
    if not mime_type or not mime_type.startswith("image/"):
        ext = path.suffix.lower()
        if ext in (".jpg", ".jpeg"):
            mime_type = "image/jpeg"
        elif ext == ".png":
            mime_type = "image/png"
        else:
            mime_type = "image/jpeg"

    # Read and encode
    with open(path, "rb") as f:
        image_bytes = f.read()

    b64_data = base64.b64encode(image_bytes).decode("utf-8")

    masked_key = (
        f"{settings.GEMMA_API_KEY[:4]}...{settings.GEMMA_API_KEY[-4:]}"
        if len(settings.GEMMA_API_KEY) > 8
        else ("<not set>" if not settings.GEMMA_API_KEY else "***")
    )

    print("==================================================")
    print("  CLAUSY GEMMA 4 DIAGNOSTIC TEST")
    print("==================================================")
    print(f"Image File  : {path.name} ({len(image_bytes) / 1024:.1f} KB)")
    print(f"MIME Type   : {mime_type}")
    model_name = (os.getenv("GEMMA_MODEL") or settings.GEMMA_MODEL or "gemma-4-26b-a4b-it").strip()
    print(f"Model       : {model_name}")
    print(f"API Key     : {masked_key}")
    print("--------------------------------------------------")
    print("Sending transcription request to Gemini API...")

    client = GemmaClient(model=model_name)
    parts = [
        {"text": TRANSCRIBE_SYSTEM_PROMPT},
        {
            "inlineData": {
                "mimeType": mime_type,
                "data": b64_data,
            }
        },
    ]

    start_time = time.perf_counter()
    try:
        raw_response, parsed = await client.generate_json(parts)
        elapsed = time.perf_counter() - start_time

        print(f"\n[SUCCESS] Response received in {elapsed:.2f} seconds.\n")
        print("--- RAW RESPONSE ---")
        print(raw_response)
        print("\n--- PARSED JSON ---")
        print(json.dumps(parsed, indent=2, ensure_ascii=False))
        print("==================================================")

    except Exception as e:
        elapsed = time.perf_counter() - start_time
        print(f"\n[FAILURE] Request failed after {elapsed:.2f} seconds.", file=sys.stderr)
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)


def main():
    if len(sys.argv) < 2:
        print("Usage: python scripts/test_gemma.py <path/to/image.jpg>")
        sys.exit(1)

    asyncio.run(test_image(sys.argv[1]))


if __name__ == "__main__":
    main()
