from pathlib import Path
from PIL import Image
import json,hashlib,shutil
root=Path(__file__).parent/'bomb-preview';stage=root/'asset-staging/2026-10-04-bomb-pack-41';gen=Path(r'C:\Users\Zeter\.codex\generated_images\01a10724-6937-7eb1-99fd-35edb46bb978')
m=json.loads((stage/'manifest.json').read_text('utf-8'));record=next(f for f in m['files'] if f['event']=='single chronological blast')
old=Image.open(stage/'sources/explosion-a.png').convert('RGBA');new=Image.open(stage/'sources/explosion-sequence.png').convert('RGBA')
names={5:'exec-b972298b-9b23-4ab6-a476-127c095d5389.png',6:'exec-4d43e164-f95d-4f87-a644-ebae085a7ff2.png',7:'exec-df311100-6c64-419e-802f-fd0485867db9.png'}
atlas=Image.new('RGBA',(3840,3072));windows=record['source_windows']
for n,w in enumerate(windows):
 if n in names:
  dest=stage/'sources'/('peak-hd-'+str(n)+'.png');shutil.copy2(gen/names[n],dest);im=Image.open(dest).convert('RGBA')
  m['sources'].append(dict(key='peak-hd-'+str(n),path='sources/'+dest.name,sha256=hashlib.sha256(dest.read_bytes()).hexdigest()))
  windows[n]=dict(source='peak-hd-'+str(n)+'.png',derived_from=w,crop=[0,0,im.width,im.height],source_size=list(im.size))
 else: im=(old if w['source']=='old' else new).crop(w['crop'])
 im=im.resize((696,696),Image.Resampling.LANCZOS);atlas.paste(im,((n%5)*768+36,(n//5)*768+36))
p=root/record['path'];atlas.save(p,'WEBP',quality=95,method=6);shutil.copy2(p,stage/'candidates'/p.name)
record.update(size=list(atlas.size),bytes=p.stat().st_size,sha256=hashlib.sha256(p.read_bytes()).hexdigest(),transparent_padding=36,tile_size=768,alpha_extrema=list(atlas.getextrema()[3]),quality=95,encoded_budget_bytes=5*1024*1024,uncompressed_rgba_bytes=3840*3072*4)
(stage/'manifest.json').write_text(json.dumps(m,ensure_ascii=False,indent=2),encoding='utf-8');print('HD atlas bytes',record['bytes'])
