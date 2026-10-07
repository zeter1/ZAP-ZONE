"""Derive ONE smoke pickup from Pack42 cell6; never render the entire atlas.

Deterministic cell crop and resize only. No synthesized/painted pixels.
Requires explicit project and output directory; writes one named WebP.
"""
from pathlib import Path
from PIL import Image, ImageOps
import argparse, hashlib, json

parser = argparse.ArgumentParser()
parser.add_argument('--project', required=True)
parser.add_argument('--output-dir', required=True)
args = parser.parse_args()
project = Path(args.project).resolve()
assert (project / 'index.html').is_file() and (project / 'src/assets/catalog.js').is_file()
source = project / 'asset-staging/2026-10-04-smoke-pack-42/sources/smoke-world-padded-42.png'
image = Image.open(source).convert('RGBA')
cols, rows, col, row = 4, 2, 2, 1  # Pack42 pickup cell6; no venting/cloud.
window = (col * image.width // cols, row * image.height // rows,
          (col + 1) * image.width // cols, (row + 1) * image.height // rows)
cell = image.crop(window)
bounds = cell.getchannel('A').getbbox()
assert bounds and cell.getchannel('A').getextrema()[0] == 0
body = cell.crop(bounds)
small = ImageOps.contain(body, (984, 728), Image.Resampling.LANCZOS)
canvas = Image.new('RGBA', (1024, 768))
canvas.alpha_composite(small, ((1024-small.width)//2, (768-small.height)//2))
output = Path(args.output_dir).resolve() / 'world-smoke-pickup-44.webp'
output.parent.mkdir(parents=True, exist_ok=True)
canvas.save(output, 'WEBP', quality=93, method=6)
check = Image.open(output)
assert check.size == (1024, 768) and check.mode == 'RGBA'
assert check.getchannel('A').getextrema()[0] == 0 and output.stat().st_size <= 240*1024
print(json.dumps(dict(key='smoke',source=str(source),sourceSize=list(image.size),
                     sourceCell=6,sourceGrid=[4,2],sourceWindow=list(window),cellAlphaBounds=list(bounds),
                     sourceSHA256=hashlib.sha256(source.read_bytes()).hexdigest(),
                     derivation='crop cell6 first, tight alpha bounds, contain984x728, center1024x768, WebP93',
                     runtime='assets/ui/pickups/weapons/world-smoke-pickup-44.webp',runtimeSize=[1024,768],
                     bytes=output.stat().st_size,sha256=hashlib.sha256(output.read_bytes()).hexdigest())))
