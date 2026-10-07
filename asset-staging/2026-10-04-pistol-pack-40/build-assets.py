from pathlib import Path
from PIL import Image
import hashlib, json, math, random, struct, wave

stage = Path(__file__).resolve().parent
root = stage.parents[1]
files = []
sources = []
def digest(p): return hashlib.sha256(p.read_bytes()).hexdigest()
def load(name):
    p = stage / name
    im = Image.open(p)
    assert im.mode == 'RGBA', (name, im.mode)
    assert im.getchannel('A').getextrema() == (0,255), name
    sources.append({'path': p.relative_to(root).as_posix(), 'dimensions': list(im.size), 'sha256': digest(p)})
    return im
def save(im, rel, budget):
    p = root / rel
    p.parent.mkdir(parents=True, exist_ok=True)
    im.save(p, 'WEBP', quality=96, method=6, exact=True)
    assert p.stat().st_size <= budget*1024, (rel,p.stat().st_size)
    files.append({'path':rel,'dimensions':list(im.size),'bytes':p.stat().st_size,'budgetKiB':budget,'alpha':True,'sha256':digest(p)})

poses = [load(f'pose-{i}-source.png') for i in range(5)]
assert all(p.size == (1448,1086) for p in poses)
# Recovery is exactly the ready source, rather than a newly generated identity.
poses.append(poses[0].copy())
atlas = Image.new('RGBA',(3840,1920))
for i,p in enumerate(poses):
    # Uniform full-canvas resize only. No tight crop, anatomy edits, or padding.
    # Both forearms already exit the source lower edge in every pose.
    p.save(stage/f'frame-{i}.png')
    atlas.alpha_composite(p.resize((1280,960),Image.Resampling.LANCZOS),(i%3*1280,i//3*960))
save(poses[0],'assets/ui/weapons/fp/player-pistol-fps-40.webp',450)
save(atlas,'assets/ui/fx/pistol-reload-atlas-40.webp',2100)
fx=load('effects-source.png')
assert fx.size==(1254,1254)
# Floor-based boundaries isolate each source cell before encoding the uniform atlas.
out=Image.new('RGBA',(768,768))
for i in range(16):
    c,r=i%4,i//4
    tile=fx.crop((c*fx.width//4,r*fx.height//4,(c+1)*fx.width//4,(r+1)*fx.height//4))
    out.alpha_composite(tile.resize((192,192),Image.Resampling.LANCZOS),(c*192,r*192))
save(out,'assets/ui/fx/pistol-effects-atlas-40.webp',350)
pickup=load('pickup-source.png')
pickup=pickup.crop(pickup.getchannel('A').getbbox())
for size,pad,rel,budget in [((512,384),16,'assets/ui/pickups/weapons/world-pistol-pickup-40.webp',120),((256,192),8,'assets/ui/weapons/pistol-icon-40.webp',45)]:
    sprite=pickup.copy();sprite.thumbnail((size[0]-2*pad,size[1]-2*pad),Image.Resampling.LANCZOS)
    img=Image.new('RGBA',size);img.alpha_composite(sprite,((size[0]-sprite.width)//2,(size[1]-sprite.height)//2));save(img,rel,budget)

# Deterministic original PCM samples. No remote media, copyrighted samples or gameplay RNG.
sr=22050
for kind,duration in [('shot',.34),('mag',.22),('slide',.28),('done',.18)]:
    rng=random.Random('pistol40/'+kind);n=round(sr*duration);samples=[];low=0
    for i in range(n):
        t=i/sr;noise=rng.uniform(-1,1);low=.78*low+.22*noise
        if kind=='shot':
            sig=.44*noise*math.exp(-t*65)+.62*low*math.exp(-t*19)+.40*math.sin(2*math.pi*(115*t-62*t*t))*math.exp(-t*24)
        else:
            peaks={'mag':[(.045,.012,.75),(.135,.018,.5)],'slide':[(.05,.019,.55),(.19,.008,.95)],'done':[(.04,.009,.72),(.105,.007,.3)]}[kind]
            env=sum(a*math.exp(-((t-c)/w)**2) for c,w,a in peaks)
            sig=(.36*noise+.18*math.sin(2*math.pi*(740 if kind=='mag' else 1260)*t))*env
        fade=max(0,min(1,i/40,(n-1-i)/80))
        samples.append(max(-32767,min(32767,round(sig*.88*32767*fade))))
    rel=f'assets/audio/pistol-{kind}-40.wav';p=root/rel
    with wave.open(str(p),'wb') as w:
        w.setnchannels(1);w.setsampwidth(2);w.setframerate(sr);w.writeframes(struct.pack('<'+'h'*n,*samples))
    files.append({'path':rel,'bytes':p.stat().st_size,'sha256':digest(p),'sampleRate':sr,'channels':1,'duration':n/sr})

manifest={'pack':40,'generator':'built-in image_gen; deterministic local PCM synthesis','sources':sources,'readyFrame':0,'recoveryFrame':5,'grid':[3,2],'cellDimensions':[1280,960],'sourceFrameDimensions':[1448,1086],'noAnatomyCrop':True,'tacticalSequence':[0,1,2,3,5],'emptySequence':[0,1,2,3,4,5],'muzzlePixels':[[431,150],[530,171],[530,171],[530,151],[628,176],[431,150]],'ejectionPixels':[[640,182],[736,169],[736,169],[724,160],[856,245],[640,182]],'boreAngleDegrees':-158.5,'effectSourceDimensions':[1254,1254],'effectSlicing':'floor(col*width/4), floor(row*height/4)','effectRuntimeCell':[192,192],'emitterMeasurementReference':[1254,1254], 'emitterSourceCells':{'flame': [[313, 313], [314, 313], [313, 313], [314, 313]], 'smoke': [[313, 314], [314, 314], [313, 314], [314, 314]]}, 'measurementNote':'2026-10-04 recalibration: front-plane estimate +/-6 source px (bore hole occluded); bore +/-4deg; dense FX roots +/-3px; exact floor-crop cell normalization.','flameOriginsPixels':[[278, 251], [264, 253], [252, 251], [253, 251]],'smokeOriginsPixels':[[274, 261], [266, 260], [256, 263], [258, 269]],'files':files}
(stage/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'runtimeFiles':len(files),'runtimeBytes':sum(f['bytes'] for f in files),'files':[(f['path'],f['bytes']) for f in files]}))
