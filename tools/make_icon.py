# -*- coding: utf-8 -*-
"""生成应用图标：淡蓝圆形背景 + 白色振动闹钟。"""
import os

from PIL import Image, ImageDraw

SIZE = 192
SS = 4
S = SIZE * SS

BLUE_TOP = (154, 216, 250)
BLUE_BOTTOM = (72, 166, 231)
WHITE = (255, 255, 255)


def thick_line(d, x1, y1, x2, y2, width, fill):
    d.line([x1, y1, x2, y2], fill=fill, width=int(width))
    for (x, y) in ((x1, y1), (x2, y2)):
        d.ellipse([x - width / 2.0, y - width / 2.0, x + width / 2.0, y + width / 2.0], fill=fill)


def main():
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))

    # 圆形渐变底
    grad = Image.new("RGBA", (1, S), (0, 0, 0, 255))
    px = grad.load()
    for y in range(S):
        t = y / float(S - 1)
        px[0, y] = (
            int(BLUE_TOP[0] + (BLUE_BOTTOM[0] - BLUE_TOP[0]) * t),
            int(BLUE_TOP[1] + (BLUE_BOTTOM[1] - BLUE_TOP[1]) * t),
            int(BLUE_TOP[2] + (BLUE_BOTTOM[2] - BLUE_TOP[2]) * t),
            255,
        )
    grad = grad.resize((S, S))
    mask = Image.new("L", (S, S), 0)
    ImageDraw.Draw(mask).ellipse([0, 0, S - 1, S - 1], fill=255)
    circle = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    circle.paste(grad, (0, 0), mask)
    img = Image.alpha_composite(img, circle)

    d = ImageDraw.Draw(img)
    cx = cy = S * 0.5
    r = S * 0.225
    w = S * 0.056

    # 震动波纹：左右各两条
    for i, rad in enumerate((r * 1.52, r * 1.88)):
        alpha = 235 - i * 75
        col = (255, 255, 255, alpha)
        aw = max(3, w * 0.72)
        d.arc([cx - rad, cy - rad, cx + rad, cy + rad], -30, 30, fill=col, width=int(aw))
        d.arc([cx - rad, cy - rad, cx + rad, cy + rad], 150, 210, fill=col, width=int(aw))

    # 两条腿
    for s in (-1, 1):
        thick_line(d,
                   cx + s * r * 0.56, cy + r * 0.86,
                   cx + s * r * 0.82, cy + r * 1.12,
                   w, WHITE)

    # 两个铃铛
    for s in (-1, 1):
        bx = cx + s * r * 0.62
        by = cy - r * 0.80
        br = r * 0.255
        d.ellipse([bx - br, by - br, bx + br, by + br], fill=WHITE)

    # 顶上小锤（三角）
    d.polygon([(cx - r * 0.15, cy - r * 0.95),
               (cx + r * 0.15, cy - r * 0.95),
               (cx, cy - r * 1.20)], fill=WHITE)

    # 钟面
    d.ellipse([cx - r - w / 2, cy - r - w / 2, cx + r + w / 2, cy + r + w / 2],
              outline=WHITE, width=int(w))
    thick_line(d, cx, cy, cx, cy - r * 0.58, w * 0.88, WHITE)
    thick_line(d, cx, cy, cx - r * 0.40, cy + r * 0.38, w * 0.88, WHITE)
    d.ellipse([cx - w * 0.55, cy - w * 0.55, cx + w * 0.55, cy + w * 0.55], fill=WHITE)

    out = img.resize((SIZE, SIZE), Image.LANCZOS)
    dest = os.path.join("src", "common", "logo.png")
    out.save(dest)
    out.resize((384, 384), Image.LANCZOS).save(os.path.join("tools", "icon-preview.png"))
    print("saved", dest, out.size)


if __name__ == "__main__":
    main()
