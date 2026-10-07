from pathlib import Path
from PIL import Image
import json,hashlib,shutil
root=Path(__file__).parent/'bomb-preview';stage=root/'asset-staging/2026-10-04-bomb-pack-41'
source=Path(r'C:\Users\Zeter\.codex\generated_images\01a10724-6937-7eb1-99fd-35edb46bb978\exec-15ad1324-1ce6-489e-91b8-c62096ffe3c3.png')
im=Image.open(source).convert('RGBA');print('Original smoke alpha',im.getchannel('A').getextrema(),[im.getpixel(p)[3] for p in [(0,0),(10,10),(500,10),(520,500),(500,900),(1024,1023)]])
shutil.copy2(source,stage/'sources/smoke-sequence.png')
out=Image.new('RGBA',(1536,1024));windows=[]
for i in range(6):
 c,r=i%3,i//3;box=(c*im.width//3,r*im.height//2,(c+1)*im.width//3,(r+1)*im.height//2)
 tile=im.crop(box).resize((464,464),Image.Resampling.LANCZOS);out.paste(tile,(c*512+24,r*512+24));windows.append(list(box))
p=root/'assets/ui/fx/bomb-smoke-sequence-41.webp';out.save(p,'WEBP',quality=94,method=6);shutil.copy2(p,stage/'candidates'/p.name)
m=json.loads((stage/'manifest.json').read_text('utf-8'))
m['files'].append(dict(path='assets/ui/fx/bomb-smoke-sequence-41.webp',size=[1536,1024],mode='RGBA',alpha_extrema=list(out.getextrema()[3]),bytes=p.stat().st_size,sha256=hashlib.sha256(p.read_bytes()).hexdigest(),consumer='settings.js',event='six retained smoke stages',fallback='single retained smoke plume',grid=[3,2],frames=6,duration=3,source_windows=windows,transparent_padding=24,source='smoke-sequence.png'))
m['sources'].append(dict(key='smoke-sequence',path='sources/smoke-sequence.png',sha256=hashlib.sha256(source.read_bytes()).hexdigest()))
m['rejected']['smoke_sheets']='Earlier backdrop hypothesis withdrawn after alpha sampling: backdrop RGB is transparent. Original six-frame15ad sheet retained; unneeded regeneration not integrated.'
(stage/'manifest.json').write_text(json.dumps(m,ensure_ascii=False,indent=2),encoding='utf-8')
