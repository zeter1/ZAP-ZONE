import bpy
import os
import math
import json
import base64
import struct
import hashlib
from mathutils import Vector

ROOT=os.path.abspath(os.path.join(os.path.dirname(__file__),"..",".."))
PACK=os.path.join(ROOT,"asset-staging","2026-10-07-floor-3d-pack-48")
OUT_BLEND=os.path.join(PACK,"zap-floor-modular-48.blend")
OUT_GLB=os.path.join(ROOT,"assets","environment","models","zap-floor-modular-48.glb")
OUT_RUNTIME=os.path.join(ROOT,"assets","environment","models","zap-floor-modular-48.runtime.js")
OUT_PREVIEW=os.path.join(PACK,"zap-floor-modular-preview-48.png")
OUT_MANIFEST=os.path.join(PACK,"manifest.json")
os.makedirs(os.path.dirname(OUT_GLB),exist_ok=True)

bpy.ops.wm.read_factory_settings(use_empty=True)
scene=bpy.context.scene
scene.unit_settings.system='METRIC'
scene.unit_settings.scale_length=1.0

def mat(name,color,metal=.0,rough=.5,emissive=None,ei=0):
    m=bpy.data.materials.new(name)
    m.use_nodes=True
    bsdf=m.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value=(*color,1)
    bsdf.inputs["Metallic"].default_value=metal
    bsdf.inputs["Roughness"].default_value=rough
    if emissive:
        bsdf.inputs["Emission Color"].default_value=(*emissive,1)
        bsdf.inputs["Emission Strength"].default_value=ei
    return m

MATS={
    "MAT_DARK":mat("MAT_DARK",(0.025,0.035,0.050),.46,.62),
    "MAT_SHELL":mat("MAT_SHELL",(0.20,0.28,0.34),.44,.42),
    "MAT_EDGE":mat("MAT_EDGE",(0.48,0.57,0.63),.60,.31),
    "MAT_ACCENT":mat("MAT_ACCENT",(0.035,0.52,0.72),.16,.35,(0.01,0.18,0.28),.34),
    "MAT_GLOW":mat("MAT_GLOW",(0.09,0.82,1.00),.08,.23,(0.03,0.50,0.82),1.05),
    "MAT_WARNING":mat("MAT_WARNING",(0.90,0.30,0.035),.20,.36,(0.36,0.055,0.004),.28),
    "MAT_RUBBER":mat("MAT_RUBBER",(0.018,0.022,0.028),.04,.86),
}

def apply_bevel(o,amount=.025,segments=1):
    if amount<=0:return
    mod=o.modifiers.new("Bevel","BEVEL")
    mod.width=amount
    mod.segments=segments
    bpy.context.view_layer.objects.active=o
    bpy.ops.object.modifier_apply(modifier=mod.name)

def box(name,size,loc=(0,0,0),material="MAT_SHELL",bevel=.02,rot=(0,0,0)):
    bpy.ops.mesh.primitive_cube_add(location=loc,rotation=rot)
    o=bpy.context.object
    o.name=name
    o.dimensions=size
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    o.data.materials.append(MATS[material])
    apply_bevel(o,bevel)
    return o

def cyl(name,r,depth,loc=(0,0,0),material="MAT_EDGE",verts=16,rot=(0,0,0),bevel=.01):
    bpy.ops.mesh.primitive_cylinder_add(vertices=verts,radius=r,depth=depth,location=loc,rotation=rot)
    o=bpy.context.object
    o.name=name
    o.data.materials.append(MATS[material])
    apply_bevel(o,bevel)
    return o

def torus(name,major,minor,loc=(0,0,0),material="MAT_EDGE",rot=(0,0,0),segments=24):
    bpy.ops.mesh.primitive_torus_add(major_radius=major,minor_radius=minor,major_segments=segments,minor_segments=6,location=loc,rotation=rot)
    o=bpy.context.object
    o.name=name
    o.data.materials.append(MATS[material])
    return o

