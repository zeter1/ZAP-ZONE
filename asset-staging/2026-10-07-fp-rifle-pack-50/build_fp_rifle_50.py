import bpy, math, os, json, base64, struct, hashlib
from mathutils import Vector

ROOT = r"G:\МОЯ Веб-разработка\ZAP_ZONE"
STAGE = os.path.join(ROOT, "asset-staging", "2026-10-07-fp-rifle-pack-50")
MODEL_DIR = os.path.join(ROOT, "assets", "weapons", "models")
OUT_GLB = os.path.join(MODEL_DIR, "zap-fp-rifle-50.glb")
OUT_RUNTIME_JS = os.path.join(MODEL_DIR, "zap-fp-rifle-50.runtime.js")
OUT_BLEND = os.path.join(STAGE, "zap-fp-rifle-50.blend")
OUT_PREVIEW = os.path.join(STAGE, "zap-fp-rifle-preview-50.png")
OUT_MANIFEST = os.path.join(STAGE, "manifest.json")

os.makedirs(STAGE, exist_ok=True)
os.makedirs(MODEL_DIR, exist_ok=True)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)

def make_mat(name, color, metallic=0.0, rough=0.45, emission=None, emission_strength=0.0):
    m=bpy.data.materials.new(name)
    m.use_nodes=True
    bsdf=next((n for n in m.node_tree.nodes if n.type=='BSDF_PRINCIPLED'),None)
    bsdf.inputs["Base Color"].default_value=(*color,1.0)
    bsdf.inputs["Metallic"].default_value=metallic
    bsdf.inputs["Roughness"].default_value=rough
    if emission is not None:
        socket=bsdf.inputs.get("Emission Color") or bsdf.inputs.get("Emission")
        if socket: socket.default_value=(*emission,1.0)
        strength=bsdf.inputs.get("Emission Strength")
        if strength: strength.default_value=emission_strength
    return m

MAT_DARK=make_mat("MAT_DARK",(0.022,0.032,0.045),0.20,0.62)
MAT_SHELL=make_mat("MAT_SHELL",(0.085,0.11,0.145),0.30,0.43)
MAT_EDGE=make_mat("MAT_EDGE",(0.34,0.39,0.44),0.46,0.31)
MAT_ACCENT=make_mat("MAT_ACCENT",(0.035,0.40,0.92),0.09,0.32,(0.035,0.40,0.92),0.30)
MAT_GLOW=make_mat("MAT_GLOW",(0.15,0.62,1.0),0.04,0.18,(0.08,0.48,1.0),1.35)
MAT_WARNING=make_mat("MAT_WARNING",(0.96,0.30,0.035),0.10,0.34,(1.0,0.20,0.02),0.34)
MAT_GLASS=make_mat("MAT_GLASS",(0.14,0.095,0.035),0.07,0.15,(1.0,0.26,0.03),0.38)
MAT_RUBBER=make_mat("MAT_RUBBER",(0.008,0.011,0.016),0.03,0.88)
MAT_SLEEVE=make_mat("MAT_SLEEVE",(0.018,0.030,0.045),0.14,0.78)
MAT_GLOVE=make_mat("MAT_GLOVE",(0.012,0.016,0.022),0.06,0.84)

def apply_bevel(obj,width=0.016,segments=2):
    if width<=0:return
    mod=obj.modifiers.new("Bevel",'BEVEL')
    mod.width=width;mod.segments=segments;mod.limit_method='ANGLE'
    bpy.context.view_layer.objects.active=obj
    bpy.ops.object.modifier_apply(modifier=mod.name)

def box(name,size,loc,mat,rot=(0,0,0),bevel=.014):
    bpy.ops.mesh.primitive_cube_add(location=loc,rotation=rot)
    o=bpy.context.object;o.name=name
    o.scale=(size[0]/2,size[1]/2,size[2]/2)
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    apply_bevel(o,min(bevel,min(size)*.24),2)
    o.data.materials.append(mat)
    return o

