"""Rebuild the alpha atlas from source.png; default output stays in staging."""
from pathlib import Path
from PIL import Image
import argparse, hashlib

parser=argparse.ArgumentParser()
parser.add_argument('--output', type=Path, default=Path(__file__).resolve().parent/'runtime-preview.webp')
args=parser.parse_args()
source=Path(__file__).resolve().parent/'source.png'
im=Image.open(source).convert('RGBA')
assert im.size==(1536,1024)
atlas=Image.new('RGBA',(768,512))
for row in range(4):
    for col in range(6):
        tile=im.crop((col*256,row*256,(col+1)*256,(row+1)*256))
        tile.putalpha(tile.getchannel('A').point(lambda a:0 if a<=3 else a))
        atlas.paste(tile.resize((112,112),Image.Resampling.LANCZOS),(col*128+8,row*128+8))
atlas.save(args.output,'WEBP',quality=92,method=6)
print(hashlib.sha256(args.output.read_bytes()).hexdigest())
