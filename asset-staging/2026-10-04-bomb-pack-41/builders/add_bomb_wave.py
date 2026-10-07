from pathlib import Path
from PIL import Image
import json, hashlib, shutil
root=Path(__file__).parent/'bomb-preview'
stage=root/'asset-staging/2026-10-04-bomb-pack-41'
source=Path(r'C:\Users\Zeter\.codex\generated_images\01a10724-6937-7eb1-99fd-35edb46bb978\exec-336bea93-7dfc-462e-a772-b44d96ad8a44.png')
im=Image.open(source).convert('RGBA')
assert im.size==(1536,1024) and im.getchannel('A').getextrema()[0]==0
atlas=Image.new('RGBA',im.size)
for i in range(6):
    x,y=(i%3)*512,(i//3)*512
    cell=im.crop((x,y,x+512,y+512)).resize((480,480),Image.Resampling.LANCZOS)
    atlas.paste(cell,(x+16,y+16))
relative='assets/ui/fx/bomb-shockwave-atlas-41.webp'
dest=root/relative
atlas.save(dest,'WEBP',quality=95,method=6)
shutil.copy2(dest,stage/'candidates'/dest.name)
shutil.copy2(source,stage/'sources/shockwave-six-stage.png')
manifest=json.loads((stage/'manifest.json').read_text('utf-8'))
manifest['files']=[f for f in manifest['files'] if f['path']!=relative]
manifest['files'].append(dict(path=relative,size=list(atlas.size),mode='RGBA',alpha_extrema=list(Image.open(dest).getchannel('A').getextrema()),bytes=dest.stat().st_size,sha256=hashlib.sha256(dest.read_bytes()).hexdigest(),consumer='catalog.js/settings.js',event='ground shockwave at detonation',source='shockwave-six-stage.png',grid=[3,2],frames=6,packaging='Fixed 512-square crops; uniform 480-square resize; 16px transparent gutter; no pixel/background edits',fallback='omit cosmetic wave, retain full explosion/damage'))
(stage/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n','utf-8')
print(relative,dest.stat().st_size,manifest['files'][-1]['alpha_extrema'])
