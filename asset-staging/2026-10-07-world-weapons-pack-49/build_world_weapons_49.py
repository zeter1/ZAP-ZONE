import bpy, math, os, json, base64, struct, hashlib
from mathutils import Vector

ROOT = r"G:\МОЯ Веб-разработка\ZAP_ZONE"
STAGE = os.path.join(ROOT, "asset-staging", "2026-10-07-world-weapons-pack-49")
MODEL_DIR = os.path.join(ROOT, "assets", "weapons", "models")
OUT_GLB = os.path.join(MODEL_DIR, "zap-world-weapons-49.glb")
OUT_RUNTIME_JS = os.path.join(MODEL_DIR, "zap-world-weapons-49.runtime.js")
OUT_BLEND = os.path.join(STAGE, "zap-world-weapons-49.blend")
OUT_PREVIEW = os.path.join(STAGE, "zap-world-weapons-preview-49.png")
OUT_MANIFEST = os.path.join(STAGE, "manifest.json")

os.makedirs(STAGE, exist_ok=True)
os.makedirs(MODEL_DIR, exist_ok=True)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)

def make_mat(name, color, metallic=0.0, rough=0.45, emission=None, emission_strength=0.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    bsdf = next((n for n in m.node_tree.nodes if n.type == 'BSDF_PRINCIPLED'), None)
    if bsdf is None:
        bsdf = m.node_tree.nodes.new("ShaderNodeBsdfPrincipled")
        out = next((n for n in m.node_tree.nodes if n.type == 'OUTPUT_MATERIAL'), None)
        if out is None:
            out = m.node_tree.nodes.new("ShaderNodeOutputMaterial")
        m.node_tree.links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
    bsdf.inputs["Base Color"].default_value = (*color, 1.0)
    bsdf.inputs["Metallic"].default_value = metallic
    bsdf.inputs["Roughness"].default_value = rough
    if emission is not None:
        if bsdf.inputs.get("Emission Color"):
            bsdf.inputs["Emission Color"].default_value = (*emission, 1.0)
        elif bsdf.inputs.get("Emission"):
            bsdf.inputs["Emission"].default_value = (*emission, 1.0)
        if bsdf.inputs.get("Emission Strength"):
            bsdf.inputs["Emission Strength"].default_value = emission_strength
    return m

MAT_DARK = make_mat("MAT_DARK", (0.025, 0.038, 0.052), 0.18, 0.62)
MAT_SHELL = make_mat("MAT_SHELL", (0.19, 0.23, 0.27), 0.34, 0.38)
MAT_EDGE = make_mat("MAT_EDGE", (0.47, 0.54, 0.59), 0.50, 0.28)
MAT_ACCENT = make_mat("MAT_ACCENT", (0.10, 0.58, 0.92), 0.10, 0.34, (0.10, 0.58, 0.92), 0.20)
MAT_GLOW = make_mat("MAT_GLOW", (0.31, 0.90, 1.0), 0.06, 0.18, (0.31, 0.90, 1.0), 1.7)
MAT_GLASS = make_mat("MAT_GLASS", (0.08, 0.34, 0.43), 0.10, 0.16, (0.18, 0.74, 0.95), 0.55)
MAT_RUBBER = make_mat("MAT_RUBBER", (0.012, 0.017, 0.023), 0.03, 0.84)
MAT_WARNING = make_mat("MAT_WARNING", (0.95, 0.39, 0.08), 0.12, 0.42, (0.95, 0.24, 0.04), 0.16)

def apply_bevel(obj, width=0.018, segments=2):
    if width <= 0:
        return
    mod = obj.modifiers.new("Bevel", 'BEVEL')
    mod.width = width
    mod.segments = segments
    mod.limit_method = 'ANGLE'
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.modifier_apply(modifier=mod.name)

def box(name, size, loc, mat, rot=(0,0,0), bevel=0.018):
    bpy.ops.mesh.primitive_cube_add(location=loc, rotation=rot)
    o = bpy.context.object
    o.name = name
    o.scale = (size[0]/2, size[1]/2, size[2]/2)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    apply_bevel(o, min(bevel, min(size)*0.24), 2)
    o.data.materials.append(mat)
    return o

def cyl(name, radius, depth, loc, mat, vertices=12, rot=(0,0,0), bevel=0.008):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=loc, rotation=rot)
    o = bpy.context.object
    o.name = name
    apply_bevel(o, min(bevel, radius*0.25, depth*0.12), 2)
    o.data.materials.append(mat)
    return o

