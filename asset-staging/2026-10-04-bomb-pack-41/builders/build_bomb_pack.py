from pathlib import Path
from PIL import Image
import hashlib, json, shutil

root=Path(__file__).parent/'bomb-preview'
stage=root/'asset-staging/2026-10-04-bomb-pack-41'
src=stage/'sources'; src.mkdir(parents=True,exist_ok=True)
generated=Path(r'C:\Users\Zeter\.codex\generated_images\01a10724-6937-7eb1-99fd-35edb46bb978')
names={
 'ready':'exec-38fccc95-b624-43fa-837f-3b8cdc9868dc.png',
 'arm':'exec-8c420163-1aa6-48cf-9479-6cfc7d7c57b8.png',
 'lower':'exec-2da20a5b-c982-4e00-8282-bfbc352f21eb.png',
 'release':'exec-85c1339f-fefe-4037-b799-5dc7416b85e8.png',
 'explosion-a':'exec-df94e37f-a5d7-49aa-aefa-6052a7249d89.png',
 'explosion-b':'exec-00e1ac86-e397-4e03-add8-6b0f0b749aa5.png',
 'explosion-c':'exec-1c13b4c6-8612-4855-a6fc-692fc8002e80.png',
 'smoke':'exec-7e4d07ab-a378-4c5c-a6e8-8406eb9b9f2e.png',
 'world':'exec-5a509cdb-bf01-4918-aff0-07599ae7fa22.png'}
for key,name in names.items(): shutil.copy2(generated/name,src/(key+'.png'))
shutil.copy2(Path(__file__).parent/'bomb_prompts.json',stage/'prompts.json')
records=[]
def save(image,path,consumer,event,fallback,**extra):
 target=root/path; target.parent.mkdir(parents=True,exist_ok=True)
 image.save(target,'WEBP',quality=94,method=6)
 candidate=stage/'candidates'/target.name; candidate.parent.mkdir(exist_ok=True)
 shutil.copy2(target,candidate)
 records.append(dict(path=path,size=list(image.size),mode=image.mode,alpha_extrema=list(image.getextrema()[3]),bytes=target.stat().st_size,sha256=hashlib.sha256(target.read_bytes()).hexdigest(),consumer=consumer,event=event,fallback=fallback,**extra))
poses=[Image.open(src/(key+'.png')).convert('RGBA').resize((1600,900),Image.Resampling.LANCZOS) for key in ['ready','arm','lower','release']]
save(poses[0],'assets/ui/weapons/fp/player-bomb-ready-41.webp','system.js','ready','legacy ready01 then procedural',source='ready.png')
atlas=Image.new('RGBA',(3200,1800))
for n,pose in enumerate(poses): atlas.paste(pose,((n%2)*1600,(n//2)*900))
save(atlas,'assets/ui/fx/bomb-plant-atlas-41.webp','system.js','plant/recovery/reload','decoded ready hold or procedural',grid=[2,2],sources=['ready.png','arm.png','lower.png','release.png'],plant_sequence=[0,1,2,3,3,0],release_seconds=.48,plant_seconds=.96,reload_sequence=[3,0])
# Only cells with complete silhouettes are admitted. The rejected flame tips and
# separator lines never enter runtime. Bounds use exact floor arithmetic.
accepted={'a':[0,1,4,5,6,7],'b':[0,1,2,3,5,6,7],'c':[0,4,5,6,7]}
for variant,indices in accepted.items():
 sheet=Image.open(src/('explosion-'+variant+'.png')).convert('RGBA')
 cols=4 if variant=='b' else 3
 out=Image.new('RGBA',(cols*512,1024)); windows=[]
 for n,i in enumerate(indices):
  c,r=i%4,i//4
  # 10px on C removes proven grid artifacts; padding standardizes all sources.
  gutter=10 if variant=='c' else 2
  box=(c*sheet.width//4+gutter,r*sheet.height//2+gutter,(c+1)*sheet.width//4-gutter,(r+1)*sheet.height//2-gutter)
  frame=sheet.crop(box).resize((464,464),Image.Resampling.LANCZOS)
  out.paste(frame,((n%cols)*512+24,(n//cols)*512+24))
  windows.append(list(box))
 save(out,f'assets/ui/fx/bomb-explosion-{variant}-41.webp','settings.js','real detonation only','shared Pack12+heavy26/procedural',grid=[cols,2],accepted_source_cells=indices,source_windows=windows,transparent_padding=24)
save(Image.open(src/'smoke.png').convert('RGBA').resize((768,768),Image.Resampling.LANCZOS),'assets/ui/fx/bomb-smoke-41.webp','settings.js','detonation residual smoke','legacy explosion smoke',grid=[1,1],source='smoke.png')
world=Image.open(src/'world.png').convert('RGBA')
save(world.resize((512,512),Image.Resampling.LANCZOS),'assets/ui/pickups/weapons/world-bomb-pickup-41.webp','pickups.js','real pickup projection','procedural rectangular bomb',source='world.png')
save(world.resize((128,128),Image.Resampling.LANCZOS),'assets/ui/weapons/bomb-icon-41.webp','system.js','weapon bar/inventory','bomb.svg',source='world.png')
manifest=dict(pack='bomb-41',status='INTEGRATION_CANDIDATE',generator='built-in image_gen',approval='User saw ready/action design and requested continue; lower pose corrected after explicit identity feedback. Other previews shown in chat.',files=records,sources=[dict(key=k,path='sources/'+k+'.png',sha256=hashlib.sha256((src/(k+'.png')).read_bytes()).hexdigest()) for k in names],rejected={'combined_plant_sheet':'Unequal cell boundaries','lower-v1':'Changed device component orientation','smoke_sheets':'Backdrop haze','explosion_cells':'Clipped peak silhouettes, exact accepted cells/windows recorded'})
(stage/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'runtime_files':len(records),'runtime_bytes':sum(r['bytes'] for r in records),'stage':str(stage)},ensure_ascii=False))
