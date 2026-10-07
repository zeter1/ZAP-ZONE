import bpy, math, os, json, base64, struct, hashlib
from mathutils import Vector

ROOT=r"G:\\МОЯ Веб-разработка\\ZAP_ZONE"
PACK=os.path.join(ROOT,"asset-staging","2026-10-07-map-sci-fi-kit-47")
OUT_BLEND=os.path.join(PACK,"zap-map-sci-fi-kit-47.blend")
OUT_GLB=os.path.join(ROOT,"assets","environment","models","zap-map-sci-fi-kit-47.glb")
OUT_RUNTIME=os.path.join(ROOT,"assets","environment","models","zap-map-sci-fi-kit-47.runtime.js")
OUT_PREVIEW=os.path.join(PACK,"zap-map-sci-fi-kit-preview-47.png")
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
 "MAT_DARK":mat("MAT_DARK",(0.030,0.045,0.060),.18,.76),
 "MAT_SHELL":mat("MAT_SHELL",(0.30,0.39,0.46),.24,.62),
 "MAT_EDGE":mat("MAT_EDGE",(0.62,0.70,0.76),.34,.52),
 "MAT_ACCENT":mat("MAT_ACCENT",(0.05,0.58,0.78),.12,.44,(0.02,0.23,0.35),.30),
 "MAT_GLOW":mat("MAT_GLOW",(0.10,0.86,1.00),.04,.28,(0.06,0.65,0.95),1.15),
 "MAT_WARNING":mat("MAT_WARNING",(0.92,0.27,0.035),.12,.48,(0.42,0.055,0.006),.38),
 "MAT_RUBBER":mat("MAT_RUBBER",(0.025,0.030,0.035),.02,.90),
}

def apply_bevel(o,amount=.04,segments=2):
    if amount<=0:return
    mod=o.modifiers.new("Bevel","BEVEL"); mod.width=amount; mod.segments=segments
    bpy.context.view_layer.objects.active=o
    bpy.ops.object.modifier_apply(modifier=mod.name)

def box(name,size,loc=(0,0,0),material="MAT_SHELL",bevel=.04,rot=(0,0,0)):
    bpy.ops.mesh.primitive_cube_add(location=loc,rotation=rot)
    o=bpy.context.object; o.name=name; o.dimensions=size
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    o.data.materials.append(MATS[material]); apply_bevel(o,bevel)
    return o

def cyl(name,r,depth,loc=(0,0,0),material="MAT_EDGE",verts=12,rot=(0,0,0),bevel=.02):
    bpy.ops.mesh.primitive_cylinder_add(vertices=verts,radius=r,depth=depth,location=loc,rotation=rot)
    o=bpy.context.object; o.name=name; o.data.materials.append(MATS[material]); apply_bevel(o,bevel)
    return o

def torus(name,major,minor,loc=(0,0,0),material="MAT_EDGE",rot=(0,0,0)):
    bpy.ops.mesh.primitive_torus_add(major_radius=major,minor_radius=minor,major_segments=16,minor_segments=6,location=loc,rotation=rot)
    o=bpy.context.object; o.name=name; o.data.materials.append(MATS[material]); return o

def ellipsoid(name,scale,loc=(0,0,0),material="MAT_SHELL",rot=(0,0,0),segments=12,rings=8):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segments,ring_count=rings,location=loc,rotation=rot)
    o=bpy.context.object; o.name=name; o.scale=scale
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    o.data.materials.append(MATS[material]); return o

def frustum(name,r1,r2,depth,loc=(0,0,0),material="MAT_SHELL",rot=(0,0,0),verts=4,bevel=.03):
    bpy.ops.mesh.primitive_cone_add(vertices=verts,radius1=r1,radius2=r2,depth=depth,location=loc,rotation=rot)
    o=bpy.context.object; o.name=name; o.data.materials.append(MATS[material]); apply_bevel(o,bevel); return o

