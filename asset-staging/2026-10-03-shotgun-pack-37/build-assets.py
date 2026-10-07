from pathlib import Path
from PIL import Image
import json,hashlib,shutil,math,random,wave,struct
root=Path(__file__).resolve().parents[2]
stage=Path(__file__).resolve().parent
sources=['action-source.png','effects-source.png','pickup-source.png']
for name in sources:assert (stage/name).is_file(),name
files=[]
def save(im,path,budget):
 p=root/path;p.parent.mkdir(parents=True,exist_ok=True);im.save(p,'WEBP',quality=90,method=6)
 b=p.read_bytes();assert len(b)<=budget*1024,(path,len(b))
 files.append(dict(path=path,dimensions=list(im.size),alpha=True,bytes=len(b),budgetKiB=budget,sha256=hashlib.sha256(b).hexdigest()))
im=Image.open(stage/'action-source.png').convert('RGBA');frames=[]
for i in range(6):
 col,row=i%3,i//3
 cell=im.crop((col*im.width//3,row*im.height//2,(col+1)*im.width//3,(row+1)*im.height//2))
 # Source row1 top8 contains the previous row's clipped forearm fringe.
 # Frame4 left16 contains a disconnected neighboring forearm fragment.
 if row==1:cell.paste((0,0,0,0),(0,0,cell.width,8))
 if i==4:cell.paste((0,0,0,0),(0,0,16,cell.height))
 # Uniform fitting preserves aspect, wrist continuity and source registration.
 cell=cell.resize((576,576),Image.Resampling.LANCZOS)
 frame=Image.new('RGBA',(768,576));frame.alpha_composite(cell,(140,50));frames.append(frame)
atlas=Image.new('RGBA',(2304,1152))
for i,f in enumerate(frames):atlas.alpha_composite(f,(i%3*768,i//3*576))
save(frames[0].resize((960,720),Image.Resampling.LANCZOS),'assets/ui/weapons/fp/player-shotgun-fps-37.webp',250)
save(atlas,'assets/ui/fx/shotgun-action-atlas-37.webp',850)
for i,f in enumerate(frames):f.save(stage/f'frame-{i}.png')
fx=Image.open(stage/'effects-source.png').convert('RGBA')
save(fx.resize((768,768),Image.Resampling.LANCZOS),'assets/ui/fx/shotgun-effects-atlas-37.webp',250)
pickup=Image.open(stage/'pickup-source.png').convert('RGBA');box=pickup.getchannel('A').getbbox();pickup=pickup.crop(box)
def contained(size,pad):
 out=Image.new('RGBA',size);v=pickup.copy();v.thumbnail((size[0]-2*pad,size[1]-2*pad),Image.Resampling.LANCZOS);out.alpha_composite(v,((size[0]-v.width)//2,(size[1]-v.height)//2));return out
save(contained((512,342),12),'assets/ui/pickups/weapons/world-shotgun-pickup-37.webp',100)
save(contained((192,128),6),'assets/ui/weapons/shotgun-icon-37.webp',35)
# Deterministic local synthesized samples, no downloads or copyrighted sources.
sr=22050;rng=random.Random(37)
def sample(kind,duration):
 n=int(sr*duration);a=[];low=0
 for i in range(n):
  t=i/sr;noise=rng.uniform(-1,1);low=.76*low+.24*noise
  if kind=='shot':
   sig=.62*low*math.exp(-t*11)+.35*noise*math.exp(-t*48)+.44*math.sin(2*math.pi*(70*t-28*t*t))*math.exp(-t*15)
  elif kind=='pump':
   env=math.exp(-((t-.075)/.026)**2)+.8*math.exp(-((t-.27)/.023)**2)
   sig=.4*noise*env+.25*math.sin(2*math.pi*230*t)*env+.12*low*math.exp(-((t-.16)/.08)**2)
  elif kind=='shell':
   env=.7*math.exp(-((t-.06)/.016)**2)+math.exp(-((t-.15)/.009)**2)
   sig=.36*noise*env+.2*math.sin(2*math.pi*950*t)*env
  else:
   env=math.exp(-((t-.04)/.01)**2)+.5*math.exp(-((t-.16)/.024)**2)
   sig=.32*noise*env+.15*math.sin(2*math.pi*180*t)*env
  a.append(sig)
 peak=max(abs(v) for v in a);scale=.88/max(1,peak)
 a=[max(-32767,min(32767,round(v*scale*32767*min(1,i/80,(n-i)/100)))) for i,v in enumerate(a)]
 path=f'assets/audio/shotgun-{kind}-37.wav';p=root/path
 with wave.open(str(p),'wb') as w:w.setnchannels(1);w.setsampwidth(2);w.setframerate(sr);w.writeframes(struct.pack('<'+'h'*n,*a))
 b=p.read_bytes();files.append(dict(path=path,bytes=len(b),sha256=hashlib.sha256(b).hexdigest(),sampleRate=sr,channels=1,duration=duration))
for kind,d in [('shot',.55),('pump',.42),('shell',.24),('load',.29)]:sample(kind,d)
manifest={'pack':37,'generator':'built-in image_gen; deterministic audio synthesis','readyFrame':0,'grid':[3,2],'sourceDimensions':list(im.size),'isolatedGutters':{'bottomRowTop':8,'frame4Left':16},'cellFit':{'size':[576,576],'position':[140,50],'outputCell':[768,576]},'pumpSequence':[0,1,1,2,0],'shellSequence':[0,3,4,5,0],'muzzle':[.343,.201],'boreAngleDegrees':-145,'files':files}
(stage/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'files':len(files),'bytes':sum(f['bytes'] for f in files),'sources':sources},ensure_ascii=False))