def cyl(name,radius,depth,loc,mat,vertices=14,rot=(0,0,0),bevel=.006):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices,radius=radius,depth=depth,location=loc,rotation=rot)
    o=bpy.context.object;o.name=name
    apply_bevel(o,min(bevel,radius*.25,depth*.12),2)
    o.data.materials.append(mat)
    return o

def barrel(name,radius,length,loc,mat,vertices=14,bevel=.006):
    return cyl(name,radius,length,loc,mat,vertices,(math.pi/2,0,0),bevel)

def torus(name,major,minor,loc,mat,rot=(0,0,0),major_segments=18,minor_segments=6):
    bpy.ops.mesh.primitive_torus_add(major_radius=major,minor_radius=minor,major_segments=major_segments,minor_segments=minor_segments,location=loc,rotation=rot)
    o=bpy.context.object;o.name=name;o.data.materials.append(mat);return o

def prism(name,outline,depth,loc,mat,rot=(0,0,0),bevel=.012):
    n=len(outline);d=depth/2
    verts=[(x,-d,z) for x,z in outline]+[(x,d,z) for x,z in outline]
    faces=[tuple(range(n-1,-1,-1)),tuple(range(n,2*n))]
    for i in range(n):
        j=(i+1)%n;faces.append((i,j,n+j,n+i))
    mesh=bpy.data.meshes.new(name+"Mesh");mesh.from_pydata(verts,[],faces);mesh.update()
    o=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(o)
    o.location=loc;o.rotation_euler=rot
    apply_bevel(o,min(bevel,depth*.25),2);o.data.materials.append(mat);return o

def beam(name,a,b,radius,mat,vertices=10):
    a=Vector(a);b=Vector(b);d=b-a;length=d.length
    mid=(a+b)*.5
    o=cyl(name,radius,length,mid,mat,vertices,bevel=.006)
    o.rotation_euler=d.to_track_quat('Z','Y').to_euler()
    bpy.context.view_layer.objects.active=o
    bpy.ops.object.transform_apply(location=False,rotation=True,scale=False)
    return o

def join_parts(name,parts,origin=(0,0,0)):
    bpy.ops.object.select_all(action='DESELECT')
    for p in parts:p.select_set(True)
    bpy.context.view_layer.objects.active=parts[0]
    bpy.ops.object.join()
    o=bpy.context.object;o.name=name
    bpy.ops.object.transform_apply(location=False,rotation=True,scale=True)
    bpy.context.scene.cursor.location=origin
    bpy.ops.object.origin_set(type='ORIGIN_CURSOR',center='MEDIAN')
    return o

# Rifle body: recognizably the existing ZAP rifle, but with cleaner silhouette and layered mechanics.
p=[]
p += [box("rf50_upper",(.30,.80,.205),(0,.05,.065),MAT_SHELL,bevel=.030)]
p += [box("rf50_upperEdge",(.245,.68,.050),(0,.08,.190),MAT_EDGE,bevel=.009)]
p += [box("rf50_lower",(.245,.44,.15),(0,-.08,-.045),MAT_DARK,bevel=.022)]
p += [box("rf50_handguard",(.315,.58,.225),(0,.63,.045),MAT_DARK,bevel=.026)]
for x in (-.132,.132):
    p += [box("rf50_guardSide"+str(x),(.024,.50,.13),(x,.64,.045),MAT_ACCENT,bevel=.004)]
for y in (.42,.53,.64,.75,.86):
    p += [box("rf50_vent"+str(y),(.19,.030,.036),(0,y,.160),MAT_EDGE,bevel=.004)]
p += [barrel("rf50_barrel",.032,1.00,(0,1.12,.065),MAT_EDGE,14,.005)]
p += [barrel("rf50_muzzle",.052,.18,(0,1.63,.065),MAT_DARK,14,.005)]
p += [torus("rf50_muzzleGlow",.058,.011,(0,1.715,.065),MAT_WARNING,rot=(math.pi/2,0,0))]
for a in (0,math.pi/2,math.pi,math.pi*1.5):
    p += [box("rf50_muzzleMark"+str(a),(.025,.055,.025),(math.cos(a)*.052,1.655,.065+math.sin(a)*.052),MAT_WARNING,bevel=.003)]