def join_component(name,parts):
    bpy.ops.object.select_all(action='DESELECT')
    for p in parts:p.select_set(True)
    bpy.context.view_layer.objects.active=parts[0]
    if len(parts)>1:
        bpy.ops.object.join()
    o=bpy.context.view_layer.objects.active; o.name=name
    o.location=(0,0,0); o.rotation_euler=(0,0,0); o.scale=(1,1,1)
    o["zap_map_kit_component"]=True
    return o

def face_bolts(prefix,parts,x0,z0,dx=.52,dz=.32,y=-.226,r=.038):
    for x in (x0-dx,x0+dx):
        for z in (z0-dz,z0+dz):
            parts.append(cyl(prefix+"_bolt",r,.045,(x,y,z),"MAT_EDGE",8,rot=(math.pi/2,0,0),bevel=.006))

def warning_chevron(prefix,parts,x,z,y=-.235,span=.72,tilt=.48):
    parts.append(box(prefix+"_warn_a",(span,.035,.075),(x-.20,y,z),"MAT_WARNING",.012,rot=(0,tilt,0)))
    parts.append(box(prefix+"_warn_b",(span,.035,.075),(x+.20,y,z),"MAT_WARNING",.012,rot=(0,-tilt,0)))

def wall(name,w):
    # Final anti-shimmer wall: one continuous shell plus thick structural posts.
    # No inset "windows", roof lip, lower strip, tiny status bars or layered face
    # geometry. The same static mesh is used at every distance; no LOD/pop-in.
    p=[box(name+"_core",(w,.42,3.0),material="MAT_SHELL",bevel=.075)]
    post_x=[-w/2+.22,w/2-.22]
    slots=max(1,round(w/4))
    if slots>1:
        seg=w/slots
        post_x += [(-w/2)+seg*i for i in range(1,slots)]
    for x in sorted(set(round(v,4) for v in post_x)):
        p.append(box(name+"_post",(.28,.56,2.72),(x,0,0),"MAT_EDGE",.035))
    return join_component(name,p)

components=[]
components += [wall("KIT_Wall_4m",4.0),wall("KIT_Wall_8m",8.0),wall("KIT_Wall_12m",12.0)]

# 90-degree structural corner.
p=[box("corner_a",(2.2,.38,3.0),(1.0,0,0),"MAT_SHELL",.07),
   box("corner_b",(.38,2.2,3.0),(0,-1.0,0),"MAT_SHELL",.07),
   box("corner_spine",(.52,.52,3.15),(0,0,0),"MAT_EDGE",.08),
   box("corner_glow",(.08,.58,1.45),(.27,-.28,.15),"MAT_GLOW",.012)]
components.append(join_component("KIT_Corner_90",p))

# Column / door / barrier / container.
p=[box("col_core",(.90,.90,4.0),material="MAT_DARK",bevel=.10),
   box("col_shell",(.72,.98,3.45),material="MAT_SHELL",bevel=.08),
   box("col_cap",(1.10,1.10,.22),(0,0,1.90),"MAT_EDGE",.04),
   box("col_base",(1.16,1.16,.26),(0,0,-1.88),"MAT_EDGE",.04),
   box("col_front",(.48,.055,2.48),(0,-.515,.06),"MAT_DARK",.025),
   box("col_light",(.12,.035,1.86),(0,-.552,.10),"MAT_GLOW",.012),
   box("col_warn",(.34,.035,.10),(0,-.552,-1.16),"MAT_WARNING",.012)]
for z in (-1.0,0,1.0):p.append(box("col_band",(1.02,1.02,.09),(0,0,z),"MAT_ACCENT",.018))
for z in (-1.34,1.34):p.append(cyl("col_fastener",.055,.05,(0,-.56,z),"MAT_EDGE",8,rot=(math.pi/2,0,0),bevel=.008))
components.append(join_component("KIT_Column",p))

