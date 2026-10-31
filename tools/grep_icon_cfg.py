import re

PATH = r'C:\Users\saa\.export\system-images\vela-release-4.0\nuttx'
TEXT = re.compile(rb'[ -~]{5,120}')
data = open(PATH, 'rb').read()

seen = set()
print('=== CONFIG_*ICON* / *ICON_SIZE* constants ===')
for m in TEXT.finditer(data):
    s = m.group().decode('ascii', 'ignore').strip()
    if not re.match(r'^(CONFIG_[A-Z0-9_]*(ICON|TILE|LIST)[A-Z0-9_]*)', s):
        continue
    if s in seen:
        continue
    seen.add(s)
    print(s)

print()
print('=== values that look like icon sizes (names with ICON) ===')
for m in TEXT.finditer(data):
    s = m.group().decode('ascii', 'ignore').strip()
    if 'ICON' in s and re.search(r'\d', s) and s not in seen:
        seen.add(s)
        print(s)