p += [prism("rf50_stock",[(-.135,.105),(.135,.105),(.12,-.075),(.075,-.145),(-.075,-.145),(-.12,-.075)],.49,(0,-.51,.045),MAT_RUBBER,bevel=.022)]
p += [box("rf50_butt",(.26,.12,.24),(0,-.80,.045),MAT_DARK,bevel=.022)]
p += [prism("rf50_grip",[(-.07,.08),(.07,.08),(.062,-.13),(.036,-.205),(-.036,-.205),(-.062,-.13)],.18,(0,-.17,-.175),MAT_RUBBER,rot=(math.radians(-12),0,0),bevel=.012)]
p += [box("rf50_opticBase",(.17,.24,.042),(0,.00,.238),MAT_DARK,bevel=.008)]
for x in (-.070,.070):
    p += [box("rf50_holoPillar"+str(x),(.026,.13,.145),(x,.035,.315),MAT_EDGE,bevel=.006)]
p += [box("rf50_holoTop",(.165,.13,.026),(0,.035,.382),MAT_DARK,bevel=.006)]
p += [box("rf50_holoGlass",(.108,.024,.082),(0,.075,.320),MAT_GLASS,bevel=.006)]
p += [box("rf50_holoBlue",(.060,.030,.020),(0,-.075,.265),MAT_ACCENT,bevel=.004)]
p += [box("rf50_status",(.075,.13,.045),(.145,.02,.155),MAT_WARNING,bevel=.007)]
p += [box("rf50_receiverBlue",(.024,.44,.050),(-.150,.02,.105),MAT_ACCENT,bevel=.004)]
p += [box("rf50_receiverOrange",(.024,.14,.055),(.150,-.12,.105),MAT_WARNING,bevel=.004)]
# Readable right-side mechanics mirror the established Pack36 black/steel/blue/orange language.
p += [box("rf50_ejectionPort",(.020,.235,.078),(.158,.095,.075),MAT_DARK,bevel=.004)]
p += [box("rf50_ejectionInner",(.024,.145,.038),(.171,.105,.075),MAT_WARNING,bevel=.003)]
p += [box("rf50_sidePlate",(.024,.31,.115),(-.158,-.08,.025),MAT_EDGE,bevel=.007)]
p += [box("rf50_sidePlateInset",(.027,.225,.060),(-.172,-.08,.025),MAT_DARK,bevel=.004)]
for y in (-.20,-.02,.16,.44,.59,.74,.89):
    p += [cyl("rf50_bolt"+str(y),.012,.022,(.164,y,.125),MAT_EDGE,10,rot=(0,math.pi/2,0),bevel=.002)]
for y in (.43,.52,.61,.70,.79,.88):
    p += [box("rf50_guardRib"+str(y),(.325,.024,.030),(0,y,-.075),MAT_SHELL,bevel=.004)]
p += [box("rf50_guardBlueL",(.020,.49,.030),(-.160,.64,-.045),MAT_ACCENT,bevel=.003)]
p += [box("rf50_guardOrangeR",(.022,.12,.035),(.161,.48,-.045),MAT_WARNING,bevel=.003)]
p += [box("rf50_triggerFront",(.028,.12,.14),(-.055,-.055,-.135),MAT_EDGE,rot=(0,0,math.radians(-12)),bevel=.004)]
p += [box("rf50_triggerRear",(.028,.12,.14),(.055,-.055,-.135),MAT_EDGE,rot=(0,0,math.radians(12)),bevel=.004)]
for y in (-.18,-.08,.02,.12,.22):
    p += [box("rf50_topRail"+str(y),(.13,.035,.026),(0,y,.222),MAT_EDGE,bevel=.003)]