p=[box("door_l",(.48,.48,3.2),(-1.55,0,0),"MAT_EDGE",.06),
   box("door_r",(.48,.48,3.2),(1.55,0,0),"MAT_EDGE",.06),
   box("door_top",(3.58,.48,.50),(0,0,1.40),"MAT_EDGE",.06),
   box("door_inner_l",(.18,.54,2.70),(-1.30,-.02,-.12),"MAT_DARK",.03),
   box("door_inner_r",(.18,.54,2.70),(1.30,-.02,-.12),"MAT_DARK",.03),
   box("door_glow",(2.10,.05,.08),(0,-.29,1.28),"MAT_GLOW",.015),
   box("door_header",(1.20,.055,.24),(0,-.285,1.50),"MAT_DARK",.025),
   box("door_header_warn",(.62,.035,.08),(0,-.322,1.50),"MAT_WARNING",.010),
   box("door_light_l",(.07,.035,1.85),(-1.27,-.305,-.12),"MAT_GLOW",.010),
   box("door_light_r",(.07,.035,1.85),(1.27,-.305,-.12),"MAT_GLOW",.010),
   box("door_shoulder_l",(.70,.05,.12),(-1.13,-.30,1.14),"MAT_WARNING",.012,rot=(0,-.48,0)),
   box("door_shoulder_r",(.70,.05,.12),(1.13,-.30,1.14),"MAT_WARNING",.012,rot=(0,.48,0))]
components.append(join_component("KIT_Door_Frame",p))

p=[box("bar_core",(4.0,.78,1.15),material="MAT_SHELL",bevel=.11),
   box("bar_top",(4.18,.90,.20),(0,0,.48),"MAT_EDGE",.04),
   box("bar_base",(3.75,.86,.18),(0,0,-.52),"MAT_DARK",.035),
   box("bar_inset",(2.80,.045,.66),(0,-.412,-.04),"MAT_DARK",.035),
   box("bar_glow",(1.52,.035,.07),(-.55,-.445,.08),"MAT_GLOW",.012),
   box("bar_warn",(.64,.035,.10),(1.02,-.445,.08),"MAT_WARNING",.012)]
for x in (-1.55,1.55):
    p += [box("bar_leg",(.38,1.05,1.28),(x,0,-.02),"MAT_EDGE",.045),
          box("bar_foot",(.74,1.18,.14),(x,0,-.59),"MAT_DARK",.03)]
for x in (-1.16,1.16):
    p.append(box("bar_brace",(.15,.05,.72),(x,-.445,-.05),"MAT_EDGE",.018,rot=(0,.34 if x<0 else -.34,0)))
face_bolts("bar",p,0,-.05,dx=1.35,dz=.32,y=-.45,r=.036)
components.append(join_component("KIT_Barrier",p))

p=[box("cont_core",(3.6,1.8,1.8),material="MAT_SHELL",bevel=.08),
   box("cont_top",(3.76,1.96,.16),(0,0,.84),"MAT_EDGE",.03),
   box("cont_bot",(3.76,1.96,.16),(0,0,-.84),"MAT_DARK",.03),
   box("cont_face",(2.96,.055,1.20),(0,-.925,0),"MAT_DARK",.035)]
for x in (-1.70,-.86,0,.86,1.70):p.append(box("cont_rib",(.12,1.92,1.62),(x,0,0),"MAT_EDGE",.025))
p += [box("cont_panel",(1.05,.040,.46),(-.55,-.965,.10),"MAT_SHELL",.025),
      box("cont_glow",(.68,.035,.07),(-.55,-.998,.10),"MAT_GLOW",.012),
      box("cont_warn",(.50,.035,.10),(.92,-.998,.10),"MAT_WARNING",.012),
      box("cont_latch",(.18,.05,.58),(1.35,-.985,-.04),"MAT_EDGE",.018)]
warning_chevron("cont",p,.10,-.50,y=-.998,span=.50,tilt=.52)
face_bolts("cont",p,0,0,dx=1.36,dz=.48,y=-1.00,r=.034)
components.append(join_component("KIT_Container",p))

