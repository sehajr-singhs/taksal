"""Turn the Commons photo of Maharaja Ranjit Singh's rupee (Lahore mint, 1825-26) into Taksal's ASCII coin.

Source: tools/coin/source.json (Classical Numismatic Group via Wikimedia Commons, CC BY-SA 2.5). The ASCII art is a
derivative, so it is shared under CC BY-SA 2.5 with that credit (see docs/SOURCES.md).
    python tools/coin_ascii.py [cols]   -> docs/assets/coin-ascii.txt
"""
import sys
from pathlib import Path
from PIL import Image, ImageOps, ImageFilter
ROOT = Path(__file__).resolve().parents[1]
cols = int(sys.argv[1]) if len(sys.argv) > 1 else 48
im = Image.open(ROOT / "tools/coin/obverse.png").convert("L")
w, h = im.size
s = min(w, h); im = im.crop(((w - s) // 2, (h - s) // 2, (w + s) // 2, (h + s) // 2))
im = ImageOps.autocontrast(im.filter(ImageFilter.SMOOTH_MORE), cutoff=2)
rows = cols // 2
im = im.resize((cols, rows), Image.LANCZOS)
ramp = " .:-=+*#%@"
out = []
for y in range(rows):
    line = ""
    for x in range(cols):
        dx, dy = (x + 0.5) / cols - 0.5, (y + 0.5) / rows - 0.5
        if dx * dx + dy * dy > 0.25:
            line += " "; continue
        v = im.getpixel((x, y)) / 255.0          # bright silver -> light chars, shadowed strokes -> dense
        line += ramp[min(len(ramp) - 1, int((1 - v) * len(ramp) * 1.15))]
    out.append(line.rstrip())
(ROOT / "docs/assets/coin-ascii.txt").write_text("\n".join(out) + "\n", encoding="utf-8")
print("\n".join(out))