def barrel(name, radius, length, loc, mat, vertices=12, bevel=0.006):
    return cyl(name, radius, length, loc, mat, vertices, rot=(math.pi/2,0,0), bevel=bevel)

def torus(name, major, minor, loc, mat, rot=(0,0,0), major_segments=16, minor_segments=6):
    bpy.ops.mesh.primitive_torus_add(major_radius=major, minor_radius=minor, major_segments=major_segments,
                                    minor_segments=minor_segments, location=loc, rotation=rot)
    o=bpy.context.object
    o.name=name
    o.data.materials.append(mat)
    return o

def prism(name, outline, depth, loc, mat, rot=(0,0,0), bevel=0.012):
    # outline uses local X/Z; depth runs along local Y (weapon forward axis).
    n=len(outline); d=depth/2
    verts=[(x,-d,z) for x,z in outline]+[(x,d,z) for x,z in outline]
    faces=[tuple(range(n-1,-1,-1)), tuple(range(n,2*n))]
    for i in range(n):
        j=(i+1)%n
        faces.append((i,j,n+j,n+i))
    mesh=bpy.data.meshes.new(name+"Mesh")
    mesh.from_pydata(verts,[],faces); mesh.update()
    o=bpy.data.objects.new(name,mesh); bpy.context.collection.objects.link(o)
    o.location=loc; o.rotation_euler=rot
    apply_bevel(o, min(bevel, depth*0.25), 2)
    o.data.materials.append(mat)
    return o

def join_component(name, parts):
    bpy.ops.object.select_all(action='DESELECT')
    for p in parts:
        p.select_set(True)
    bpy.context.view_layer.objects.active=parts[0]
    bpy.ops.object.join()
    o=bpy.context.object
    o.name=name
    # Joining keeps the active source object's transform. The rocket component
    # starts from a barrel rotated onto Blender +Y, so bake rotation/scale before
    # runtime q16 extraction or its local forward axis would be rotated by 90°.
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    bpy.context.scene.cursor.location=(0,0,0)
    bpy.ops.object.origin_set(type='ORIGIN_CURSOR', center='MEDIAN')
    o.location=(0,0,0)
    return o

def side_rail(parts, prefix, y0, y1, z, width, mat=MAT_EDGE):
    length=y1-y0
    for side in (-1,1):
        parts.append(box(f"{prefix}_{side}", (width,length,.028), (side*.145,(y0+y1)/2,z), mat, bevel=.005))

components=[]
weapon_meta={
    "pistol":{"component":"ZAP_WPN_Pistol","muzzleZ":-.72},
    "shotgun":{"component":"ZAP_WPN_Shotgun","muzzleZ":-1.13},
    "rifle":{"component":"ZAP_WPN_Rifle","muzzleZ":-1.38},
    "plasma":{"component":"ZAP_WPN_Plasma","muzzleZ":-1.15},
    "sniper":{"component":"ZAP_WPN_Sniper","muzzleZ":-1.76},
    "rocket":{"component":"ZAP_WPN_Rocket","muzzleZ":-1.02},
}

