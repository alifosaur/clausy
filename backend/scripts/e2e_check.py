#!/usr/bin/env python3
"""
End-to-end check script for Task 7.
Starts uvicorn backend with MOCK_MODE=false and GEMMA_MODEL=<target_model>, then runs:
  1. POST /extract on 3 clean pages (PNG)
  2. POST /extract on 3 messy pages (JPG)
  3. POST /ask on 4 questions (2 answerable, 2 refusal) with 5s delay between calls
Collects timing, verification rates, term values, and refusal accuracy.
"""

import os
import sys
import time
import json
import asyncio
import subprocess
from pathlib import Path
import httpx

BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))

from app.core.config import settings

CLEAN_DIR = BACKEND_DIR / "tests" / "assets" / "clean"
MESSY_DIR = BACKEND_DIR / "tests" / "assets" / "messy"
DATA_FILE = BACKEND_DIR / "tests" / "data" / "sample_pages.json"

EXPECTED_TERMS = {
    "rent": "18,000",
    "deposit": "90,000",
    "lock_in": "6",
    "notice_period": "2",
    "penalties": "18%",
    "maintenance": "2,200",
}

QUESTIONS_TO_TEST = [
    {"q": "Is my deposit refundable?", "expected": "answered", "type": "answerable"},
    {"q": "What is the notice period?", "expected": "answered", "type": "answerable"},
    {"q": "Can my landlord evict me tomorrow?", "expected": "not_found", "type": "not_answerable"},
    {"q": "Can I keep a pet?", "expected": "not_found", "type": "not_answerable"},
]