# Purpose-built cover family. These are presentation shells only; runtime keeps the
# original engine boxes as collision/LOS/projectile owners.
p=[box("armor_spine",(3.35,.62,1.16),(0,0,.01),"MAT_DARK",.08),
   box("armor_plate_l",(2.12,.70,1.28),(-1.16,-.02,.03),"MAT_SHELL",.07,rot=(0,-.10,0)),
   box("armor_plate_r",(2.12,.70,1.28),(1.16,-.02,.03),"MAT_SHELL",.07,rot=(0,.10,0)),
   box("armor_cap",(3.55,.77,.17),(0,0,.68),"MAT_EDGE",.035),
   box("armor_plinth",(4.55,.82,.20),(0,0,-.68),"MAT_DARK",.035),
   box("armor_inset",(2.70,.045,.62),(0,-.365,-.05),"MAT_DARK",.030),
   box("armor_glow",(1.42,.035,.075),(-.48,-.394,.13),"MAT_GLOW",.012),
   box("armor_warn",(.62,.035,.10),(1.02,-.394,.13),"MAT_WARNING",.012)]
for x in (-1.92,1.92):
    p += [box("armor_cheek",(.52,.76,1.10),(x,0,-.08),"MAT_EDGE",.045,rot=(0,.16 if x<0 else -.16,0)),
          box("armor_foot",(.70,.98,.16),(x,0,-.72),"MAT_RUBBER",.025)]
for x in (-1.20,1.20):p.append(box("armor_brace",(.13,.045,.76),(x,-.394,-.06),"MAT_EDGE",.018,rot=(0,.30 if x<0 else -.30,0)))
face_bolts("armor",p,0,-.03,dx=1.62,dz=.34,y=-.400,r=.036)
components.append(join_component("KIT_Armor_Cover",p))

p=[]
for row,(z,xs) in enumerate(((-.34,(-1.52,-.76,0,.76,1.52)),(.12,(-1.14,-.38,.38,1.14)),(.43,(-.72,0,.72)))):
    for i,x in enumerate(xs):
        mat_name="MAT_SHELL" if (row+i)%3 else "MAT_DARK"
        p.append(ellipsoid("sandbag",(.66,.47,.24),(x,0,z),mat_name,rot=(0,0,.035 if (row+i)%2 else -.035),segments=12,rings=6))
p += [box("sandbag_base",(4.08,.98,.12),(0,0,-.58),"MAT_RUBBER",.025),
      box("sandbag_rail_l",(.14,1.00,1.12),(-2.00,0,-.03),"MAT_EDGE",.025),
      box("sandbag_rail_r",(.14,1.00,1.12),(2.00,0,-.03),"MAT_EDGE",.025),
      box("sandbag_status",(1.10,.035,.07),(0,-.495,.30),"MAT_GLOW",.012)]
for x in (-1.52,-.76,0,.76,1.52):p.append(box("sandbag_strap",(.055,.955,.48),(x,0,-.34),"MAT_EDGE",.012))
components.append(join_component("KIT_SciFi_Sandbag",p))

p=[frustum("at_base",.72,.48,.68,(0,0,-.10),"MAT_SHELL",rot=(0,0,math.pi/4),verts=4,bevel=.045),
   frustum("at_crown",.50,.29,.36,(0,0,.40),"MAT_EDGE",rot=(0,0,math.pi/4),verts=4,bevel=.035),
   box("at_belt",(1.05,1.05,.12),(0,0,.14),"MAT_DARK",.025,rot=(0,0,math.pi/4)),
   box("at_warn",(.42,.055,.09),(0,-.57,.12),"MAT_WARNING",.012),
   box("at_glow",(.12,.055,.38),(0,-.585,-.22),"MAT_GLOW",.012)]
for a in (0,math.pi/2):p.append(box("at_rebar",(1.28,.11,.11),(0,0,.44),"MAT_EDGE",.018,rot=(0,.30,a)))
components.append(join_component("KIT_AntiTank_Block",p))

