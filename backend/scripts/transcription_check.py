#!/usr/bin/env python3
"""
Transcription Check for Step 2 of Task 7.
Runs transcription on clean/page1.png and messy/page1.jpg.
Compares with ground truth from tests/data/sample_pages.json.
Reports:
  - Latency
  - difflib.SequenceMatcher similarity ratio
  - Presence of exact key values: 18,000 / 90,000 / 6 months / 2 months / 2,200 / 18%
"""

import os
import sys
import json
import time
import base64
import difflib
import asyncio
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))

from app.core.config import settings
from app.services.gemma import GemmaClient
from app.services.prompts import TRANSCRIBE_SYSTEM_PROMPT

DATA_FILE = BACKEND_DIR / "tests" / "data" / "sample_pages.json"
CLEAN_PAGE1 = BACKEND_DIR / "tests" / "assets" / "clean" / "page1.png"
MESSY_PAGE1 = BACKEND_DIR / "tests" / "assets" / "messy" / "page1.jpg"

EXACT_VALUES_TO_CHECK = [
    "18,000",
    "90,000",
    "6 months",
    "2 months",
    "2,200",
    "18%",
]


async def run_single_transcription(image_path: Path, model_name: str) -> dict:
    with open(image_path, "rb") as f:
        img_bytes = f.read()

    mime_type = "image/png" if image_path.suffix.lower() == ".png" else "image/jpeg"
    b64_data = base64.b64encode(img_bytes).decode("utf-8")

    client = GemmaClient(model=model_name)
    parts = [
        {"text": TRANSCRIBE_SYSTEM_PROMPT},
        {"inlineData": {"mimeType": mime_type, "data": b64_data}},
    ]

    start = time.perf_counter()
    try:
        raw_resp, parsed = await client.generate_json(parts)
        latency = time.perf_counter() - start
        
        # Extract transcribed text
        pages = parsed.get("pages", []) if isinstance(parsed, dict) else []
        if pages and isinstance(pages[0], dict):
            transcribed_text = pages[0].get("text", "")
        else:
            transcribed_text = str(parsed)

        return {
            "success": True,
            "latency": latency,
            "raw": raw_resp,
            "text": transcribed_text,
            "error": None,
        }
    except Exception as e:
        return {
            "success": False,
            "latency": None,
            "raw": None,
            "text": "",
            "error": str(e),
        }


def evaluate_transcription(ground_truth: str, transcribed: str) -> dict:
    matcher = difflib.SequenceMatcher(None, ground_truth, transcribed)
    similarity = matcher.ratio()

    value_matches = {}
    for val in EXACT_VALUES_TO_CHECK:
        value_matches[val] = val in transcribed

    return {
        "similarity_ratio": similarity,
        "value_matches": value_matches,
    }


async def main():
    model_name = (os.getenv("GEMMA_MODEL") or settings.GEMMA_MODEL or "gemma-4-26b-a4b-it").strip()
    print("==================================================")
    print(f"  TRANSCRIPTION CHECK (Model: {model_name})")
    print("==================================================")

    with open(DATA_FILE, "r", encoding="utf-8") as f:
        ground_truth_pages = json.load(f)
    page1_gt = ground_truth_pages[0]["text"]

    any_failed = False
    for name, img_path in [("Clean Page 1 (PNG)", CLEAN_PAGE1), ("Messy Page 1 (JPG)", MESSY_PAGE1)]:
        print(f"\nEvaluating: {name} [{img_path.name}]")
        res = await run_single_transcription(img_path, model_name)

        if not res["success"]:
            print(f"  FAILED: {res['error']}")
            any_failed = True
            continue

        eval_res = evaluate_transcription(page1_gt, res["text"])
        print(f"  Latency: {res['latency']:.2f}s")
        print(f"  Ground Truth Similarity: {eval_res['similarity_ratio']:.2%}")
        print("  Key Value Detection:")
        for val, found in eval_res["value_matches"].items():
            status = "FOUND" if found else "NOT FOUND"
            print(f"    - {val:10}: {status}")

    if any_failed:
        print("\nTranscription check failed.", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
