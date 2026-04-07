#!/usr/bin/env -S uv run
# /// script
# requires-python = ">=3.11"
# dependencies = ["Pillow"]
# ///
"""Generate og-image.png from marin-logo.png + text overlay."""

from PIL import Image, ImageDraw, ImageFont
from pathlib import Path

W, H = 1200, 630
BG = (33, 43, 51)       # #212B33
BEIGE = (223, 207, 184)  # #DFCFB8
DIM = (150, 142, 130)
LINK = (115, 160, 210)

LOGO = Path(__file__).parent / "marin-logo.png"
OUT = Path(__file__).parent / "og-image.png"

# macOS system font; falls back to default
FONT_PATH = "/System/Library/Fonts/Helvetica.ttc"


def load_font(size: int) -> ImageFont.FreeTypeFont:
    try:
        return ImageFont.truetype(FONT_PATH, size)
    except OSError:
        return ImageFont.load_default()


def main():
    img = Image.new("RGB", (W, H), BG)
    draw = ImageDraw.Draw(img)

    # Logo: nearly fill left half vertically
    logo = Image.open(LOGO).convert("RGBA")
    pad = 30
    logo_size = H - 2 * pad
    logo = logo.resize((logo_size, logo_size), Image.LANCZOS)
    logo_x = (W // 2 - logo_size) // 2
    logo_bg = Image.new("RGB", (logo_size, logo_size), BG)
    logo_bg.paste(logo, mask=logo.split()[3])
    img.paste(logo_bg, (logo_x, pad))

    # Fonts
    title_font = load_font(72)
    sub_font = load_font(32)
    detail_font = load_font(26)

    # Right half text, vertically centered, left-justified
    right_x = W // 2 + 30

    title_lines = ["Marin Discord", "Archive &", "Summaries"]
    sub_lines = ["Weekly AI-generated digests", "of the Marin Community", "Discord server"]
    link_text = "github.com/Open-Athena/marin-discord"

    title_h, sub_h = 80, 42
    gap1, gap2 = 30, 30
    total = len(title_lines) * title_h + gap1 + len(sub_lines) * sub_h + gap2 + 30
    y = (H - total) // 2

    for line in title_lines:
        draw.text((right_x, y), line, fill=BEIGE, font=title_font)
        y += title_h

    y += gap1
    for line in sub_lines:
        draw.text((right_x, y), line, fill=DIM, font=sub_font)
        y += sub_h

    y += gap2
    draw.text((right_x, y), link_text, fill=LINK, font=detail_font)

    img.save(OUT, "PNG")
    print(f"Wrote {OUT} ({W}x{H})")


if __name__ == "__main__":
    main()