# PISTOL — compact service sidearm with layered slide, frame and readable muzzle.
p=[]
p += [box("pi_frame",(.24,.48,.16),(0,.02,.02),MAT_SHELL,bevel=.026)]
p += [box("pi_slide",(.225,.56,.13),(0,.12,.105),MAT_EDGE,bevel=.020)]
p += [box("pi_slideInset",(.185,.31,.035),(0,.12,.175),MAT_DARK,bevel=.006)]
p += [barrel("pi_barrel",.036,.58,(0,.21,.09),MAT_DARK,14,.006)]
p += [torus("pi_muzzleRing",.052,.011,(0,.49,.09),MAT_ACCENT,rot=(math.pi/2,0,0),major_segments=18)]
p += [prism("pi_grip",[(-.082,.10),(.082,.10),(.070,-.15),(.040,-.24),(-.040,-.24),(-.070,-.15)],.18,(0,-.15,-.16),MAT_RUBBER,rot=(math.radians(-8),0,0),bevel=.014)]
p += [box("pi_gripPanelL",(.018,.14,.28),(-.092,-.15,-.16),MAT_ACCENT,rot=(math.radians(-8),0,0),bevel=.004)]
p += [box("pi_gripPanelR",(.018,.14,.28),(.092,-.15,-.16),MAT_DARK,rot=(math.radians(-8),0,0),bevel=.004)]
p += [box("pi_triggerBlock",(.15,.13,.075),(0,.00,-.045),MAT_DARK,bevel=.016)]
p += [box("pi_frontSight",(.035,.045,.055),(0,.365,.195),MAT_GLOW,bevel=.006)]
p += [box("pi_rearSight",(.09,.045,.045),(0,-.105,.188),MAT_DARK,bevel=.006)]
side_rail(p,"pi_rail",-.02,.30,.145,.018,MAT_ACCENT)
for y in (-.08,.00,.08,.16):
    p.append(box(f"pi_serration_{y}",(.18,.018,.026),(0,y,.176),MAT_DARK,bevel=.002))
components.append(join_component("ZAP_WPN_Pistol",p))

# SHOTGUN — tactical pump shotgun with paired barrel/tube silhouette.
p=[]
p += [box("sg_receiver",(.285,.64,.20),(0,.02,.03),MAT_SHELL,bevel=.030)]
p += [box("sg_receiverTop",(.22,.48,.060),(0,.05,.16),MAT_EDGE,bevel=.010)]
p += [barrel("sg_barrel",.046,1.12,(0,.69,.11),MAT_EDGE,14,.006)]
p += [barrel("sg_magTube",.040,.94,(0,.62,.01),MAT_DARK,12,.006)]
p += [torus("sg_muzzle",.061,.012,(0,1.245,.11),MAT_WARNING,rot=(math.pi/2,0,0),major_segments=18)]
p += [box("sg_pump",(.31,.34,.19),(0,.58,-.02),MAT_RUBBER,bevel=.024)]
for x in (-.115,-.058,0,.058,.115):
    p.append(box("sg_pumpRib"+str(x),(.024,.29,.205),(x,.58,-.02),MAT_EDGE,bevel=.004))
p += [prism("sg_stock",[(-.13,.10),(.13,.10),(.11,-.10),(.075,-.17),(-.075,-.17),(-.11,-.10)],.52,(0,-.49,.00),MAT_DARK,bevel=.022)]
p += [box("sg_butt",(.25,.12,.27),(0,-.79,-.02),MAT_RUBBER,bevel=.022)]
p += [prism("sg_grip",[(-.07,.08),(.07,.08),(.06,-.13),(.035,-.19),(-.035,-.19),(-.06,-.13)],.16,(0,-.20,-.17),MAT_RUBBER,rot=(math.radians(-10),0,0),bevel=.012)]
side_rail(p,"sg_side",.08,.48,.12,.020,MAT_ACCENT)
p += [box("sg_sight",(.09,.16,.055),(0,.10,.215),MAT_GLASS,bevel=.010)]
components.append(join_component("ZAP_WPN_Shotgun",p))

# RIFLE — mid-poly modular assault rifle with optic, magazine and handguard.
p=[]
p += [box("rf_upper",(.29,.78,.20),(0,.05,.06),MAT_SHELL,bevel=.030)]
p += [box("rf_upperEdge",(.245,.66,.050),(0,.08,.185),MAT_EDGE,bevel=.009)]
p += [box("rf_handguard",(.31,.54,.22),(0,.62,.04),MAT_DARK,bevel=.026)]
for x in (-.13,.13):
    p.append(box("rf_handguardSide"+str(x),(.022,.46,.12),(x,.62,.04),MAT_ACCENT,bevel=.004))