def join_component(name,parts):
    bpy.ops.object.select_all(action='DESELECT')
    for p in parts:p.select_set(True)
    bpy.context.view_layer.objects.active=parts[0]
    bpy.ops.object.join()
    o=bpy.context.object
    o.name=name
    o.location=(0,0,0)
    o.rotation_euler=(0,0,0)
    o.scale=(1,1,1)
    o["zap_floor_kit_component"]=True
    return o

def edge_frame(prefix,p,w=8,d=8,z=-.015):
    p += [
        box(prefix+"_n",(w,.14,.07),(0,d/2-.07,z),"MAT_EDGE",.018),
        box(prefix+"_s",(w,.14,.07),(0,-d/2+.07,z),"MAT_EDGE",.018),
        box(prefix+"_e",(.14,d-.28,.07),(w/2-.07,0,z),"MAT_EDGE",.018),
        box(prefix+"_w",(.14,d-.28,.07),(-w/2+.07,0,z),"MAT_EDGE",.018),
    ]

def floor_panel():
    p=[box("panel_core",(8,8,.07),(0,0,-.070),"MAT_DARK",.025)]
    for x in (-2.0,2.0):
        for y in (-2.0,2.0):
            mat_name="MAT_SHELL" if (x+y)>=0 else "MAT_DARK"
            p.append(box("panel_plate",(3.82,3.82,.045),(x,y,-.026),mat_name,.028))
    p += [
        box("panel_seam_x",(7.72,.09,.055),(0,0,-.006),"MAT_EDGE",.012),
        box("panel_seam_y",(.09,7.72,.055),(0,0,-.006),"MAT_EDGE",.012),
        box("panel_status",(1.35,.16,.055),(-2.65,3.25,.005),"MAT_GLOW",.010),
        box("panel_warn",(1.05,.16,.055),(2.55,-3.25,.005),"MAT_WARNING",.010),
    ]
    edge_frame("panel",p)
    for x in (-3.52,-.42,.42,3.52):
        for y in (-3.52,3.52):
            p.append(cyl("panel_bolt",.045,.045,(x,y,.006),"MAT_EDGE",8,bevel=.006))
    return join_component("FLOOR_Panel_8m",p)

def floor_far():
    # Deliberately low-frequency distance LOD: one two-triangle surface,
    # no thickness, bevels, seams, bolts, rails or grate bars that can alias.
    # Z=-0.0035 matches the upper face of the detailed panel plates.
    bpy.ops.mesh.primitive_plane_add(size=8,location=(0,0,-.0035))
    o=bpy.context.object
    o.name="FLOOR_Far_8m"
    o.data.materials.append(MATS["MAT_SHELL"])
    bpy.ops.object.transform_apply(location=True,rotation=False,scale=False)
    o.location=(0,0,0)
    o.rotation_euler=(0,0,0)
    o.scale=(1,1,1)
    o["zap_floor_kit_component"]=True
    return o

def floor_trench():
    p=[
        # Keep the active join object at world origin. bpy.ops.object.join() adopts
        # the active object's origin, so an offset first part would shift the whole component.
        box("trench_channel",(3.62,7.72,.035),(0,0,-.145),"MAT_RUBBER",.015),
        box("trench_left",(2.12,8,.08),(-2.94,0,-.055),"MAT_SHELL",.025),
        box("trench_right",(2.12,8,.08),(2.94,0,-.055),"MAT_SHELL",.025),
        box("trench_rail_l",(.18,7.72,.11),(-1.90,0,-.025),"MAT_EDGE",.018),
        box("trench_rail_r",(.18,7.72,.11),(1.90,0,-.025),"MAT_EDGE",.018),
    ]
    for y in (-3.45,-2.72,-1.99,-1.26,-.53,.20,.93,1.66,2.39,3.12):
        p.append(box("trench_grate",(3.62,.11,.075),(0,y,-.040),"MAT_EDGE",.012))
    for x,mat_name in ((-.92,"MAT_ACCENT"),(-.35,"MAT_DARK"),(.38,"MAT_WARNING"),(.94,"MAT_ACCENT")):
        p.append(cyl("trench_cable",.055,6.8,(x,0,-.105),mat_name,10,rot=(math.pi/2,0,0),bevel=.006))
    p += [
        box("trench_node_l",(.62,.52,.10),(-2.72,-2.70,-.005),"MAT_DARK",.025),
        box("trench_node_r",(.62,.52,.10),(2.72,2.70,-.005),"MAT_DARK",.025),
        box("trench_glow_l",(.34,.10,.055),(-2.72,-2.70,.050),"MAT_GLOW",.010),
        box("trench_glow_r",(.34,.10,.055),(2.72,2.70,.050),"MAT_GLOW",.010),
    ]
    edge_frame("trench",p)
    return join_component("FLOOR_Trench_8m",p)

