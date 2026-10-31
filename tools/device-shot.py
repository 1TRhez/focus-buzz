import os
import sys
from PIL import Image

SKIN = r"C:\Users\saa\.export\skins\builtin\xiaomi_band"
BG = os.path.join(SKIN, "background.png")
FG = os.path.join(SKIN, "foreground.png")


def device_shot(app_png, out_png):
    bg = Image.open(BG).convert("RGBA")
    fg = Image.open(FG).convert("RGBA")
    shot = Image.open(app_png).convert("RGB")
    if shot.size != (192, 490):
        # 取中间 192x490
        w, h = shot.size
        left = (w - 192) // 2
        shot = shot.crop((left, 0, left + 192, min(490, h))).resize((192, 490))

    alpha = fg.split()[3]
    visible = alpha.point(lambda v: 255 if v < 128 else 0)

    masked = Image.new("RGB", (192, 490), (0, 0, 0))
    masked.paste(shot, (0, 0), visible)

    canvas = bg.copy()
    canvas.paste(masked, (44, 154))
    canvas.alpha_composite(fg, (44, 154))
    canvas.save(out_png)
    print("saved", out_png, canvas.size)


if __name__ == "__main__":
    device_shot(sys.argv[1], sys.argv[2])
