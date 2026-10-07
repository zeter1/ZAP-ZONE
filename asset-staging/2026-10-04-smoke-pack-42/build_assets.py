"""Deterministic format/size/cell derivatives; no painted or synthesized raster art.

All creative raster work comes from built-in image_gen sources. FPS source
canvases remain complete, including transparent margins and arm exits.
Only runtime files named in this builder are written. No cleanup is performed.
"""
from pathlib import Path
from PIL import Image
import argparse, hashlib, json, math, random, struct, wave

BASE = Path(__file__).resolve().parent
SOURCES = BASE / 'sources'
LANCZOS = Image.Resampling.LANCZOS
parser = argparse.ArgumentParser()
parser.add_argument('--project', required=True)
args = parser.parse_args()
ROOT = Path(args.project).resolve()
if not (ROOT / 'index.html').is_file() or not (ROOT / 'src/assets/catalog.js').is_file():
    raise SystemExit('Expected concrete ZAP ZONE project root')
records = []
source_windows = []

def source(name):
    return Image.open(SOURCES / name).convert('RGBA')

def fps(name, size=(1280, 720)):
    # Generator full viewport differs from exact16:9 by <0.1% only.
    im = source(name)
    if abs(im.width / im.height - 16 / 9) > .015:
        raise ValueError('FPS source is not a full16:9 viewport: ' + name)
    return im.resize(size, LANCZOS)