def floor_grate():
    p=[box("grate_back",(7.64,7.64,.035),(0,0,-.115),"MAT_RUBBER",.012)]
    edge_frame("grate",p,z=-.018)
    for x in (-3.15,-2.45,-1.75,-1.05,-.35,.35,1.05,1.75,2.45,3.15):
        p.append(box("grate_v",(.095,7.46,.075),(x,0,-.035),"MAT_EDGE",.010))
    for y in (-3.15,-2.45,-1.75,-1.05,-.35,.35,1.05,1.75,2.45,3.15):
        p.append(box("grate_h",(7.46,.095,.075),(0,y,-.032),"MAT_SHELL",.010))
    p += [
        box("grate_warn_n",(2.1,.13,.055),(0,3.58,.020),"MAT_WARNING",.010),
        box("grate_warn_s",(2.1,.13,.055),(0,-3.58,.020),"MAT_WARNING",.010),
    ]
    return join_component("FLOOR_Grate_8m",p)

def floor_hatch():
    p=[box("hatch_base",(8,8,.075),(0,0,-.070),"MAT_SHELL",.025)]
    edge_frame("hatch",p)
    p += [
        cyl("hatch_disc",2.20,.07,(0,0,-.015),"MAT_DARK",24,bevel=.015),
        torus("hatch_ring",2.24,.030,(0,0,.025),"MAT_EDGE"),
        torus("hatch_inner",1.62,.025,(0,0,.030),"MAT_ACCENT"),
        box("hatch_cross_x",(3.05,.15,.07),(0,0,.025),"MAT_EDGE",.014),
        box("hatch_cross_y",(.15,3.05,.07),(0,0,.025),"MAT_EDGE",.014),
        box("hatch_status",(.82,.18,.06),(0,-2.72,.022),"MAT_GLOW",.010),
    ]
    for a in range(8):
        ang=a*math.pi/4
        p.append(cyl("hatch_latch",.11,.055,(math.cos(ang)*2.53,math.sin(ang)*2.53,.015),"MAT_WARNING" if a%2 else "MAT_EDGE",8,bevel=.006))
    return join_component("FLOOR_Hatch_8m",p)

def floor_guide():
    p=[box("guide_base",(8,8,.075),(0,0,-.070),"MAT_DARK",.025)]
    edge_frame("guide",p)
    p += [
        box("guide_lane_l",(.24,7.55,.055),(-1.42,0,.002),"MAT_WARNING",.010),
        box("guide_lane_r",(.24,7.55,.055),(1.42,0,.002),"MAT_WARNING",.010),
        box("guide_light_l",(.08,7.20,.058),(-.86,0,.006),"MAT_GLOW",.008),
        box("guide_light_r",(.08,7.20,.058),(.86,0,.006),"MAT_GLOW",.008),
        box("guide_center",(.12,7.30,.052),(0,0,-.002),"MAT_EDGE",.008),
    ]
    for y in (-2.75,-.95,.95,2.75):
        p.append(box("guide_chev_l",(1.10,.14,.050),(-.36,y,.015),"MAT_ACCENT",.010,rot=(0,0,.42)))
        p.append(box("guide_chev_r",(1.10,.14,.050),(.36,y,.015),"MAT_ACCENT",.010,rot=(0,0,-.42)))
    return join_component("FLOOR_Guide_8m",p)

