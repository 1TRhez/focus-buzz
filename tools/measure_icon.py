from PIL import Image

SRC = r'tools\icon-zoom.png'
im = Image.open(SRC).convert('RGB')
w, h = im.size
px = im.load()

# 蓝色圆形：B 高、R 中低；取偏蓝且亮度较高的像素
xs = []
ys = []
for y in range(0, h, 2):
    for x in range(0, w, 2):
        r, g, b = px[x, y]
        if b > 110 and b > r + 30 and g > 90:
            xs.append(x)
            ys.append(y)

if not xs:
    print('no blue found')
    raise SystemExit

x0, x1 = min(xs), max(xs)
y0, y1 = min(ys), max(ys)
width = x1 - x0 + 1
height = y1 - y0 + 1
print('blue bbox', (x0, y0, x1, y1), 'w', width, 'h', height)
print('aspect h/w = %.3f' % (height / width))

# 每行的蓝色跨度，找出底部被裁的位置（跨度突然消失/突变）
rows = {}
for x, y in zip(xs, ys):
    rows.setdefault(y, []).append(x)
prev = None
for y in sorted(rows):
    span = max(rows[y]) - min(rows[y]) + 1
    if prev is not None and span < prev * 0.5:
        print('span drop at y=%d: %d -> %d' % (y, prev, span))
    prev = span
print('bottom rows:')
for y in sorted(rows)[-6:]:
    print(' y', y, 'span', max(rows[y]) - min(rows[y]) + 1)
