"""Toggle the two demo switches in src/pages/index/index.ux.

Usage: python tools/dev/set-demo.py on|off
"""
import io
import re
import sys

on = (sys.argv[1] if len(sys.argv) > 1 else "off").lower() == "on"
path = r"src/pages/index/index.ux"
src = io.open(path, encoding="utf-8").read()
src = re.sub(r"const AUTO_START = (?:true|false)", "const AUTO_START = " + ("true" if on else "false"), src)
src = re.sub(r"const DEMO_FAST = (?:true|false)", "const DEMO_FAST = " + ("true" if on else "false"), src)
io.open(path, "w", encoding="utf-8", newline="\n").write(src)
print("demo switches:", re.findall(r"(AUTO_START|DEMO_FAST) = (\w+)", src))