for y in (.42,.53,.64,.75,.86):
    p.append(box("rf_vent"+str(y),(.19,.030,.035),(0,y,.155),MAT_EDGE,bevel=.004))
p += [barrel("rf_barrel",.032,.94,(0,1.08,.06),MAT_EDGE,12,.005)]
p += [barrel("rf_muzzle",.050,.16,(0,1.55,.06),MAT_DARK,12,.005)]
p += [torus("rf_muzzleGlow",.055,.010,(0,1.625,.06),MAT_ACCENT,rot=(math.pi/2,0,0),major_segments=18)]
p += [prism("rf_stock",[(-.13,.10),(.13,.10),(.115,-.075),(.07,-.145),(-.07,-.145),(-.115,-.075)],.48,(0,-.50,.04),MAT_RUBBER,bevel=.022)]
p += [box("rf_butt",(.255,.12,.235),(0,-.79,.04),MAT_DARK,bevel=.022)]
p += [prism("rf_grip",[(-.067,.08),(.067,.08),(.06,-.13),(.035,-.20),(-.035,-.20),(-.06,-.13)],.17,(0,-.16,-.17),MAT_RUBBER,rot=(math.radians(-12),0,0),bevel=.012)]
p += [prism("rf_mag",[(-.095,.10),(.095,.10),(.082,-.12),(.05,-.22),(-.05,-.22),(-.082,-.12)],.19,(0,.15,-.20),MAT_DARK,rot=(math.radians(4),0,0),bevel=.014)]
p += [box("rf_magAccent",(.16,.14,.040),(0,.15,-.31),MAT_ACCENT,bevel=.006)]
p += [box("rf_opticBase",(.14,.28,.045),(0,.00,.235),MAT_DARK,bevel=.008)]
p += [barrel("rf_optic",.050,.30,(0,.00,.295),MAT_GLASS,16,.006)]
p += [torus("rf_opticRingF",.058,.010,(0,.145,.295),MAT_ACCENT,rot=(math.pi/2,0,0),major_segments=18)]
p += [torus("rf_opticRingR",.058,.010,(0,-.145,.295),MAT_EDGE,rot=(math.pi/2,0,0),major_segments=18)]
components.append(join_component("ZAP_WPN_Rifle",p))

# PLASMA — energy weapon with exposed coil architecture and bright emitter.
p=[]
p += [box("pl_core",(.31,.72,.22),(0,.00,.045),MAT_SHELL,bevel=.032)]
p += [box("pl_rear",(.25,.38,.24),(0,-.45,.04),MAT_DARK,bevel=.026)]
p += [prism("pl_grip",[(-.068,.08),(.068,.08),(.058,-.13),(.034,-.20),(-.034,-.20),(-.058,-.13)],.17,(0,-.16,-.18),MAT_RUBBER,rot=(math.radians(-10),0,0),bevel=.012)]
p += [barrel("pl_spine",.054,.86,(0,.69,.055),MAT_DARK,12,.006)]
for y in (.38,.54,.70,.86,.99):
    p += [torus("pl_coil"+str(y),.105,.015,(0,y,.055),MAT_GLOW,rot=(math.pi/2,0,0),major_segments=18)]
    p += [torus("pl_coilEdge"+str(y),.078,.007,(0,y+.018,.055),MAT_EDGE,rot=(math.pi/2,0,0),major_segments=16)]
for side in (-1,1):
    p += [box("pl_fork"+str(side),(.055,.76,.10),(side*.145,.67,.055),MAT_DARK,bevel=.012)]
    p += [box("pl_forkAccent"+str(side),(.022,.58,.055),(side*.175,.65,.055),MAT_ACCENT,bevel=.005)]
p += [barrel("pl_emitter",.12,.12,(0,1.12,.055),MAT_GLASS,18,.008)]
p += [torus("pl_emitterRing",.135,.018,(0,1.18,.055),MAT_GLOW,rot=(math.pi/2,0,0),major_segments=20)]
p += [box("pl_topSight",(.11,.22,.05),(0,.02,.225),MAT_GLASS,bevel=.009)]
p += [box("pl_cell",(.20,.22,.20),(0,-.34,-.10),MAT_GLASS,bevel=.020)]
components.append(join_component("ZAP_WPN_Plasma",p))