class E2ERunner:
    def __init__(self, model_name: str, port: int = 8000):
        self.model_name = model_name
        self.port = port
        self.base_url = f"http://127.0.0.1:{port}"
        self.proc: subprocess.Popen | None = None
        self.results: dict = {
            "model": model_name,
            "clean_extract": {},
            "messy_extract": {},
            "ask_questions": [],
            "errors": [],
        }

    def start_server(self):
        env = os.environ.copy()
        env["MOCK_MODE"] = "false"
        env["GEMMA_MODEL"] = self.model_name
        env["PYTHONUNBUFFERED"] = "1"

        print(f"\nStarting Uvicorn API server on port {self.port} with GEMMA_MODEL={self.model_name}...")
        python_exe = sys.executable

        self.proc = subprocess.Popen(
            [python_exe, "-m", "uvicorn", "app.main:app", "--port", str(self.port), "--host", "127.0.0.1"],
            cwd=str(BACKEND_DIR),
            env=env,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
        )

    def stop_server(self):
        if self.proc:
            print("\nStopping Uvicorn API server...")
            self.proc.terminate()
            try:
                self.proc.wait(timeout=5)
            except subprocess.TimeoutExpired:
                self.proc.kill()
            self.proc = None

    async def wait_for_health(self, timeout: float = 15.0):
        start = time.perf_counter()
        async with httpx.AsyncClient() as client:
            while time.perf_counter() - start < timeout:
                try:
                    r = await client.get(f"{self.base_url}/health", timeout=1.0)
                    if r.status_code == 200:
                        print("Server is healthy and ready.")
                        return True
                except Exception:
                    pass
                await asyncio.sleep(0.5)
        raise RuntimeError("Server failed to become healthy within timeout.")

    async def run_extract(self, files_dir: Path, is_png: bool = True) -> dict:
        ext = "png" if is_png else "jpg"
        mime = "image/png" if is_png else "image/jpeg"
        file_paths = [files_dir / f"page{i}.{ext}" for i in range(1, 4)]

        multipart_files = []
        for p in file_paths:
            with open(p, "rb") as f:
                content = f.read()
            multipart_files.append(("files", (p.name, content, mime)))

        start = time.perf_counter()
        async with httpx.AsyncClient(timeout=120.0) as client:
            r = await client.post(f"{self.base_url}/extract", files=multipart_files)
        latency = time.perf_counter() - start

        if r.status_code != 200:
            err_msg = f"HTTP {r.status_code}: {r.text}"
            self.results["errors"].append(err_msg)
            return {
                "success": False,
                "latency": latency,
                "status_code": r.status_code,
                "error": err_msg,
                "terms": [],
                "flags": [],
                "extracted_text": "",
            }

        data = r.json()
        terms = data.get("terms", [])
        flags = data.get("flags", [])
        extracted_text = data.get("extracted_text", "")

        verified_terms_count = sum(1 for t in terms if t.get("verified"))

        # Value comparison
        term_comparisons = {}
        for t in terms:
            k = t.get("key")
            val = t.get("value", "")
            expected = EXPECTED_TERMS.get(k, "")
            matches = expected in val.replace(",", "") or expected in val
            term_comparisons[k] = {
                "value": val,
                "expected": expected,
                "matches": matches,
                "verified": t.get("verified", False),
            }

        return {
            "success": True,
            "latency": latency,
            "status_code": 200,
            "total_terms": len(terms),
            "verified_terms": verified_terms_count,
            "total_flags": len(flags),
            "term_comparisons": term_comparisons,
            "extracted_text": extracted_text,
            "raw_response": data,
        }

    async def run_ask(self, question: str, expected_type: str, extracted_text: str) -> dict:
        payload = {
            "question": question,
            "extracted_text": extracted_text,
        }

        start = time.perf_counter()
        async with httpx.AsyncClient(timeout=60.0) as client:
            r = await client.post(f"{self.base_url}/ask", json=payload)
        latency = time.perf_counter() - start

        if r.status_code != 200:
            err_msg = f"HTTP {r.status_code}: {r.text}"
            self.results["errors"].append(err_msg)
            return {
                "question": question,
                "success": False,
                "latency": latency,
                "status_code": r.status_code,
                "error": err_msg,
            }

        data = r.json()
        status = data.get("status")
        quotes = data.get("quotes", [])
        text = data.get("text", "")

        behavior_correct = (status == expected_type)

        return {
            "question": question,
            "expected_type": expected_type,
            "actual_status": status,
            "behavior_correct": behavior_correct,
            "quotes_count": len(quotes),
            "quotes": quotes,
            "text": text,
            "latency": latency,
            "success": True,
        }

    async def execute_suite(self) -> dict:
        try:
            self.start_server()
            await self.wait_for_health()

            # 1. Clean Extract
            print("\n--- 1. POST /extract with Clean Pages (PNG) ---")
            clean_res = await self.run_extract(CLEAN_DIR, is_png=True)
            self.results["clean_extract"] = clean_res
            print(f"Clean Extract: Success={clean_res.get('success')}, Latency={clean_res.get('latency', 0):.2f}s")
            if clean_res.get("success"):
                print(f"  Terms: {clean_res.get('total_terms')} (Verified: {clean_res.get('verified_terms')}), Flags: {clean_res.get('total_flags')}")
            else:
                print(f"  Error: {clean_res.get('error')}")

            # Rate limit backoff (5s)
            print("Waiting 5s to respect rate limits...")
            await asyncio.sleep(5.0)

            # 2. Messy Extract
            print("\n--- 2. POST /extract with Messy Pages (JPG) ---")
            messy_res = await self.run_extract(MESSY_DIR, is_png=False)
            self.results["messy_extract"] = messy_res
            print(f"Messy Extract: Success={messy_res.get('success')}, Latency={messy_res.get('latency', 0):.2f}s")
            if messy_res.get("success"):
                print(f"  Terms: {messy_res.get('total_terms')} (Verified: {messy_res.get('verified_terms')}), Flags: {messy_res.get('total_flags')}")
            else:
                print(f"  Error: {messy_res.get('error')}")

            # Rate limit backoff (5s)
            print("Waiting 5s to respect rate limits...")
            await asyncio.sleep(5.0)

            # 3. Ask Questions
            print("\n--- 3. POST /ask Questions ---")
            context_text = clean_res.get("extracted_text") or messy_res.get("extracted_text")
            if not context_text:
                # Fallback to ground truth if extract failed due to rate limits
                with open(DATA_FILE, "r", encoding="utf-8") as f:
                    gt_pages = json.load(f)
                context_text = "\n\n".join(p["text"] for p in gt_pages)

            for item in QUESTIONS_TO_TEST:
                print(f"Asking: '{item['q']}' ({item['type']})...")
                ask_res = await self.run_ask(item["q"], item["expected"], context_text)
                self.results["ask_questions"].append(ask_res)
                print(f"  Status={ask_res.get('actual_status')}, Correct={ask_res.get('behavior_correct')}, Latency={ask_res.get('latency', 0):.2f}s")
                print("Waiting 5s to respect rate limits...")
                await asyncio.sleep(5.0)

        finally:
            self.stop_server()

        return self.results


async def main():
    model_name = (os.getenv("GEMMA_MODEL") or settings.GEMMA_MODEL or "gemma-4-26b-a4b-it").strip()
    if len(sys.argv) > 1:
        model_name = sys.argv[1]

    runner = E2ERunner(model_name=model_name)
    results = await runner.execute_suite()

    # Save summary json
    out_file = BACKEND_DIR / "tests" / "reports" / f"e2e_{model_name.replace('-', '_')}.json"
    out_file.parent.mkdir(parents=True, exist_ok=True)
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)
    print(f"\nE2E check finished. Results saved to: {out_file.name}")


if __name__ == "__main__":
    asyncio.run(main())