p=[box("crate_core",(1.82,1.82,1.46),material="MAT_SHELL",bevel=.065),
   box("crate_front",(1.42,.055,1.08),(0,-.935,.02),"MAT_DARK",.030),
   box("crate_top",(1.94,1.94,.14),(0,0,.72),"MAT_EDGE",.028),
   box("crate_bot",(1.94,1.94,.14),(0,0,-.72),"MAT_RUBBER",.028),
   box("crate_panel",(.86,.045,.42),(-.32,-.970,.10),"MAT_SHELL",.022),
   box("crate_glow",(.58,.035,.065),(-.32,-1.000,.10),"MAT_GLOW",.010),
   box("crate_warn",(.40,.035,.09),(.62,-1.000,.10),"MAT_WARNING",.010)]
for x in (-.82,.82):
    for y in (-.82,.82):p.append(box("crate_corner",(.16,.16,1.58),(x,y,0),"MAT_EDGE",.025))
for x in (-.60,.60):p.append(box("crate_handle",(.34,.06,.10),(x,-.995,-.44),"MAT_EDGE",.018))
face_bolts("crate",p,0,0,dx=.66,dz=.46,y=-1.005,r=.030)
components.append(join_component("KIT_Cargo_Crate",p))

p=[cyl("reactor_core",1.05,4.42,(0,0,0),"MAT_SHELL",16,bevel=.055),
   cyl("reactor_inner",.72,4.58,(0,0,0),"MAT_DARK",16,bevel=.035),
   box("reactor_front",(1.15,.06,3.48),(0,-1.075,0),"MAT_DARK",.035),
   box("reactor_glow",(.18,.035,2.72),(0,-1.112,.08),"MAT_GLOW",.012),
   box("reactor_warn",(.58,.035,.11),(0,-1.112,-1.55),"MAT_WARNING",.012)]
for z in (-1.92,-.96,0,.96,1.92):p.append(torus("reactor_ring",1.07,.075,(0,0,z),"MAT_EDGE"))
for x,y in ((-1.16,-.68),(1.16,-.68),(-1.16,.68),(1.16,.68)):
    p.append(box("reactor_cage",(.14,.14,4.48),(x,y,0),"MAT_EDGE",.025))
p += [box("reactor_cap",(2.58,2.58,.20),(0,0,2.30),"MAT_EDGE",.045),
      box("reactor_plinth",(2.68,2.68,.24),(0,0,-2.30),"MAT_RUBBER",.045)]
components.append(join_component("KIT_Reactor_Housing",p))

# Ramp / ladder / grate.
p=[]
for i in range(6):
    z=-.48+i*.19; y=-1.45+i*.48
    p.append(box("ramp_step",(3.0,.48,.18),(0,y,z),"MAT_SHELL",.025))
    if i in (0,5):
        p.append(box("ramp_warn",(2.45,.36,.035),(0,y-.02,z+.105),"MAT_WARNING",.012))
p += [box("ramp_rail_l",(.16,3.25,.30),(-1.43,-.05,.05),"MAT_EDGE",.03,rot=(math.radians(-20),0,0)),
      box("ramp_rail_r",(.16,3.25,.30),(1.43,-.05,.05),"MAT_EDGE",.03,rot=(math.radians(-20),0,0)),
      box("ramp_spine_l",(.08,3.00,.10),(-.96,-.02,-.02),"MAT_DARK",.014,rot=(math.radians(-20),0,0)),
      box("ramp_spine_r",(.08,3.00,.10),(.96,-.02,-.02),"MAT_DARK",.014,rot=(math.radians(-20),0,0))]
components.append(join_component("KIT_Ramp",p))

p=[box("ladder_l",(.12,.14,3.0),(-.46,0,0),"MAT_EDGE",.025),
   box("ladder_r",(.12,.14,3.0),(.46,0,0),"MAT_EDGE",.025)]
for z in [-1.15,-.75,-.35,.05,.45,.85,1.25]:
    p.append(box("ladder_rung",(.95,.14,.10),(0,0,z),"MAT_EDGE",.018))
