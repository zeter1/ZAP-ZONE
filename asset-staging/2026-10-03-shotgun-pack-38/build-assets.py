from pathlib import Path
from PIL import Image
import json,hashlib,shutil
stage=Path(__file__).resolve().parent;root=stage.parents[1]
stage.mkdir(parents=True,exist_ok=True)
inputs={'sources':[stage/f'pose-{i}-source.png' for i in range(6)],'prompts':json.loads((stage/'prompts.json').read_text(encoding='utf8'))}
frames=[];sources=[];files=[]
for i,src in enumerate(inputs['sources']):
 p=Path(src)
 im=Image.open(p);assert im.mode=='RGBA';assert im.width>=1400 and im.height>=1024
 alpha=im.getchannel('A');assert alpha.getextrema()==(0,255);assert alpha.crop((0,im.height-1,im.width,im.height)).getbbox(),'forearms must continue to bottom'
 sources.append({'path':p.relative_to(root).as_posix(),'dimensions':list(im.size),'sha256':hashlib.sha256(p.read_bytes()).hexdigest()})
 # Generated frames already share 4:3 registration; normalization is only a delivery format.
 assert abs(im.width/im.height-4/3)<.015,(i,im.size)
 assert im.size==(1448,1086),(i,im.size)
 frames.append(im)
def save(im,rel,budget):
 p=root/rel;p.parent.mkdir(parents=True,exist_ok=True);im.save(p,'WEBP',quality=96,method=6,exact=True)
 b=p.read_bytes();assert len(b)<=budget*1024
 files.append({'path':rel,'dimensions':list(im.size),'bytes':len(b),'budgetKiB':budget,'alpha':True,'sha256':hashlib.sha256(b).hexdigest()})
save(frames[0],'assets/ui/weapons/fp/player-shotgun-fps-38.webp',650)
atlas=Image.new('RGBA',(3840,1920))
for i,im in enumerate(frames):atlas.alpha_composite(im.resize((1280,960),Image.Resampling.LANCZOS),(i%3*1280,i//3*960))
save(atlas,'assets/ui/fx/shotgun-action-atlas-38.webp',3200)
(stage/'prompts.json').write_text(json.dumps(inputs['prompts'],ensure_ascii=False,indent=2),encoding='utf8')
(stage/'manifest.json').write_text(json.dumps({'pack':38,'cell':[1280,960],'grid':[3,2],'sources':sources,'files':files,'generator':'built-in image_gen; each pose generated individually'},ensure_ascii=False,indent=2),encoding='utf8')

inputs={'sources':[stage/'flame-source.png',stage/'smoke-source.png',stage/'casing-source.png'],'prompts':json.loads((stage/'effect-prompts.json').read_text(encoding='utf8'))}
m=json.loads((stage/'manifest.json').read_text(encoding='utf8'));atlas=Image.new('RGBA',(768,768));origins={};sources=[]
for row,name in enumerate(['flame','smoke']):
 p=Path(inputs['sources'][row]);im=Image.open(p);assert im.mode=='RGBA' and im.width==im.height
 origins[name]=[]
 for i in range(4):
  w=im.width//2;cell=im.crop((i%2*w,i//2*w,(i%2+1)*w,(i//2+1)*w))
  # Alpha gutters isolate exact tiles; do not let a neighboring emission cross seams.
  cell.paste((0,0,0,0),(0,0,w,2));cell.paste((0,0,0,0),(0,0,2,w));cell.paste((0,0,0,0),(w-2,0,w,w));cell.paste((0,0,0,0),(0,w-2,w,w))
  candidates=[(x,y)for y in range(w)for x in range(int(w*.7),w-2)if cell.getpixel((x,y))[3]>=100 and min(cell.getpixel((x,y))[:3])>=170]
  assert candidates,(name,i)
  x=max(p[0]for p in candidates);ys=[p[1]for p in candidates if p[0]>=x-2]
  origins[name].append([round((x+.5)/w,6),round((sum(ys)/len(ys)+.5)/w,6)])
  atlas.alpha_composite(cell.resize((192,192),Image.Resampling.LANCZOS),(i*192,row*192))
 sources.append({'path':p.relative_to(root).as_posix(),'dimensions':list(im.size),'sha256':hashlib.sha256(p.read_bytes()).hexdigest()})
old=Image.open(root/'assets/ui/fx/shotgun-effects-atlas-37.webp');atlas.alpha_composite(old.crop((0,384,768,576)),(0,384))
p=Path(inputs['sources'][2]);shell=Image.open(p);assert shell.mode=='RGBA';shell=shell.crop(shell.getchannel('A').getbbox());shell.thumbnail((152,152),Image.Resampling.LANCZOS)
atlas.alpha_composite(shell,((192-shell.width)//2,576+(192-shell.height)//2))
sources.append({'path':p.relative_to(root).as_posix(),'sha256':hashlib.sha256(p.read_bytes()).hexdigest()})
rel='assets/ui/fx/shotgun-effects-atlas-38.webp';p=root/rel;atlas.save(p,'WEBP',quality=96,method=6,exact=True);b=p.read_bytes();assert len(b)<400*1024
m['files'].append({'path':rel,'dimensions':[768,768],'bytes':len(b),'budgetKiB':400,'alpha':True,'sha256':hashlib.sha256(b).hexdigest()});m['effectSources']=sources;m['emitters']=origins;m['casing']={'frames':1,'duration':.52,'vxPx':180,'vyPx':-95,'gravityPx':1800}
(stage/'manifest.json').write_text(json.dumps(m,ensure_ascii=False,indent=2),encoding='utf8')
(stage/'effect-prompts.json').write_text(json.dumps(inputs['prompts'],ensure_ascii=False,indent=2),encoding='utf8')
print(json.dumps({'files':len(m['files']),'emitters':origins},ensure_ascii=False))