def fit_canvas(im, size, margin=0, bottom_right=False):
    """Preserve aspect, fit complete source canvas, never tight-crop FPS art."""
    scale = min((size[0]-2*margin)/im.width, (size[1]-2*margin)/im.height)
    out = im.resize((round(im.width*scale),round(im.height*scale)), LANCZOS)
    canvas = Image.new('RGBA', size)
    pos = (size[0]-margin-out.width,size[1]-margin-out.height) if bottom_right else ((size[0]-out.width)//2,(size[1]-out.height)//2)
    canvas.alpha_composite(out, pos)
    return canvas

def source_cells(name, cols, rows):
    im = source(name)
    result = []
    for row in range(rows):
        for col in range(cols):
            box = (col*im.width//cols,row*im.height//rows,(col+1)*im.width//cols,(row+1)*im.height//rows)
            source_windows.append({'source':name,'cell':len(result),'window':list(box)})
            result.append(im.crop(box))
    return result

def atlas(cells, cols, size):
    canvas = Image.new('RGBA',(cols*size[0],math.ceil(len(cells)/cols)*size[1]))
    for i, cell in enumerate(cells):
        assert cell.size == size
        canvas.alpha_composite(cell,((i%cols)*size[0],(i//cols)*size[1]))
    return canvas

def save_webp(relative, im, budget=3*1024*1024):
    target = (ROOT/relative).resolve()
    if ROOT not in target.parents:
        raise ValueError('Output escaped project')
    target.parent.mkdir(parents=True,exist_ok=True)
    # Fixed quality preserves source detail; a failed budget is not hidden.
    im.save(target,'WEBP',quality=95,method=6,exact=True)
    data = target.read_bytes()
    check = Image.open(target).convert('RGBA')
    assert check.size == im.size
    assert check.getextrema()[3][0] < 255
    assert len(data) <= budget, (relative,len(data),budget)
    records.append({'path':relative,'size':list(im.size),'bytes':len(data),'budget_bytes':budget,'decoded_rgba_bytes':im.width*im.height*4,'alpha_extrema':list(check.getextrema()[3]),'sha256':hashlib.sha256(data).hexdigest()})

ready = fps('smoke-ready-42.png')
save_webp('assets/ui/weapons/fp/player-smoke-fps-42.webp',fps('smoke-ready-42.png',(1600,900)),500*1024)
# Recovery is the first source pose from the generated reload sheet. The
# actual source window ends at the transparent separation before the next arm.
# Its square viewport is fitted to16:9 on the lower right with its full alpha.
reload_source = source('smoke-reload-42.png')
recovery_window = (0,0,758,reload_source.height)
source_windows.append({'source':'smoke-reload-42.png','cell':0,'window':list(recovery_window),'use':'recovery/lower'})
recovery = fit_canvas(reload_source.crop(recovery_window),(1280,720),bottom_right=True)
poses = [ready,fps('smoke-pin-42.png'),fps('smoke-windup-42.png'),fps('smoke-release-42.png'),recovery,ready.copy()]
save_webp('assets/ui/fx/smoke-throw-atlas-42.webp',atlas(poses,3,(1280,720)))
save_webp('assets/ui/fx/smoke-reload-atlas-42.webp',atlas([recovery,fps('smoke-draw-42.png'),ready],3,(1280,720)))

world = source_cells('smoke-world-padded-42.png',4,2)
save_webp('assets/ui/fx/smoke-world-atlas-42.webp',atlas([fit_canvas(x,(384,384),margin=12) for x in world],4,(384,384)))
# Small world pickup/icon consumers permit tight crop of body-only source cells.
for cell, target, size, budget in [(world[6],'assets/ui/pickups/weapons/world-smoke-pickup-42.webp',(512,384),120*1024),(world[7],'assets/ui/weapons/smoke-icon-42.webp',(128,128),32*1024)]:
    bounds=cell.getchannel('A').getbbox()
    save_webp(target,fit_canvas(cell.crop(bounds),size,margin=12),budget)

for name,target,cols,rows,cell_size,margin in [
    ('smoke-wisps-42.png','smoke-wisps-atlas-42.webp',4,2,384,24),
]:
    save_webp('assets/ui/fx/'+target,atlas([fit_canvas(c,(cell_size,cell_size),margin=margin) for c in source_cells(name,cols,rows)],cols,(cell_size,cell_size)))
near_cells = []
for i in range(4):
    name = 'smoke-near-single-' + str(i) + '-42.png'
    im = source(name)
    source_windows.append({'source':name,'cell':0,'window':[0,0,im.width,im.height],'use':'near independent variant'})
    near_cells.append(fit_canvas(im,(768,768),margin=28))
save_webp('assets/ui/fx/smoke-near-atlas-42.webp',atlas(near_cells,2,(768,768)))
for names,target,use in [
    (['smoke-phase-0-42.png','smoke-phase-1-42.png','smoke-near-single-0-42.png','smoke-near-single-3-42.png','smoke-phase-4-42.png','smoke-phase-5-42.png'],'smoke-cloud-atlas-42.webp','independent lifecycle frame'),
    (['smoke-near-single-0-42.png','smoke-near-single-1-42.png','smoke-near-single-2-42.png','smoke-near-single-3-42.png','smoke-far-single-4-42.png','smoke-far-single-5-42.png'],'smoke-far-atlas-42.webp','independent far variant'),
]:
    cells=[]
    for name in names:
        im=source(name)
        source_windows.append({'source':name,'cell':0,'window':[0,0,im.width,im.height],'use':use})
        cells.append(fit_canvas(im,(512,512),margin=28))
    save_webp('assets/ui/fx/'+target,atlas(cells,3,(512,512)))
save_webp('assets/ui/overlays/smoke-inside-dense-42.webp',source('smoke-overlay-42.png').resize((960,540),LANCZOS),250*1024)
save_webp('assets/ui/overlays/smoke-inside-edge-42.webp',source('smoke-inside-edge-42.png').resize((960,540),LANCZOS),250*1024)

def sound(kind,duration):
    rate=44100; rng=random.Random('ZAP-ZONE-Smoke42-'+kind); count=round(rate*duration)
    values=[]; filtered=0
    for i in range(count):
        t=i/rate; noise=rng.uniform(-1,1);filtered=.85*filtered+.15*noise
        if kind=='pin':
            env=math.exp(-t*28)*(1-math.exp(-t*800));val=env*(.22*math.sin(2*math.pi*1950*t)+.13*math.sin(2*math.pi*3300*t)+.20*noise)
        elif kind=='throw':
            env=math.sin(math.pi*t/duration)**2;val=.95*filtered*env
        elif kind=='bounce':
            env=math.exp(-t*24)*(1-math.exp(-t*900));val=env*(.35*math.sin(2*math.pi*520*t)*math.exp(-t*9)+.22*math.sin(2*math.pi*1700*t)+.12*noise)
        elif kind=='vent':
            env=min(1,t/.06)*min(1,(duration-t)/.15);val=(.22*noise+.44*filtered)*env*(.8+.2*math.sin(t*9))
        else:
            env=math.exp(-t*16)*(1-math.exp(-t*600));val=(.35*filtered+.17*math.sin(2*math.pi*670*t))*env
        values.append(max(-.8,min(.8,val)))
    target=ROOT/'assets/audio'/('smoke-'+kind+'-42.wav');target.parent.mkdir(parents=True,exist_ok=True)
    with wave.open(str(target),'wb') as wav:
        wav.setnchannels(1);wav.setsampwidth(2);wav.setframerate(rate)
        wav.writeframes(b''.join(struct.pack('<h',round(x*32767)) for x in values))
    data=target.read_bytes()
    records.append({'path':target.relative_to(ROOT).as_posix(),'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest(),'pcm':{'channels':1,'sample_width_bytes':2,'sample_rate':rate,'frames':count,'duration_seconds':count/rate,'peak':max(map(abs,values)),'rms':math.sqrt(sum(x*x for x in values)/len(values))}})
for kind,duration in [('pin',.18),('throw',.32),('bounce',.25),('vent',1.4),('reload',.32)]:
    sound(kind,duration)

manifest={'status':'integrating after user continue following displayed previews','generator':'built-in image_gen','image_derivation':'resize full canvas, exact floor cell crop, preserve RGBA; no creative raster editing','hand_mode':'baked-hands','fps_decoded_budget_bytes':40*1024*1024,'sources':[],'source_windows':source_windows,'runtime':records,'throw_frames':['ready','pin','windup','empty_release','empty_recovery','ready'],'reload_frames':['lower','draw','ready']}
for path in sorted(SOURCES.glob('*.png')):
    im=Image.open(path)
    manifest['sources'].append({'path':path.relative_to(BASE).as_posix(),'size':list(im.size),'mode':im.mode,'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'alpha_extrema':list(im.getextrema()[-1])})
fps_records=[x for x in records if x['path'] in ['assets/ui/weapons/fp/player-smoke-fps-42.webp','assets/ui/fx/smoke-throw-atlas-42.webp','assets/ui/fx/smoke-reload-atlas-42.webp']]
manifest['fps_decoded_bytes']=sum(x['decoded_rgba_bytes'] for x in fps_records)
assert manifest['fps_decoded_bytes'] <= manifest['fps_decoded_budget_bytes']
(BASE/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'runtime_files':len(records),'total_bytes':sum(x['bytes'] for x in records),'fps_decoded_MiB':manifest['fps_decoded_bytes']/1024**2,'assets':[{k:v for k,v in r.items() if k in ('path','bytes','size')} for r in records]},ensure_ascii=True))