BODY=join_parts("FP50_RifleBody",p,(0,0,0))

# Magazine: own pivot at the magwell so reload can rotate and drop it.
p=[]
p += [prism("rf50_mag",[(-.10,.10),(.10,.10),(.087,-.12),(.052,-.23),(-.052,-.23),(-.087,-.12)],.20,(0,.14,-.205),MAT_DARK,rot=(math.radians(4),0,0),bevel=.014)]
p += [box("rf50_magAccent",(.165,.15,.040),(0,.14,-.322),MAT_ACCENT,bevel=.006)]
p += [box("rf50_magRib",(.19,.035,.20),(0,.14,-.22),MAT_EDGE,bevel=.004)]
MAG=join_parts("FP50_Magazine",p,(0,.10,-.075))

# Bolt/charging handle is intentionally separate for visible shot-cycle feedback.
p=[]
p += [box("rf50_bolt",(.17,.22,.038),(0,-.02,.145),MAT_EDGE,bevel=.006)]
p += [box("rf50_handle",(.12,.055,.055),(.17,-.02,.145),MAT_DARK,bevel=.008)]
p += [cyl("rf50_handleKnob",.030,.060,(.235,-.02,.145),MAT_ACCENT,10,rot=(0,math.pi/2,0),bevel=.004)]
BOLT=join_parts("FP50_Bolt",p,(0,-.02,.145))

def build_arm(prefix,side,wrist,elbow):
    parts=[]
    wrist=Vector(wrist);elbow=Vector(elbow)
    parts += [beam(prefix+"_sleeve",elbow,wrist+(elbow-wrist).normalized()*.05,.095,MAT_SLEEVE,12)]
    mid=(wrist+elbow)*.5
    parts += [box(prefix+"_armor",(.19,.30,.10),mid+(Vector((side*.018,0,.045))),MAT_SHELL,bevel=.020)]
    parts += [box(prefix+"_wristGuard",(.18,.14,.12),wrist+Vector((0,-.025,.015)),MAT_EDGE,bevel=.014)]
    parts += [box(prefix+"_wristBlue",(.035,.13,.095),wrist+Vector((side*.092,-.025,.018)),MAT_ACCENT,bevel=.006)]
    parts += [box(prefix+"_wristOrange",(.055,.035,.055),wrist+Vector((-side*.050,-.100,.045)),MAT_WARNING,bevel=.005)]
    parts += [box(prefix+"_palm",(.16,.19,.13),wrist,MAT_GLOVE,bevel=.020)]
    for i in range(4):
        x=wrist.x+(i-1.5)*.038*side
        parts += [box(prefix+"_finger"+str(i),(.032,.15,.045),(x,wrist.y+.105,wrist.z-.015),MAT_GLOVE,bevel=.008)]
    parts += [box(prefix+"_thumb",(.045,.11,.050),(wrist.x-side*.085,wrist.y+.035,wrist.z-.02),MAT_GLOVE,rot=(0,0,math.radians(24*side)),bevel=.008)]
    return join_parts(prefix,parts,elbow)

LEFT=build_arm("FP50_LeftArm",-1,(-.12,.38,-.22),(-.28,-.54,-.38))
RIGHT=build_arm("FP50_RightArm",1,(.17,-.02,-.18),(.34,-.62,-.36))

components=[BODY,MAG,BOLT,LEFT,RIGHT]
dynamic={"FP50_Magazine":"magazine","FP50_Bolt":"bolt","FP50_LeftArm":"leftArm","FP50_RightArm":"rightArm"}

# Store rest transforms before demo keyframes.
rest={}
for o in components:
    rest[o.name]={
        "p":[round(o.location.x,6),round(o.location.z,6),round(-o.location.y,6)],
        "kind":dynamic.get(o.name,"body")
    }