# SNIPER — long precision rifle with clear scope, muzzle brake and bipod.
p=[]
p += [box("sn_receiver",(.25,.86,.18),(0,.00,.05),MAT_SHELL,bevel=.026)]
p += [box("sn_receiverEdge",(.21,.70,.042),(0,.04,.16),MAT_EDGE,bevel=.008)]
p += [box("sn_fore",(.245,.58,.16),(0,.62,.04),MAT_DARK,bevel=.022)]
p += [barrel("sn_barrel",.027,1.50,(0,1.28,.07),MAT_EDGE,12,.004)]
p += [barrel("sn_brake",.050,.22,(0,2.04,.07),MAT_DARK,12,.005)]
for x in (-.042,.042):
    p += [box("sn_brakeSlot"+str(x),(.025,.12,.075),(x,2.04,.07),MAT_WARNING,bevel=.004)]
p += [prism("sn_stock",[(-.12,.09),(.12,.09),(.105,-.08),(.065,-.15),(-.065,-.15),(-.105,-.08)],.56,(0,-.55,.05),MAT_RUBBER,bevel=.020)]
p += [box("sn_butt",(.235,.12,.25),(0,-.89,.05),MAT_DARK,bevel=.020)]
p += [prism("sn_grip",[(-.062,.08),(.062,.08),(.055,-.13),(.032,-.20),(-.032,-.20),(-.055,-.13)],.16,(0,-.18,-.17),MAT_RUBBER,rot=(math.radians(-10),0,0),bevel=.011)]
p += [prism("sn_mag",[(-.085,.09),(.085,.09),(.07,-.12),(.04,-.20),(-.04,-.20),(-.07,-.12)],.17,(0,.08,-.19),MAT_DARK,bevel=.012)]
p += [box("sn_scopeMount",(.13,.40,.045),(0,.02,.235),MAT_DARK,bevel=.008)]
p += [barrel("sn_scope",.058,.58,(0,.02,.31),MAT_GLASS,18,.006)]
for y,mat in ((-.27,MAT_ACCENT),(.27,MAT_ACCENT),(-.05,MAT_EDGE),(.08,MAT_EDGE)):
    p += [torus("sn_scopeRing"+str(y),.067,.011,(0,y,.31),mat,rot=(math.pi/2,0,0),major_segments=18)]
for side in (-1,1):
    p += [box("sn_bipod"+str(side),(.026,.035,.48),(side*.115,.72,-.18),MAT_EDGE,rot=(0,0,math.radians(18*side)),bevel=.004)]
    p += [box("sn_bipodFoot"+str(side),(.10,.05,.028),(side*.19,.72,-.40),MAT_RUBBER,bevel=.004)]
components.append(join_component("ZAP_WPN_Sniper",p))

# ROCKET — shoulder launcher with tube, reinforced collars, sight and rear pad.
p=[]
p += [barrel("rk_tube",.145,1.34,(0,.18,.06),MAT_SHELL,18,.010)]
p += [barrel("rk_inner",.108,1.38,(0,.18,.06),MAT_DARK,16,.006)]
for y,mat in ((-.48,MAT_EDGE),(-.08,MAT_ACCENT),(.36,MAT_EDGE),(.79,MAT_WARNING)):
    p += [torus("rk_ring"+str(y),.158,.020,(0,y,.06),mat,rot=(math.pi/2,0,0),major_segments=20)]
