"""
Diagnostic script for Sarvam AI integration.
Calls REAL Sarvam API through app.services.sarvam.sarvam_client.
Never prints, logs or leaks secret keys.
"""

import asyncio
import os
import sys
import tempfile
import base64
import wave

# Ensure UTF-8 stdout on Windows console
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.config import settings
from app.services.sarvam import sarvam_client, SarvamError


async def run_diagnostics():
    print("=" * 60)
    print("SARVAM AI LIVE DIAGNOSTIC CHECK")
    print("=" * 60)

    # 1. Configuration check (non-secret values only)
    has_key = bool(settings.SARVAM_API_KEY)
    key_len = len(settings.SARVAM_API_KEY) if settings.SARVAM_API_KEY else 0
    print(f"SARVAM_API_KEY: {'present' if has_key else 'absent'} (length: {key_len})")
    print(f"SARVAM_ENABLED: {settings.SARVAM_ENABLED}")
    print(f"SARVAM_TRANSLATE_MODEL: {settings.SARVAM_TRANSLATE_MODEL}")
    print(f"SARVAM_TTS_MODEL: {settings.SARVAM_TTS_MODEL}")
    print(f"SARVAM_STT_MODEL: {settings.SARVAM_STT_MODEL}")
    print("-" * 60)

    if not has_key:
        print("[FAIL] SARVAM_API_KEY is not set. Stopping diagnostic.")
        return

    # a) Translate "What is the deposit?" to Kannada (kn) and to Hindi (hi)
    test_text = "What is the deposit?"
    print(f"\n[STEP A] Translating: \"{test_text}\"")

    kn_text = ""
    hi_text = ""
    try:
        kn_text = await sarvam_client.translate_single(test_text, "kn")
        print(f"  -> Kannada (kn): SUCCESS => \"{kn_text}\"")
    except Exception as e:
        status = getattr(e, "status_code", getattr(e, "status", "N/A"))
        detail = getattr(e, "detail", str(e))
        print(f"  -> Kannada (kn): FAILED => status: {status}, error: {detail}")

    try:
        hi_text = await sarvam_client.translate_single(test_text, "hi")
        print(f"  -> Hindi (hi): SUCCESS => \"{hi_text}\"")
    except Exception as e:
        status = getattr(e, "status_code", getattr(e, "status", "N/A"))
        detail = getattr(e, "detail", str(e))
        print(f"  -> Hindi (hi): FAILED => status: {status}, error: {detail}")

    # b) Text-to-speech of Kannada result, saving audio file to temp path
    tts_input = kn_text if kn_text else "ಠೇವಣಿ ಎಷ್ಟು?"
    print(f"\n[STEP B] Text-to-speech (Kannada) of: \"{tts_input}\"")

    temp_wav_path = None
    try:
        tts_result = await sarvam_client.speak(tts_input, "kn")
        audio_b64 = tts_result.get("audio", "")
        content_type = tts_result.get("content_type", "audio/wav")

        audio_bytes = base64.b64decode(audio_b64)
        file_size = len(audio_bytes)

        # Save to temp WAV file
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tf:
            tf.write(audio_bytes)
            temp_wav_path = tf.name

        # Read WAV duration and sample rate
        duration_sec = 0.0
        sample_rate = 0
        try:
            with wave.open(temp_wav_path, "rb") as wf:
                sample_rate = wf.getframerate()
                frames = wf.getnframes()
                duration_sec = frames / float(sample_rate)
        except Exception as we:
            print(f"  Note: Could not parse WAV header: {we}")

        print(f"  -> TTS: SUCCESS")
        print(f"     Temp path: {temp_wav_path}")
        print(f"     Size: {file_size} bytes ({file_size / 1024:.1f} KB)")
        print(f"     Format: {content_type} ({sample_rate} Hz)")
        print(f"     Duration: {duration_sec:.2f} seconds")
    except Exception as e:
        status = getattr(e, "status_code", getattr(e, "status", "N/A"))
        detail = getattr(e, "detail", str(e))
        print(f"  -> TTS: FAILED => status: {status}, error: {detail}")

    # c) Speech-to-text of that same audio file (round trip)
    if temp_wav_path and os.path.exists(temp_wav_path):
        print(f"\n[STEP C] Speech-to-text of generated audio ({temp_wav_path})")
        try:
            with open(temp_wav_path, "rb") as f:
                wav_bytes = f.read()

            stt_result = await sarvam_client.transcribe(
                audio_bytes=wav_bytes,
                filename="kannada_sample.wav",
                mime_type="audio/wav"
            )
            print(f"  -> STT: SUCCESS")
            print(f"     Transcript: \"{stt_result.get('text', '')}\"")
            print(f"     Detected Language: {stt_result.get('language', '')}")
        except Exception as e:
            status = getattr(e, "status_code", getattr(e, "status", "N/A"))
            detail = getattr(e, "detail", str(e))
            print(f"  -> STT: FAILED => status: {status}, error: {detail}")
        finally:
            try:
                os.remove(temp_wav_path)
            except OSError:
                pass
    else:
        print("\n[STEP C] Skipped STT because TTS did not generate a WAV file.")

    print("\n" + "=" * 60)


if __name__ == "__main__":
    asyncio.run(run_diagnostics())
