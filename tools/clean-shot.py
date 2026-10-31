"""Normalise an emulator framebuffer screenshot to 192x490.

If the capture has the band aspect ratio (e.g. the 466x1190 preview VVD) it is
scaled down; a wider capture (466x490) is centre-cropped at 1:1.
"""
import sys

from PIL import Image


def main(src, dst):
    im = Image.open(src).convert("RGB")
    w, h = im.size
    if w != 192 and abs(w / 192.0 - h / 490.0) < 0.02:
        im = im.resize((192, 490), Image.LANCZOS)
        print("scaled", (w, h), "->", im.size)
    elif w > 192:
        left = (w - 192) // 2
        im = im.crop((left, 0, left + 192, min(h, 490)))
        print("cropped", (w, h), "->", im.size)
    else:
        print("kept", im.size)
    im.save(dst)


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