def floor_capture():
    # Capture-zone art is a decal-like overlay over the modular tiles. Do not add
    # a broad 12x12 base plate here: coplanar floor layers cause visible z-fighting.
    p=[cyl("capture_center",1.55,.07,(0,0,-.010),"MAT_SHELL",24,bevel=.018)]
    edge_frame("capture",p,12,12,.018)
    p += [
        torus("capture_outer",4.72,.030,(0,0,.018),"MAT_EDGE",segments=32),
        torus("capture_mid",3.88,.028,(0,0,.024),"MAT_GLOW",segments=32),
        torus("capture_inner",2.34,.025,(0,0,.026),"MAT_ACCENT",segments=24),
        box("capture_status",(1.45,.18,.065),(0,-5.18,.015),"MAT_GLOW",.010),
    ]
    for a in range(8):
        ang=a*math.pi/4
        x=math.cos(ang)*3.05
        y=math.sin(ang)*3.05
        p.append(box("capture_spoke",(2.10,.13,.055),(x,y,.008),"MAT_EDGE",.010,rot=(0,0,ang)))
        x2=math.cos(ang)*5.18
        y2=math.sin(ang)*5.18
        p.append(box("capture_warn",(.78,.18,.055),(x2,y2,.012),"MAT_WARNING",.010,rot=(0,0,ang)))
    return join_component("FLOOR_Capture_12m",p)

components=[
    floor_panel(),floor_far(),floor_trench(),floor_grate(),floor_hatch(),floor_guide(),floor_capture()
]

