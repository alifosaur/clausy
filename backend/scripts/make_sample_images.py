#!/usr/bin/env python3
"""
Generate clean and messy synthetic document image assets for live Gemma 4 OCR & E2E checks.
Reads tests/data/sample_pages.json and renders:
  - tests/assets/clean/page1.png ... page3.png (1240x1754 PNG, clean black text on white)
  - tests/assets/messy/page1.jpg ... page3.jpg (1240x1754 JPEG q=60, rotated 1.2°, noise, blur, dim)
"""

import os
import json
import random
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance

WIDTH = 1240
HEIGHT = 1754
MARGIN_LEFT = 90
MARGIN_RIGHT = 90
MARGIN_TOP = 100
LINE_SPACING = 12
FONT_SIZE = 26
HEADING_FONT_SIZE = 30

BACKEND_DIR = Path(__file__).resolve().parent.parent
DATA_FILE = BACKEND_DIR / "tests" / "data" / "sample_pages.json"
CLEAN_DIR = BACKEND_DIR / "tests" / "assets" / "clean"
MESSY_DIR = BACKEND_DIR / "tests" / "assets" / "messy"


def get_font(size: int = FONT_SIZE):
    """Loads Arial from Windows fonts, falling back to default."""
    candidates = [
        r"C:\Windows\Fonts\arial.ttf",
        r"C:\Windows\Fonts\calibri.ttf",
        r"C:\Windows\Fonts\times.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/System/Library/Fonts/Helvetica.ttc",
    ]
    for candidate in candidates:
        if os.path.exists(candidate):
            try:
                return ImageFont.truetype(candidate, size=size)
            except Exception:
                continue
    return ImageFont.load_default()


def wrap_text(text: str, font, max_width: int, draw: ImageDraw.ImageDraw) -> list[str]:
    """Wraps text into lines that do not exceed max_width."""
    lines = []
    paragraphs = text.split("\n")
    for para in paragraphs:
        if not para.strip():
            lines.append("")
            continue
        words = para.split(" ")
        current_line = []
        for word in words:
            test_line = " ".join(current_line + [word])
            bbox = draw.textbbox((0, 0), test_line, font=font)
            line_w = bbox[2] - bbox[0]
            if line_w <= max_width:
                current_line.append(word)
            else:
                if current_line:
                    lines.append(" ".join(current_line))
                current_line = [word]
        if current_line:
            lines.append(" ".join(current_line))
    return lines


def render_clean_page(text: str) -> Image.Image:
    """Renders a single clean A4 document page at 1240x1754."""
    img = Image.new("RGB", (WIDTH, HEIGHT), color=(255, 255, 255))
    draw = ImageDraw.Draw(img)
    font = get_font(FONT_SIZE)
    heading_font = get_font(HEADING_FONT_SIZE)

    max_w = WIDTH - MARGIN_LEFT - MARGIN_RIGHT
    wrapped_lines = wrap_text(text, font, max_w, draw)

    y = MARGIN_TOP
    for idx, line in enumerate(wrapped_lines):
        if not line:
            y += FONT_SIZE // 2
            continue

        # Use heading font for the top line
        active_font = heading_font if idx == 0 and "PAGE" in line else font
        color = (20, 20, 19)  # near-black ink
        draw.text((MARGIN_LEFT, y), line, font=active_font, fill=color)

        bbox = draw.textbbox((0, 0), line, font=active_font)
        line_h = bbox[3] - bbox[1]
        y += line_h + LINE_SPACING

    return img


def add_noise(img: Image.Image, amount: int = 12) -> Image.Image:
    """Adds subtle speckle / sensor noise to the image."""
    width, height = img.size
    pixels = img.load()
    for _ in range(int(width * height * 0.05)):
        x = random.randint(0, width - 1)
        y = random.randint(0, height - 1)
        r, g, b = pixels[x, y]
        delta = random.randint(-amount, amount)
        pixels[x, y] = (
            max(0, min(255, r + delta)),
            max(0, min(255, g + delta)),
            max(0, min(255, b + delta)),
        )
    return img


def render_messy_page(clean_img: Image.Image, angle: float = 1.3) -> Image.Image:
    """
    Simulates a camera photo / mobile capture:
    - Slight rotation (1-2 degrees)
    - Paper warmth / slightly dimmer brightness
    - Gaussian blur (slight optical softness)
    - Add sensor noise
    """
    # 1. Subtle warm background tint
    tinted = Image.new("RGB", clean_img.size, (250, 248, 244))
    tinted.paste(clean_img, (0, 0))

    # 2. Slight rotation
    rotated = tinted.rotate(angle, resample=Image.BICUBIC, expand=False, fillcolor=(245, 242, 237))

    # 3. Add noise
    noisy = add_noise(rotated, amount=15)

    # 4. Soft blur
    blurred = noisy.filter(ImageFilter.GaussianBlur(radius=0.7))

    # 5. Lower brightness slightly (88%)
    enhancer = ImageEnhance.Brightness(blurred)
    dimmed = enhancer.enhance(0.88)

    # 6. Lower contrast slightly (92%)
    contrast = ImageEnhance.Contrast(dimmed)
    final_img = contrast.enhance(0.92)

    return final_img


def main():
    CLEAN_DIR.mkdir(parents=True, exist_ok=True)
    MESSY_DIR.mkdir(parents=True, exist_ok=True)

    if not DATA_FILE.exists():
        raise FileNotFoundError(f"Ground truth data file not found: {DATA_FILE}")

    with open(DATA_FILE, "r", encoding="utf-8") as f:
        pages = json.load(f)

    print(f"Loaded {len(pages)} sample pages from {DATA_FILE.name}.")

    for idx, page_data in enumerate(pages, start=1):
        text = page_data["text"]

        # Clean PNG
        clean_img = render_clean_page(text)
        clean_path = CLEAN_DIR / f"page{idx}.png"
        clean_img.save(clean_path, format="PNG")
        print(f"Generated clean: {clean_path.name} ({clean_img.size[0]}x{clean_img.size[1]} PNG)")

        # Messy JPEG (alternate slight angles: 1.2°, -1.4°, 1.1°)
        angle = 1.2 if idx == 1 else (-1.4 if idx == 2 else 1.1)
        messy_img = render_messy_page(clean_img, angle=angle)
        messy_path = MESSY_DIR / f"page{idx}.jpg"
        messy_img.save(messy_path, format="JPEG", quality=60)
        print(f"Generated messy: {messy_path.name} (JPEG q=60, rotated {angle}°)")

    print("\nSample image generation complete.")


if __name__ == "__main__":
    main()