# Runtime derivative: local mesh data + explicit pivot/rest transform for movable parts.
runtime={"schema":1,"version":50,"weaponKey":"rifle","coordinateBridge":"Blender (x,y,z) -> runtime (x,z,-y)","muzzleZ":-1.78,"components":{}}
stats={}
depsgraph=bpy.context.evaluated_depsgraph_get()
for o in components:
    ev=o.evaluated_get(depsgraph);mesh=ev.to_mesh();mesh.calc_loop_triangles()
    buckets={}
    for tri in mesh.loop_triangles:
        poly=mesh.polygons[tri.polygon_index]
        mat_name=mesh.materials[poly.material_index].name if mesh.materials and poly.material_index<len(mesh.materials) else "MAT_DARK"
        b=buckets.setdefault(mat_name,{"p":[],"n":[]})
        for li in tri.loops:
            vi=mesh.loops[li].vertex_index;co=mesh.vertices[vi].co;cn=mesh.corner_normals[li].vector
            b["p"].extend((float(co.x),float(co.z),float(-co.y)))
            b["n"].extend((float(cn.x),float(cn.z),float(-cn.y)))
    pvals=[];nvals=[];groups=[];start=0
    for mat_name in sorted(buckets):
        b=buckets[mat_name];count=len(b["p"])//3
        pvals.extend(b["p"]);nvals.extend(b["n"]);groups.append({"start":start,"count":count,"material":mat_name});start+=count
    max_abs=max((abs(v) for v in pvals),default=1.0);qscale=max(1.0,max_abs)
    def q16(values,scale=1.0):
        q=[max(-32767,min(32767,int(round(v/scale*32767.0)))) for v in values]
        return base64.b64encode(struct.pack("<"+"h"*len(q),*q)).decode("ascii")
    runtime["components"][o.name]={"p16":q16(pvals,qscale),"n16":q16(nvals,1.0),"qScale":round(qscale,6),"groups":groups,"rest":rest[o.name]}
    stats[o.name]={"triangles":len(pvals)//9,"runtimeVertices":len(pvals)//3,"materialGroups":len(groups),"qScale":round(qscale,6),"kind":rest[o.name]["kind"]}
    ev.to_mesh_clear()

with open(OUT_RUNTIME_JS,"w",encoding="utf-8",newline="\n") as f:
    f.write("/* GENERATED by asset-staging/2026-10-07-fp-rifle-pack-50/build_fp_rifle_50.py; do not hand-edit. */\n")
    f.write("window.ZAP_FP_RIFLE_50=");json.dump(runtime,f,separators=(",",":"));f.write(";\n")

# Author a compact Blender transform animation for inspection/export.
scene=bpy.context.scene
scene.frame_start=1;scene.frame_end=72
for o in (MAG,BOLT,LEFT,RIGHT):
    o.keyframe_insert(data_path="location",frame=1)
    o.keyframe_insert(data_path="rotation_euler",frame=1)
# recoil / bolt cycle
bolt_rest=BOLT.location.copy()
BOLT.location.y-=.085;BOLT.keyframe_insert(data_path="location",frame=5)
BOLT.location=bolt_rest;BOLT.keyframe_insert(data_path="location",frame=10)
# tactical reload demonstration
mag_rest=MAG.location.copy();left_rest=LEFT.location.copy()
MAG.keyframe_insert(data_path="location",frame=20);MAG.keyframe_insert(data_path="rotation_euler",frame=20)
MAG.location.z-=.24;MAG.location.y-=.08;MAG.rotation_euler.x=math.radians(18)
MAG.keyframe_insert(data_path="location",frame=36);MAG.keyframe_insert(data_path="rotation_euler",frame=36)
LEFT.location.z-=.12;LEFT.location.y-=.10;LEFT.rotation_euler.x=math.radians(-12);LEFT.rotation_euler.z=math.radians(-8)
LEFT.keyframe_insert(data_path="location",frame=34);LEFT.keyframe_insert(data_path="rotation_euler",frame=34)
MAG.location=mag_rest;MAG.rotation_euler=(0,0,0);MAG.keyframe_insert(data_path="location",frame=54);MAG.keyframe_insert(data_path="rotation_euler",frame=54)
LEFT.location=left_rest;LEFT.rotation_euler=(0,0,0);LEFT.keyframe_insert(data_path="location",frame=54);LEFT.keyframe_insert(data_path="rotation_euler",frame=54)
for o in (MAG,BOLT,LEFT,RIGHT):
    o.keyframe_insert(data_path="location",frame=72);o.keyframe_insert(data_path="rotation_euler",frame=72)
scene.frame_set(1)

bpy.ops.object.select_all(action='DESELECT')
for o in components:o.select_set(True)
bpy.context.view_layer.objects.active=BODY
bpy.ops.export_scene.gltf(filepath=OUT_GLB,export_format='GLB',use_selection=True,export_apply=True,export_yup=True,export_texcoords=False,export_materials='EXPORT',export_cameras=False,export_lights=False,export_animations=True)

# FPS-style preview from behind the weapon, showing both arms and top mechanics.
bpy.ops.mesh.primitive_plane_add(size=12,location=(0,.6,-.58))
ground=bpy.context.object;ground.data.materials.append(make_mat("MAT_PREVIEW_GROUND",(0.012,0.018,0.028),0.02,0.88))
def look_at(obj,target):
    obj.rotation_euler=(Vector(target)-obj.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add(location=(1.75,-2.65,1.20))
cam=bpy.context.object;cam.data.lens=52;scene.camera=cam;look_at(cam,(0,.42,.00))
for loc,energy,size in [((-3,-3,5),1250,4.0),((3,-.5,4),950,3.2),((0,4,5),1100,3.4)]:
    bpy.ops.object.light_add(type='AREA',location=loc)
    lamp=bpy.context.object;lamp.data.energy=energy;lamp.data.size=size;look_at(lamp,(0,.35,.0))
scene.render.engine='BLENDER_EEVEE'
scene.render.resolution_x=1400;scene.render.resolution_y=900;scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG';scene.world.color=(0.003,0.006,0.012)
scene.render.filepath=OUT_PREVIEW
scene.view_settings.look='AgX - Medium High Contrast'
bpy.ops.wm.save_as_mainfile(filepath=OUT_BLEND)
bpy.ops.render.render(write_still=True)

def identity(path):
    h=hashlib.sha256()
    with open(path,"rb") as f:
        for chunk in iter(lambda:f.read(1024*1024),b""):h.update(chunk)
    return {"bytes":os.path.getsize(path),"sha256":h.hexdigest()}

manifest={
    "schema":1,"packVersion":50,"weaponKey":"rifle","blenderVersion":bpy.app.version_string,
    "coordinateBridge":"Blender (x,y,z) -> runtime (x,z,-y); dynamic components preserve Blender-authored pivots",
    "fallback":"Pack36 generated rifle art and existing procedural first-person rifle remain intact",
    "components":stats,
    "animation":{"blenderFrames":[1,5,10,20,36,54,72],"runtimeOwner":"src/weapons/first-person-rifle-model3d.js"},
    "artifacts":{"glb":identity(OUT_GLB),"runtimeJs":identity(OUT_RUNTIME_JS),"blend":identity(OUT_BLEND),"preview":identity(OUT_PREVIEW),"builder":identity(__file__)}
}
with open(OUT_MANIFEST,"w",encoding="utf-8",newline="\n") as f:json.dump(manifest,f,ensure_ascii=False,indent=2);f.write("\n")
print("ZAP_FP_RIFLE50_GLB",OUT_GLB)
print("ZAP_FP_RIFLE50_RUNTIME",OUT_RUNTIME_JS)
print("ZAP_FP_RIFLE50_BLEND",OUT_BLEND)
print("ZAP_FP_RIFLE50_PREVIEW",OUT_PREVIEW)
print("ZAP_FP_RIFLE50_MANIFEST",OUT_MANIFEST)
