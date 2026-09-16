#!/usr/bin/env python3
"""One-off: convert the shipped animation sprite frames from PNG to WebP.

The runtime (src/Journey.jsx) crops each frame to its opaque bounding box and
rescales it to fit a 400px-tall canvas, so any source pixels beyond ~2x that
height are pure download/decode overhead with no visible benefit. Resize to a
900px height cap (comfortable headroom for HiDPI) before re-encoding.
"""
import glob
import os
from PIL import Image

ROOT = os.path.join(os.path.dirname(__file__), "..", "public", "animation")
MAX_HEIGHT = 900
QUALITY = 82

def main():
    files = sorted(glob.glob(os.path.join(ROOT, "**", "*.png"), recursive=True))
    files = [f for f in files if os.path.basename(f) != "preview.png"]
    before_total = 0
    after_total = 0
    for path in files:
        before = os.path.getsize(path)
        before_total += before
        im = Image.open(path).convert("RGBA")
        if im.height > MAX_HEIGHT:
            scale = MAX_HEIGHT / im.height
            im = im.resize((max(1, round(im.width * scale)), MAX_HEIGHT), Image.LANCZOS)
        webp_path = os.path.splitext(path)[0] + ".webp"
        im.save(webp_path, "WEBP", quality=QUALITY, method=6)
        after = os.path.getsize(webp_path)
        after_total += after
        os.remove(path)
        print(f"{os.path.relpath(path, ROOT)}: {before/1024:.0f}KB -> {after/1024:.0f}KB")
    print(f"\nTotal: {before_total/1024/1024:.1f}MB -> {after_total/1024/1024:.1f}MB "
          f"({100*(1-after_total/before_total):.0f}% smaller)")

if __name__ == "__main__":
    main()
