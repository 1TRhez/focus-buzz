import io
import json
import os
import sys
import zipfile

from PIL import Image

rpk = sys.argv[1] if len(sys.argv) > 1 else r'dist\com.band.focusbuzz.debug.1.2.4.rpk'
z = zipfile.ZipFile(rpk)
m = json.loads(z.read('manifest.json').decode('utf-8'))
im = Image.open(io.BytesIO(z.read('common/logo.png'))).convert('RGBA')
print('file      :', rpk, os.path.getsize(rpk), 'bytes')
print('version   :', m['versionName'], '/', m['versionCode'])
print('designW   :', m['config']['designWidth'])
print('icon path :', m.get('icon'))
print('icon size :', im.size, 'content', im.split()[3].getbbox())