p += [barrel("rk_muzzle",.165,.18,(0,.89,.06),MAT_DARK,18,.008)]
p += [barrel("rk_rear",.155,.18,(0,-.55,.06),MAT_RUBBER,18,.008)]
p += [box("rk_shoulder",(.30,.32,.19),(0,-.48,-.10),MAT_RUBBER,bevel=.022)]
p += [prism("rk_grip",[(-.068,.08),(.068,.08),(.060,-.13),(.036,-.20),(-.036,-.20),(-.060,-.13)],.18,(0,-.05,-.22),MAT_RUBBER,rot=(math.radians(-8),0,0),bevel=.012)]
p += [box("rk_sightBase",(.16,.30,.055),(0,.12,.245),MAT_DARK,bevel=.010)]
p += [box("rk_sight",(.13,.16,.09),(0,.12,.31),MAT_GLASS,bevel=.014)]
for side in (-1,1):
    p += [box("rk_sideModule"+str(side),(.055,.48,.16),(side*.17,.10,.06),MAT_DARK,bevel=.012)]
    p += [box("rk_sideGlow"+str(side),(.018,.34,.065),(side*.202,.10,.06),MAT_ACCENT,bevel=.004)]
components.append(join_component("ZAP_WPN_Rocket",p))

# Runtime derivative: preserve Blender corner normals and material groups.
runtime={"schema":1,"version":49,"coordinateBridge":"Blender (x,y,z) -> runtime (x,z,-y)","weapons":weapon_meta,"components":{}}
component_stats={}
depsgraph=bpy.context.evaluated_depsgraph_get()
for o in components:
    ev=o.evaluated_get(depsgraph)
    mesh=ev.to_mesh()
    mesh.calc_loop_triangles()
    buckets={}
    for tri in mesh.loop_triangles:
        poly=mesh.polygons[tri.polygon_index]
        mat_name=mesh.materials[poly.material_index].name if mesh.materials and poly.material_index < len(mesh.materials) else "MAT_DARK"
        bucket=buckets.setdefault(mat_name,{"p":[],"n":[]})
        for li in tri.loops:
            vi=mesh.loops[li].vertex_index
            co=mesh.vertices[vi].co
            cn=mesh.corner_normals[li].vector
            bucket["p"].extend((float(co.x),float(co.z),float(-co.y)))
            bucket["n"].extend((float(cn.x),float(cn.z),float(-cn.y)))
    pvals=[]; nvals=[]; groups=[]; start=0
    for mat_name in sorted(buckets):
        b=buckets[mat_name]
        count=len(b["p"])//3
        pvals.extend(b["p"]); nvals.extend(b["n"])
        groups.append({"start":start,"count":count,"material":mat_name})
        start += count
    max_abs=max((abs(v) for v in pvals), default=1.0)
    qscale=max(1.0,max_abs)
    def q16(values,scale=1.0):
        q=[max(-32767,min(32767,int(round((v/scale)*32767.0)))) for v in values]
        return base64.b64encode(struct.pack("<"+"h"*len(q),*q)).decode("ascii")
    runtime["components"][o.name]={
        "p16":q16(pvals,qscale),
        "n16":q16(nvals,1.0),
        "qScale":round(qscale,6),
        "groups":groups
    }
    component_stats[o.name]={
        "triangles":len(pvals)//9,
        "runtimeVertices":len(pvals)//3,
        "materialGroups":len(groups),
        "qScale":round(qscale,6),
        "maxAbsLocalCoordinate":round(max_abs,6)
    }
    ev.to_mesh_clear()

with open(OUT_RUNTIME_JS,"w",encoding="utf-8",newline="\n") as f:
    f.write("/* GENERATED by asset-staging/2026-10-07-world-weapons-pack-49/build_world_weapons_49.py; do not hand-edit. */\n")
    f.write("window.ZAP_WORLD_WEAPONS_49=")
    json.dump(runtime,f,separators=(",",":"))
    f.write(";\n")

bpy.ops.object.select_all(action='DESELECT')
for o in components:
    o.select_set(True)
bpy.context.view_layer.objects.active=components[0]
bpy.ops.export_scene.gltf(
    filepath=OUT_GLB,
    export_format='GLB',
    use_selection=True,
    export_apply=True,
    export_yup=True,
    export_texcoords=False,
    export_materials='EXPORT',
    export_cameras=False,
    export_lights=False
)

# Preview sheet: canonical components remain hidden while linked copies are staged.
for o in components:
    o.hide_render=True