components.append(join_component("KIT_Ladder",p))

p=[box("grate_frame",(3.2,.18,2.0),material="MAT_EDGE",bevel=.035)]
for x in [-1.35,-.90,-.45,0,.45,.90,1.35]:p.append(box("grate_x",(.12,.21,1.72),(x,0,0),"MAT_DARK",.014))
for y in [-.65,0,.65]:p.append(box("grate_y",(2.95,.21,.10),(0,0,y),"MAT_DARK",.014))
components.append(join_component("KIT_Grate",p))

# Tech panel / vent.
p=[box("tech_back",(1.8,.16,1.10),material="MAT_DARK",bevel=.055),
   box("tech_face",(1.55,.08,.88),(0,-.10,0),"MAT_SHELL",.04),
   box("tech_screen",(.82,.035,.38),(-.22,-.155,.12),"MAT_GLOW",.025),
   box("tech_screen_frame",(.96,.030,.50),(-.22,-.145,.12),"MAT_EDGE",.018),
   box("tech_slot",(.40,.035,.08),(.46,-.155,-.18),"MAT_ACCENT",.012),
   box("tech_warn",(.24,.035,.08),(.52,-.155,.24),"MAT_WARNING",.010),
   box("tech_key_a",(.12,.035,.12),(.38,-.158,-.02),"MAT_DARK",.010),
   box("tech_key_b",(.12,.035,.12),(.56,-.158,-.02),"MAT_DARK",.010)]
for x in (-.63,.63):
    for z in (-.34,.38):
        p.append(cyl("tech_bolt",.045,.04,(x,-.18,z),"MAT_EDGE",8,rot=(math.pi/2,0,0),bevel=.008))
components.append(join_component("KIT_Tech_Panel",p))

p=[box("vent_frame",(2.2,.18,1.45),material="MAT_EDGE",bevel=.05),
   box("vent_dark",(1.92,.08,1.16),(0,-.12,0),"MAT_DARK",.025),
   box("vent_warn",(.42,.035,.075),(.62,-.205,.54),"MAT_WARNING",.010)]
for z in [-.42,-.21,0,.21,.42]:
    p.append(box("vent_slat",(1.70,.08,.085),(0,-.175,z),"MAT_SHELL",.015,rot=(0.13,0,0)))
for x in (-.93,.93):
    for z in (-.54,.54):
        p.append(cyl("vent_bolt",.038,.04,(x,-.205,z),"MAT_DARK",8,rot=(math.pi/2,0,0),bevel=.006))
components.append(join_component("KIT_Vent",p))

# Pipe straight / elbow / cable tray.
p=[cyl("pipe",.18,3.2,material="MAT_EDGE",verts=16,rot=(0,math.pi/2,0),bevel=.015)]
for x in (-1.25,0,1.25):p.append(torus("pipe_ring",.22,.045,(x,0,0),"MAT_DARK",rot=(0,math.pi/2,0)))
components.append(join_component("KIT_Pipe_Straight",p))

p=[torus("pipe_elbow",.72,.18,material="MAT_EDGE",rot=(math.pi/2,0,0)),
   cyl("pipe_stub_a",.18,1.10,(-.72,0,0),"MAT_EDGE",16,rot=(0,math.pi/2,0),bevel=.015),
   cyl("pipe_stub_b",.18,1.10,(0,.72,0),"MAT_EDGE",16,rot=(math.pi/2,0,0),bevel=.015)]
components.append(join_component("KIT_Pipe_Elbow",p))

p=[box("tray_back",(3.4,.28,.12),material="MAT_DARK",bevel=.035),
   box("tray_top",(3.4,.12,.15),(0,.12,.09),"MAT_EDGE",.02),
   box("tray_bot",(3.4,.12,.15),(0,-.12,.09),"MAT_EDGE",.02)]
for x in [-1.35,-.90,-.45,0,.45,.90,1.35]:
    p.append(cyl("cable",.055,.24,(x,0,-.10),"MAT_ACCENT",8,rot=(math.pi/2,0,0),bevel=.006))
