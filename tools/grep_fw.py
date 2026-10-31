import re
import sys

PATH = r'C:\Users\saa\.export\system-images\vela-release-4.0\nuttx'
KEY = re.compile(r'(?i)(launcher|icon_size|icon_width|icon_height|app_list|applist|tile_width)')
TEXT = re.compile(rb'[ -~]{6,240}')

data = open(PATH, 'rb').read()
seen = set()
rows = []
for m in TEXT.finditer(data):
    s = m.group().decode('ascii', 'ignore')
    if not KEY.search(s):
        continue
    key = s[:90]
    if key in seen:
        continue
    seen.add(key)
    rows.append((m.start(), s[:200]))

print('unique hits:', len(rows))
for off, s in rows:
    print(off, '|', s)