def inst(src_name,name,loc,scale=1.0,rot=(0,0,0)):
    src=bpy.data.objects[src_name]
    o=src.copy(); o.data=src.data.copy(); o.name=name
    bpy.context.collection.objects.link(o)
    o.location=loc; o.scale=(scale,scale,scale); o.rotation_euler=rot; o.hide_render=False
    return o

grid=[
    ("ZAP_WPN_Pistol",(-2.2,1.35,.55),1.15),
    ("ZAP_WPN_Shotgun",(0,1.35,.55),.78),
    ("ZAP_WPN_Rifle",(2.2,1.35,.55),.66),
    ("ZAP_WPN_Plasma",(-2.2,-1.10,.55),.72),
    ("ZAP_WPN_Sniper",(0,-1.10,.55),.52),
    ("ZAP_WPN_Rocket",(2.2,-1.10,.55),.72),
]
for name,loc,scale in grid:
    # Weapon forward is Blender +Y; keep showcase copies mostly horizontal so
    # the sheet proves the same lying/world silhouette used by runtime pickups.
    inst(name,"Preview_"+name,loc,scale,rot=(0,0,math.radians(12)))

bpy.ops.mesh.primitive_plane_add(size=12, location=(0,0,0))
ground=bpy.context.object
ground.data.materials.append(make_mat("MAT_PREVIEW_GROUND",(0.018,0.026,0.038),0.05,0.80))

def look_at(obj,target):
    direction=Vector(target)-obj.location
    obj.rotation_euler=direction.to_track_quat('-Z','Y').to_euler()

bpy.ops.object.camera_add(location=(7.6,-9.4,7.2))
cam=bpy.context.object; bpy.context.scene.camera=cam; cam.data.lens=54
look_at(cam,(0,0,.6))

for loc,energy,size in [((-4,-3,8),1450,5.0),((5,-1,5),900,4.0),((0,5,6),1200,3.5)]:
    bpy.ops.object.light_add(type='AREA',location=loc)
    lamp=bpy.context.object; lamp.data.energy=energy; lamp.data.size=size
    look_at(lamp,(0,0,.6))

scene=bpy.context.scene
scene.render.engine='BLENDER_EEVEE'
scene.render.resolution_x=1400
scene.render.resolution_y=900
scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG'
scene.world.color=(0.004,0.007,0.012)
scene.render.filepath=OUT_PREVIEW
scene.view_settings.look='AgX - Medium High Contrast'
bpy.ops.wm.save_as_mainfile(filepath=OUT_BLEND)
bpy.ops.render.render(write_still=True)

def identity(path):
    h=hashlib.sha256()
    with open(path,"rb") as f:
        for chunk in iter(lambda:f.read(1024*1024),b""):
            h.update(chunk)
    return {"bytes":os.path.getsize(path),"sha256":h.hexdigest()}

manifest={
    "schema":1,
    "packVersion":49,
    "generator":"asset-staging/2026-10-07-world-weapons-pack-49/build_world_weapons_49.py",
    "blenderVersion":bpy.app.version_string,
    "coordinateBridge":"Blender (x,y,z) -> runtime (x,z,-y); per-component qScale preserves long weapon geometry",
    "firstPersonTouched":False,
    "weaponKeys":list(weapon_meta.keys()),
    "components":component_stats,
    "artifacts":{
        "glb":identity(OUT_GLB),
        "runtimeJs":identity(OUT_RUNTIME_JS),
        "blend":identity(OUT_BLEND),
        "preview":identity(OUT_PREVIEW),
        "builder":identity(__file__)
    }
}
with open(OUT_MANIFEST,"w",encoding="utf-8",newline="\n") as f:
    json.dump(manifest,f,ensure_ascii=False,indent=2)
    f.write("\n")

print("ZAP_WORLD_WEAPONS_GLB",OUT_GLB)
print("ZAP_WORLD_WEAPONS_RUNTIME",OUT_RUNTIME_JS)
print("ZAP_WORLD_WEAPONS_BLEND",OUT_BLEND)
print("ZAP_WORLD_WEAPONS_PREVIEW",OUT_PREVIEW)
print("ZAP_WORLD_WEAPONS_MANIFEST",OUT_MANIFEST)