runtime={"version":48,"components":{}}
stats={}
for o in components:
    mesh=o.data
    mesh.calc_loop_triangles()
    buckets={}
    for tri in mesh.loop_triangles:
        slot=o.material_slots[tri.material_index] if tri.material_index<len(o.material_slots) else None
        mat_name=slot.material.name if slot and slot.material else "MAT_DARK"
        b=buckets.setdefault(mat_name,{"p":[],"n":[]})
        for vi,li in zip(tri.vertices,tri.loops):
            co=mesh.vertices[vi].co
            no=mesh.corner_normals[li].vector
            b["p"].extend((float(co.x),float(co.z),float(-co.y)))
            b["n"].extend((float(no.x),float(no.z),float(-no.y)))
    flat=[v for b in buckets.values() for v in b["p"]]
    qscale=max((abs(v) for v in flat),default=1.0) or 1.0
    p_all=[]
    n_all=[]
    groups=[]
    start=0
    for mat_name in sorted(buckets):
        b=buckets[mat_name]
        count=len(b["p"])//3
        p_all.extend(v/qscale for v in b["p"])
        n_all.extend(b["n"])
        groups.append({"start":start,"count":count,"material":mat_name})
        start+=count
    def q16(vals):
        arr=[max(-32767,min(32767,int(round(v*32767)))) for v in vals]
        return base64.b64encode(struct.pack("<"+"h"*len(arr),*arr)).decode("ascii")
    runtime["components"][o.name]={"p16":q16(p_all),"n16":q16(n_all),"qScale":round(qscale,6),"groups":groups}
    stats[o.name]={"triangles":len(p_all)//9,"runtimeVertices":len(p_all)//3,"materialGroups":len(groups),"qScale":round(qscale,6)}

qscale_limits={
    "FLOOR_Panel_8m":4.15,"FLOOR_Far_8m":4.15,"FLOOR_Trench_8m":4.15,"FLOOR_Grate_8m":4.15,
    "FLOOR_Hatch_8m":4.15,"FLOOR_Guide_8m":4.15,"FLOOR_Capture_12m":6.15
}
for name,limit in qscale_limits.items():
    actual=stats[name]["qScale"]
    if actual>limit:
        raise RuntimeError(f"{name} qScale {actual} exceeds {limit}; component origin/transform likely drifted")

bpy.ops.object.select_all(action='DESELECT')
for o in components:o.select_set(True)
bpy.context.view_layer.objects.active=components[0]
bpy.ops.export_scene.gltf(
    filepath=OUT_GLB,export_format='GLB',use_selection=True,export_apply=True,
    export_yup=True,export_materials='EXPORT',export_texcoords=False,
    export_cameras=False,export_lights=False,export_animations=False
)

with open(OUT_RUNTIME,"w",encoding="utf-8",newline="\n") as f:
    f.write("/* GENERATED by build_floor_kit_48.py; do not hand-edit. */\nwindow.ZAP_FLOOR_KIT_48=")
    json.dump(runtime,f,separators=(",",":"))
    f.write(";\n")

for o in components:o.hide_render=True
preview_names=[o.name for o in components]
preview_positions=[(-12,6),(-4,6),(4,6),(12,6),(-8,-6),(0,-6),(8,-6)]
for name,(x,y) in zip(preview_names,preview_positions):
    src=bpy.data.objects[name]
    o=src.copy()
    o.data=src.data.copy()
    bpy.context.collection.objects.link(o)
    o.hide_render=False
    o.location=(x,y,0)

bpy.ops.mesh.primitive_plane_add(size=38,location=(0,0,-.18))
ground=bpy.context.object
ground.data.materials.append(mat("MAT_PREVIEW_GROUND",(0.010,0.014,0.020),.03,.92))

bpy.ops.object.camera_add(location=(22,-28,24))
cam=bpy.context.object
scene.camera=cam
def look_at(obj,target):
    obj.rotation_euler=(Vector(target)-obj.location).to_track_quat('-Z','Y').to_euler()
look_at(cam,(0,0,0))
cam.data.lens=52
for loc,energy,size in [((-12,-8,20),1500,7),((15,-2,13),950,6),((2,16,18),1150,6)]:
    bpy.ops.object.light_add(type='AREA',location=loc)
    l=bpy.context.object
    l.data.energy=energy
    l.data.shape='DISK'
    l.data.size=size
    look_at(l,(0,0,0))
scene.render.engine='BLENDER_EEVEE'
scene.render.resolution_x=1500
scene.render.resolution_y=950
scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG'
scene.render.filepath=OUT_PREVIEW
if scene.world is None:
    scene.world=bpy.data.worlds.new('ZAP_FLOOR_KIT_WORLD')
scene.world.color=(0.003,0.006,0.010)
scene.view_settings.look='AgX - Medium High Contrast'
bpy.ops.wm.save_as_mainfile(filepath=OUT_BLEND)
bpy.ops.render.render(write_still=True)

def ident(path):
    h=hashlib.sha256()
    with open(path,"rb") as f:
        for chunk in iter(lambda:f.read(1024*1024),b""):h.update(chunk)
    return {"bytes":os.path.getsize(path),"sha256":h.hexdigest()}

manifest={
    "schema":1,
    "packVersion":48,
    "generator":"asset-staging/2026-10-07-floor-3d-pack-48/build_floor_kit_48.py",
    "blenderVersion":bpy.app.version_string,
    "coordinateBridge":"Blender (x,y,z) -> runtime (x,z,-y); positions q16-normalized per component by qScale",
    "collisionContract":"visual floor only; arenaFloor remains the flat gameplay ground owner",
    "components":stats,
    "artifacts":{
        "glb":ident(OUT_GLB),
        "runtimeJs":ident(OUT_RUNTIME),
        "blend":ident(OUT_BLEND),
        "preview":ident(OUT_PREVIEW),
        "builder":ident(__file__)
    }
}
with open(OUT_MANIFEST,"w",encoding="utf-8",newline="\n") as f:
    json.dump(manifest,f,ensure_ascii=False,indent=2)
    f.write("\n")

print("ZAP_FLOOR_KIT_BLEND",OUT_BLEND)
print("ZAP_FLOOR_KIT_GLB",OUT_GLB)
print("ZAP_FLOOR_KIT_RUNTIME",OUT_RUNTIME)
print("ZAP_FLOOR_KIT_PREVIEW",OUT_PREVIEW)
print("ZAP_FLOOR_KIT_MANIFEST",OUT_MANIFEST)
