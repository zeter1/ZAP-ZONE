from pathlib import Path
from PIL import Image
import json,hashlib,shutil
root=Path(__file__).parent/'bomb-preview';stage=root/'asset-staging/2026-10-04-bomb-pack-41'
m=json.loads((stage/'manifest.json').read_text('utf-8'))
def save(im,path,**extra):
 p=root/path;im.save(p,'WEBP',quality=94,method=6);shutil.copy2(p,stage/'candidates'/p.name)
 m['files']=[f for f in m['files'] if f['path']!=path]
 m['files'].append(dict(path=path,size=list(im.size),mode='RGBA',alpha_extrema=list(im.getextrema()[3]),bytes=p.stat().st_size,sha256=hashlib.sha256(p.read_bytes()).hexdigest(),**extra))
top=Image.open(stage/'sources/world-top.png').convert('RGBA')
box=top.getchannel('A').point(lambda v:255 if v>180 else 0).getbbox()
print('world top',top.size,box)
save(top.crop(box).resize((512,768),Image.Resampling.LANCZOS),'assets/ui/weapons/bomb-world-top-41.webp',consumer='combat.js',event='real horizontal grounded device skin',fallback='coherent native3D body',source='world-top.png',source_crop=list(box))
old=Image.open(stage/'sources/explosion-a.png').convert('RGBA');new=Image.open(stage/'sources/explosion-sequence.png').convert('RGBA')
old_record=next(f for f in m['superseded_runtime_candidates'] if '-a-' in f['path'])
order=[('old',0),('new',0),('old',1),('new',2),('new',3),('new',5),('new',6),('old',2),('new',10),('old',3),('new',11),('old',4),('new',12),('new',13),('old',5),('new',14),('new',15)]
atlas=Image.new('RGBA',(2560,2048));windows=[]
for n,(source,index) in enumerate(order):
 if source=='old': sheet=old;box=tuple(old_record['source_windows'][index])
 else:
  sheet=new;c,r=index%4,index//4
  box=(c*sheet.width//4+8,r*sheet.height//4+8,(c+1)*sheet.width//4-8,(r+1)*sheet.height//4-8)
 tile=sheet.crop(box).resize((464,464),Image.Resampling.LANCZOS)
 atlas.paste(tile,((n%5)*512+24,(n//5)*512+24));windows.append(dict(source=source,index=index,crop=list(box)))
save(atlas,'assets/ui/fx/bomb-explosion-sequence-41.webp',consumer='settings.js',event='single chronological blast',fallback='shared Pack12+heavy26/procedural',grid=[5,4],frames=17,duration=2.1,source_windows=windows,transparent_padding=24,sources=['explosion-a.png','explosion-sequence.png'])
m['clarification']='One17-frame chronological blast retaining all6 accepted original A frames; no runtime variant selection. Original sources B/C preserved in staging.'
(stage/'manifest.json').write_text(json.dumps(m,ensure_ascii=False,indent=2),encoding='utf-8')
