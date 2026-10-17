#!/usr/bin/env python3
"""
Diagnostic reproduction script for testing POST /extract directly with multipart form-data,
matching frontend/lib/api.ts extract() behavior.
"""

import os
import sys
import glob
import httpx
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent
CLEAN_PNG = BACKEND_DIR / "tests" / "assets" / "clean" / "page1.png"
MESSY_JPG = BACKEND_DIR / "tests" / "assets" / "messy" / "page1.jpg"
URL = "http://127.0.0.1:8000/extract"


def get_latest_backend_log():
    log_dir = Path(os.path.expanduser("~/.gemini/antigravity/brain"))
    task_logs = list(log_dir.glob("*/.system_generated/tasks/task-*.log"))
    if not task_logs:
        return ""
    latest = max(task_logs, key=lambda p: p.stat().st_mtime)
    try:
        with open(latest, "r", encoding="utf-8", errors="ignore") as f:
            lines = f.readlines()
            return "".join(lines[-10:])
    except Exception:
        return ""


def test_upload(file_path: Path, mime_type: str):
    print("=" * 60)
    print(f"Testing upload: {file_path.name} ({mime_type})")
    print(f"File size: {file_path.stat().st_size} bytes")
    print("=" * 60)

    if not file_path.is_file():
        print(f"ERROR: File not found: {file_path}")
        return

    with open(file_path, "rb") as f:
        file_bytes = f.read()

    # Form-data multipart identical to frontend: name="files", filename=..., content_type=...
    files = [("files", (file_path.name, file_bytes, mime_type))]

    try:
        with httpx.Client(timeout=90.0) as client:
            response = client.post(URL, files=files)

        print(f"HTTP Status: {response.status_code}")
        try:
            print("Response JSON Body:")
            print(response.json())
        except Exception:
            print("Response Raw Body:")
            print(response.text[:500])

    except Exception as e:
        print(f"Request exception: {e}")

    print("\n--- Backend Task Log (recent) ---")
    print(get_latest_backend_log())
    print("\n")


def main():
    print("Running Upload Check reproduction against:", URL)
    print("a) Clean PNG:")
    test_upload(CLEAN_PNG, "image/png")
    print("b) Phone-style JPG:")
    test_upload(MESSY_JPG, "image/jpeg")


if __name__ == "__main__":
    main()