components.append(join_component("KIT_Cable_Tray",p))

# Fortification / base module.
p=[box("fort_core",(5.6,1.4,1.50),material="MAT_SHELL",bevel=.13),
   box("fort_top",(5.85,1.55,.24),(0,0,.66),"MAT_EDGE",.05),
   box("fort_face",(4.70,.055,.86),(0,-.72,-.02),"MAT_DARK",.035),
   box("fort_glow",(2.15,.035,.08),(-.76,-.755,.18),"MAT_GLOW",.012),
   box("fort_warn",(.82,.035,.10),(1.65,-.755,.18),"MAT_WARNING",.012)]
for x in (-2.45,-1.20,1.20,2.45):
    p.append(box("fort_brace",(.22,1.58,1.62),(x,0,0),"MAT_EDGE",.04,rot=(0,0,0.05 if x<0 else -0.05)))
for x in (-1.75,0,1.75):
    p.append(box("fort_vbrace",(.15,.045,.74),(x,-.758,-.07),"MAT_SHELL",.018,rot=(0,.30 if x<=0 else -.30,0)))
face_bolts("fort",p,0,-.06,dx=2.15,dz=.37,y=-.765,r=.036)
components.append(join_component("KIT_Fortification",p))

# Final anti-shimmer base: one continuous beveled shell only.
# No roof lip, plinth, front overlay, corner strips, rails or service panels.
# This intentionally trades micro-detail for a stable silhouette at 50-100 m.
p=[box("base_core",(6.0,5.0,3.6),material="MAT_SHELL",bevel=.18)]
components.append(join_component("KIT_Base_Module",p))

