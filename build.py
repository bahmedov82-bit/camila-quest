#!/usr/bin/env python3
"""Concatenate src/* into a single index.html (and bump the version label)."""
import pathlib, re, sys
root = pathlib.Path(__file__).parent
src = sorted((root / 'src').iterdir())
out = ''.join(p.read_text() for p in src)
ver = sys.argv[1] if len(sys.argv) > 1 else None
if ver:
    out = re.sub(r"const VERSION='[^']*';", f"const VERSION='{ver}';", out)
(root / 'index.html').write_text(out)
print('index.html', len(out), 'bytes', 'version', re.search(r"const VERSION='([^']*)'", out).group(1))
