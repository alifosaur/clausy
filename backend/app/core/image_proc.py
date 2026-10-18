import io
from PIL import Image
from fastapi import HTTPException

# Maximum allowable pixel count (40 megapixels) to prevent decompression bomb / memory exhaustion
MAX_IMAGE_PIXELS: int = 40_000_000


def optimize_image(content: bytes, max_longest_side: int = 1280, quality: int = 85) -> tuple[bytes, str]:
    """
    Validates dimensions and downscales image to max 1280 px on longest side,
    re-encoding as JPEG quality 85, preserving legibility while minimizing payload size.
    Raises HTTPException(400) if image exceeds 40M pixels or is corrupt/invalid.
    Returns (optimized_bytes, mime_type).
    """
    try:
        with Image.open(io.BytesIO(content)) as img:
            # Check dimensions before raster decoding
            w, h = img.size
            if w * h > MAX_IMAGE_PIXELS:
                raise HTTPException(
                    status_code=400,
                    detail=f"Image resolution ({w}x{h} = {w * h:,} pixels) exceeds the limit of 40 million pixels. Please upload a smaller image.",
                )

            # Convert any color mode (RGBA, P, LA, CMYK, etc.) to RGB for JPEG encoding
            if img.mode != "RGB":
                img = img.convert("RGB")

            longest = max(w, h)
            if longest > max_longest_side:
                scale = max_longest_side / float(longest)
                new_w = max(1, int(w * scale))
                new_h = max(1, int(h * scale))
                img = img.resize((new_w, new_h), Image.Resampling.LANCZOS)

            out = io.BytesIO()
            img.save(out, format="JPEG", quality=quality, optimize=True)
            return out.getvalue(), "image/jpeg"
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=400,
            detail="Invalid or corrupt image file. Please provide a valid JPG or PNG image.",
        ) from exc