# Deterministic runtime derivative. Component positions are q16-normalized by qScale.
runtime={"version":47,"components":{}}
stats={}
for o in components:
    mesh=o.data; mesh.calc_loop_triangles()
    buckets={}
    for tri in mesh.loop_triangles:
        slot=o.material_slots[tri.material_index] if tri.material_index<len(o.material_slots) else None
        mat_name=slot.material.name if slot and slot.material else "MAT_DARK"
        b=buckets.setdefault(mat_name,{"p":[],"n":[]})
        for vi,li in zip(tri.vertices,tri.loops):
            co=mesh.vertices[vi].co; no=mesh.corner_normals[li].vector
            b["p"].extend((float(co.x),float(co.z),float(-co.y)))
            b["n"].extend((float(no.x),float(no.z),float(-no.y)))
    flat=[v for b in buckets.values() for v in b["p"]]
    qscale=max((abs(v) for v in flat),default=1.0) or 1.0
    p_all=[]; n_all=[]; groups=[]; start=0
    for mat_name in sorted(buckets):
        b=buckets[mat_name]; count=len(b["p"])//3
        p_all.extend(v/qscale for v in b["p"]); n_all.extend(b["n"])
        groups.append({"start":start,"count":count,"material":mat_name}); start+=count
    def q16(vals):
        arr=[max(-32767,min(32767,int(round(v*32767)))) for v in vals]
        return base64.b64encode(struct.pack("<"+"h"*len(arr),*arr)).decode("ascii")
    runtime["components"][o.name]={"p16":q16(p_all),"n16":q16(n_all),"qScale":round(qscale,6),"groups":groups}
    stats[o.name]={"triangles":len(p_all)//9,"runtimeVertices":len(p_all)//3,"materialGroups":len(groups),"qScale":round(qscale,6)}

bpy.ops.object.select_all(action='DESELECT')
for o in components:o.select_set(True)
bpy.context.view_layer.objects.active=components[0]
bpy.ops.export_scene.gltf(filepath=OUT_GLB,export_format='GLB',use_selection=True,export_apply=True,export_yup=True,export_materials='EXPORT',export_texcoords=False,export_cameras=False,export_lights=False)

with open(OUT_RUNTIME,"w",encoding="utf-8",newline="\n") as f:
    f.write("/* GENERATED by build_map_kit_47.py; do not hand-edit. */\nwindow.ZAP_MAP_KIT_47=")
    json.dump(runtime,f,separators=(",",":"))
    f.write(";\n")

# Preview grid.
for o in components:o.hide_render=True
preview_names=["KIT_Wall_4m","KIT_Corner_90","KIT_Column","KIT_Door_Frame","KIT_Armor_Cover","KIT_SciFi_Sandbag","KIT_AntiTank_Block","KIT_Cargo_Crate","KIT_Reactor_Housing","KIT_Barrier","KIT_Container","KIT_Ramp","KIT_Tech_Panel","KIT_Vent","KIT_Pipe_Straight","KIT_Pipe_Elbow","KIT_Cable_Tray","KIT_Grate","KIT_Fortification","KIT_Base_Module","KIT_Ladder"]
for i,name in enumerate(preview_names):
    src=bpy.data.objects[name]; o=src.copy(); o.data=src.data.copy(); bpy.context.collection.objects.link(o); o.hide_render=False
    col=i%4; row=i//4; o.location=((col-1.5)*7.0,(row-2.5)*6.2,0)

bpy.ops.mesh.primitive_plane_add(size=50,location=(0,0,-2.0))
ground=bpy.context.object; ground.data.materials.append(mat("MAT_PREVIEW_GROUND",(0.018,0.024,0.032),.05,.90))

bpy.ops.object.camera_add(location=(28,38,30))
cam=bpy.context.object; scene.camera=cam
def look_at(obj,target):
    obj.rotation_euler=(Vector(target)-obj.location).to_track_quat('-Z','Y').to_euler()
look_at(cam,(0,0,0)); cam.data.lens=52
for loc,energy,size in [((-12,10,22),1700,7),((18,8,12),1050,6),((0,-15,20),1300,5)]:
    bpy.ops.object.light_add(type='AREA',location=loc); l=bpy.context.object; l.data.energy=energy; l.data.shape='DISK'; l.data.size=size; look_at(l,(0,0,0))
scene.render.engine='BLENDER_EEVEE'
scene.render.resolution_x=1500; scene.render.resolution_y=1100; scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG'; scene.render.filepath=OUT_PREVIEW
if scene.world is None:
    scene.world=bpy.data.worlds.new('ZAP_MAP_KIT_WORLD')
scene.world.color=(0.004,0.008,0.014)
scene.view_settings.look='AgX - Medium High Contrast'
bpy.ops.wm.save_as_mainfile(filepath=OUT_BLEND)
bpy.ops.render.render(write_still=True)

def ident(path):
    h=hashlib.sha256()
    with open(path,"rb") as f:
        for chunk in iter(lambda:f.read(1024*1024),b""):h.update(chunk)
    return {"bytes":os.path.getsize(path),"sha256":h.hexdigest()}
manifest={"schema":1,"packVersion":47,"generator":"asset-staging/2026-10-07-map-sci-fi-kit-47/build_map_kit_47.py","blenderVersion":bpy.app.version_string,"coordinateBridge":"Blender (x,y,z) -> runtime (x,z,-y); positions q16-normalized per component by qScale","components":stats,"artifacts":{"glb":ident(OUT_GLB),"runtimeJs":ident(OUT_RUNTIME),"blend":ident(OUT_BLEND),"preview":ident(OUT_PREVIEW),"builder":ident(__file__)}}
with open(OUT_MANIFEST,"w",encoding="utf-8",newline="\n") as f:json.dump(manifest,f,ensure_ascii=False,indent=2);f.write("\n")
print("ZAP_MAP_KIT_BLEND",OUT_BLEND)
print("ZAP_MAP_KIT_GLB",OUT_GLB)
print("ZAP_MAP_KIT_RUNTIME",OUT_RUNTIME)
print("ZAP_MAP_KIT_PREVIEW",OUT_PREVIEW)
print("ZAP_MAP_KIT_MANIFEST",OUT_MANIFEST)
