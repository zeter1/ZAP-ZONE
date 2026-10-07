from pathlib import Path
from PIL import Image
import json, hashlib, shutil
root=Path(__file__).parent/'bomb-preview'
stage=root/'asset-staging/2026-10-04-bomb-pack-41'
generated=Path(r'C:\Users\Zeter\.codex\generated_images\01a10724-6937-7eb1-99fd-35edb46bb978')
manifest=json.loads((stage/'manifest.json').read_text('utf-8'))
# Superseded alternatives stay in staging sources, never runtime.
obsolete=[f for f in manifest['files'] if 'bomb-explosion-' in f['path']]
manifest['superseded_runtime_candidates']=obsolete
manifest['files']=[f for f in manifest['files'] if f not in obsolete]
for f in obsolete:
    (root/f['path']).unlink()
def save(im,path,**extra):
    dst=root/path;dst.parent.mkdir(parents=True,exist_ok=True)
    im.save(dst,'WEBP',quality=94,method=6)
    shutil.copy2(dst,stage/'candidates'/dst.name)
    manifest['files'].append(dict(path=path,size=list(im.size),mode='RGBA',alpha_extrema=list(im.getextrema()[3]),bytes=dst.stat().st_size,sha256=hashlib.sha256(dst.read_bytes()).hexdigest(),**extra))
for name,file in [('world-top','exec-67c493e4-1120-42f9-9a00-84e9ae96d784.png'),('explosion-sequence','exec-13f915b9-f0d6-4550-9eb9-5aa1d7003f5c.png')]:
    shutil.copy2(generated/file,stage/'sources'/(name+'.png'))
    manifest['sources'].append(dict(key=name,path='sources/'+name+'.png',sha256=hashlib.sha256((stage/'sources'/(name+'.png')).read_bytes()).hexdigest()))
top=Image.open(stage/'sources/world-top.png').convert('RGBA')
box=top.getchannel('A').getbbox()
save(top.crop(box).resize((512,768),Image.Resampling.LANCZOS),'assets/ui/weapons/bomb-world-top-41.webp',consumer='combat.js',event='real horizontal grounded device skin',fallback='coherent native3D body',source='world-top.png',source_crop=list(box))
sheet=Image.open(stage/'sources/explosion-sequence.png').convert('RGBA')
accepted=list(range(16))
atlas=Image.new('RGBA',(2048,2048));windows=[]
for n,i in enumerate(accepted):
    c,r=i%4,i//4
    box=(c*sheet.width//4,r*sheet.height//4,(c+1)*sheet.width//4,(r+1)*sheet.height//4)
    tile=sheet.crop(box)
    a=tile.getchannel('A')
    print('cell',i,'bbox',a.getbbox(),'edge opaque',sum(a.getpixel((0,y))>180 or a.getpixel((tile.width-1,y))>180 for y in range(tile.height)))
    tile=tile.resize((464,464),Image.Resampling.LANCZOS)
    atlas.paste(tile,((n%4)*512+24,(n//4)*512+24));windows.append(list(box))
save(atlas,'assets/ui/fx/bomb-explosion-sequence-41.webp',consumer='settings.js',event='single chronological blast',fallback='shared Pack12+heavy26/procedural',grid=[4,4],frames=16,duration=1.8,source_windows=windows,transparent_padding=24,source='explosion-sequence.png')
manifest['clarification']='One chronological explosion; earlier random/cycling alternatives removed from runtime.'
(stage/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
print('runtime files',len(manifest['files']))
