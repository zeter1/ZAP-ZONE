import bpy, math, os, json, base64, struct, hashlib
from mathutils import Vector

ROOT = r"G:\МОЯ Веб-разработка\ZAP_ZONE"
STAGE = os.path.join(ROOT, "asset-staging", "2026-10-06-bot-3d-pack-46")
OUT_GLB = os.path.join(ROOT, "assets", "characters", "models", "zap-bot-modular-46.glb")
OUT_RUNTIME_JS = os.path.join(ROOT, "assets", "characters", "models", "zap-bot-modular-46.runtime.js")
OUT_BLEND = os.path.join(STAGE, "zap-bot-modular-46.blend")
OUT_PREVIEW = os.path.join(STAGE, "zap-bot-modular-preview-46.png")
OUT_MANIFEST = os.path.join(STAGE, "manifest.json")

bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)

def make_mat(name, color, metallic=0.0, rough=0.45, emission=None, emission_strength=0.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    bsdf = next((node for node in m.node_tree.nodes if node.type=='BSDF_PRINCIPLED'),None)
    if bsdf is None:
        bsdf=m.node_tree.nodes.new("ShaderNodeBsdfPrincipled")
        out=next((node for node in m.node_tree.nodes if node.type=='OUTPUT_MATERIAL'),None)
        if out is None: out=m.node_tree.nodes.new("ShaderNodeOutputMaterial")
        m.node_tree.links.new(bsdf.outputs["BSDF"],out.inputs["Surface"])
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

MAT_DARK = make_mat("MAT_DARK", (0.038,0.060,0.085), 0.14, 0.60)
# The game has directional/hemisphere/ambient lights but no scene environment
# map. Keep shell hardware moderately metallic so it still receives enough
# diffuse light in Three.js instead of collapsing toward black at distance.
MAT_SHELL = make_mat("MAT_SHELL", (0.315,0.390,0.465), 0.36, 0.34)
MAT_EDGE = make_mat("MAT_EDGE", (0.510,0.585,0.650), 0.48, 0.30)
# High-visibility team armor: saturated paint first, restrained emissive second.
# This stays physically shaded while keeping the ally/enemy read under the
# existing neutral arena lights and without relying on an HDR environment map.
MAT_ACCENT = make_mat("MAT_ACCENT", (0.185,0.590,1.000), 0.10, 0.34, (0.185,0.590,1.000), 0.22)
MAT_GLOW = make_mat("MAT_GLOW", (0.390,0.940,1.0), 0.08, 0.16, (0.390,0.940,1.0), 2.20)
MAT_VISOR = make_mat("MAT_VISOR", (0.025,0.300,0.410), 0.10, 0.12, (0.390,0.940,1.0), 2.25)
MAT_RUBBER = make_mat("MAT_RUBBER", (0.014,0.024,0.034), 0.03, 0.84)

def apply_bevel(obj, width=0.025, segments=2):
    mod = obj.modifiers.new("Bevel", 'BEVEL')
    mod.width = width
    mod.segments = segments
    mod.limit_method = 'ANGLE'
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.modifier_apply(modifier=mod.name)

def box(name, size, loc, mat, rot=(0,0,0), bevel=0.025):
    bpy.ops.mesh.primitive_cube_add(location=loc, rotation=rot)
    o = bpy.context.object
    o.name = name
    if name.startswith(('ra_','rs_','re_','rn_','rf_')): bevel=0
    o.scale = (size[0]/2, size[1]/2, size[2]/2)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if bevel:
        apply_bevel(o, min(bevel, min(size)*0.28), 2)
    o.data.materials.append(mat)
    return o

def frustum(name, top, bottom, height, loc, mat, rot=(0,0,0), bevel=0.02):
    tw,td=top; bw,bd=bottom; h=height/2
    verts=[
        (-bw/2,-bd/2,-h),( bw/2,-bd/2,-h),( bw/2, bd/2,-h),(-bw/2, bd/2,-h),
        (-tw/2,-td/2, h),( tw/2,-td/2, h),( tw/2, td/2, h),(-tw/2, td/2, h)
    ]
    faces=[(0,1,2,3),(4,7,6,5),(0,4,5,1),(1,5,6,2),(2,6,7,3),(4,0,3,7)]
    mesh=bpy.data.meshes.new(name+"Mesh")
    mesh.from_pydata(verts,[],faces);mesh.update()
    o=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(o)
    o.location=loc;o.rotation_euler=rot
    if name.startswith(('ra_','rs_','re_','rn_','rf_')): bevel=0
    if bevel: apply_bevel(o,min(bevel,height*.18),2)
    o.data.materials.append(mat)
    return o

def prism(name, outline, depth, loc, mat, rot=(0,0,0), bevel=0.015):
    # outline is [(x,z), ...] on the component's local front plane.
    n=len(outline); d=depth/2
    verts=[(x,-d,z) for x,z in outline]+[(x,d,z) for x,z in outline]
    faces=[tuple(range(n-1,-1,-1)),tuple(range(n,2*n))]
    for i in range(n):
        j=(i+1)%n
        faces.append((i,j,n+j,n+i))
    mesh=bpy.data.meshes.new(name+"Mesh")
    mesh.from_pydata(verts,[],faces);mesh.update()
    o=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(o)
    o.location=loc;o.rotation_euler=rot
    if name.startswith(('ra_','rs_','re_','rn_','rf_')): bevel=0
    if bevel: apply_bevel(o,min(bevel,depth*.34),3)
    o.data.materials.append(mat)
    return o

def uv_sphere(name, scale, loc, mat, segments=24, rings=16):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segments, ring_count=rings, location=loc)
    o=bpy.context.object;o.name=name;o.scale=scale
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    for poly in o.data.polygons: poly.use_smooth=True
    o.data.materials.append(mat)
    return o

def cyl(name, radius, depth, loc, mat, vertices=10, rot=(0,0,0), bevel=0.012):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=loc, rotation=rot)
    o=bpy.context.object; o.name=name
    if name.startswith(('ra_','rs_','re_','rn_','rf_')): bevel=0
    if bevel:
        apply_bevel(o, bevel, 2)
    o.data.materials.append(mat)
    return o

def sphere(name, scale, loc, mat, subdivisions=2):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=subdivisions, radius=1.0, location=loc)
    o=bpy.context.object; o.name=name
    o.scale=scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    o.data.materials.append(mat)
    return o

def front_disc(name, radius, depth, loc, mat, vertices=12, bevel=0.005):
    # Cylinder whose axis points through the bot's front/back instead of vertically.
    return cyl(name, radius, depth, loc, mat, vertices=vertices,
               rot=(math.pi/2,0,0), bevel=bevel)

def vent_row(prefix, xs, y, z, width, height, mat=MAT_DARK):
    # Small recessed-looking front bars. They are geometry, not texture decals,
    # so the same detail survives GLB and the file:// runtime derivative.
    out=[]
    for i,x in enumerate(xs):
        out.append(box(f"{prefix}{i}",(width,.018,height),(x,y,z),mat,bevel=min(width,height)*.18))
    return out

def join_component(name, parts):
    bpy.ops.object.select_all(action='DESELECT')
    for p in parts: p.select_set(True)
    bpy.context.view_layer.objects.active=parts[0]
    bpy.ops.object.join()
    o=bpy.context.object
    o.name=name
    bpy.context.scene.cursor.location=(0,0,0)
    bpy.ops.object.origin_set(type='ORIGIN_CURSOR', center='MEDIAN')
    o.location=(0,0,0)
    return o

components=[]

# HEAD — compact rounded helmet, integrated visor, jaw and side modules.
p=[]
p += [uv_sphere("h_shell",(.198,.188,.198),(0,-.020,.025),MAT_DARK,28,18)]
p += [uv_sphere("h_rear",(.188,.175,.174),(0,-.070,.018),MAT_DARK,24,16)]
p += [prism("h_brow",[(-.175,.040),(-.145,.085),(.145,.085),(.175,.040),(.150,-.012),(-.150,-.012)],.060,(0,.154,.105),MAT_EDGE,bevel=.016)]
p += [prism("h_visorFrame",[(-.186,.040),(-.155,.075),(.155,.075),(.186,.040),(.166,-.055),(-.166,-.055)],.060,(0,.185,.032),MAT_RUBBER,bevel=.016)]
p += [prism("h_visor",[(-.170,.030),(-.145,.064),(.145,.064),(.170,.030),(.152,-.042),(-.152,-.042)],.038,(0,.220,.032),MAT_VISOR,bevel=.012)]
p += [prism("h_face",[(-.150,.060),(-.108,.092),(.108,.092),(.150,.060),(.120,-.090),(.070,-.125),(-.070,-.125),(-.120,-.090)],.080,(0,.158,-.085),MAT_RUBBER,bevel=.020)]
p += [prism("h_jaw",[(-.118,.040),(-.090,.064),(.090,.064),(.118,.040),(.085,-.052),(-.085,-.052)],.092,(0,.150,-.185),MAT_EDGE,bevel=.018)]
p += [prism("h_cheekL",[(-.042,.070),(.036,.086),(.048,-.045),(-.028,-.085),(-.055,-.030)],.060,(-.172,.164,-.070),MAT_SHELL,rot=(0,0,.10),bevel=.012)]
p += [prism("h_cheekR",[(-.036,.086),(.042,.070),(.055,-.030),(.028,-.085),(-.048,-.045)],.060,(.172,.164,-.070),MAT_SHELL,rot=(0,0,-.10),bevel=.012)]
p += [cyl("h_earBaseL",.084,.050,(-.220,-.014,.012),MAT_RUBBER,18,rot=(0,math.pi/2,0),bevel=.010)]
p += [cyl("h_earBaseR",.084,.050,(.220,-.014,.012),MAT_RUBBER,18,rot=(0,math.pi/2,0),bevel=.010)]
p += [cyl("h_earL",.064,.035,(-.248,-.014,.012),MAT_ACCENT,18,rot=(0,math.pi/2,0),bevel=.008)]
p += [cyl("h_earR",.064,.035,(.248,-.014,.012),MAT_ACCENT,18,rot=(0,math.pi/2,0),bevel=.008)]
p += [cyl("h_earGlowL",.030,.040,(-.270,-.014,.012),MAT_GLOW,16,rot=(0,math.pi/2,0),bevel=.006)]
p += [cyl("h_earGlowR",.030,.040,(.270,-.014,.012),MAT_GLOW,16,rot=(0,math.pi/2,0),bevel=.006)]
p += [prism("h_crown",[(-.078,.064),(.078,.064),(.100,-.052),(.060,-.095),(-.060,-.095),(-.100,-.052)],.035,(0,-.198,.120),MAT_SHELL,rot=(math.radians(12),0,0),bevel=.010)]
p += [cyl("h_ant",.014,.205,(.168,-.020,.310),MAT_RUBBER,10,bevel=.007)]
p += [uv_sphere("h_antglow",(.025,.025,.025),(.168,-.020,.425),MAT_GLOW,14,9)]
# Quality pass: layered crown rails, temple armor, lower sensor and rear vents.
p += [box("h_topRailL",(.074,.205,.026),(-.092,-.018,.182),MAT_SHELL,rot=(0,0,math.radians(-8)),bevel=.008)]
p += [box("h_topRailR",(.074,.205,.026),(.092,-.018,.182),MAT_SHELL,rot=(0,0,math.radians(8)),bevel=.008)]
p += [prism("h_templeL",[(-.030,.058),(.050,.050),(.062,-.030),(.010,-.068),(-.040,-.030)],.052,(-.190,.172,.066),MAT_EDGE,rot=(0,0,.08),bevel=.009)]
p += [prism("h_templeR",[(-.050,.050),(.030,.058),(.040,-.030),(-.010,-.068),(-.062,-.030)],.052,(.190,.172,.066),MAT_EDGE,rot=(0,0,-.08),bevel=.009)]
p += [front_disc("h_sensor",.029,.020,(0,.243,-.112),MAT_GLOW,14,.004)]
p += vent_row("h_rearVent",[-.060,0,.060],-.237,-.030,.032,.072,MAT_DARK)
# Gap-control pass: jaw guards and a dark neck sleeve keep the robot silhouette
# mechanical from gameplay distance even when the head/torso rigs diverge.
p += [prism("h_jawGuardL",[(-.040,.055),(.050,.045),(.060,-.040),(.012,-.082),(-.052,-.042)],.052,(-.122,.176,-.150),MAT_SHELL,rot=(0,0,.08),bevel=.010)]
p += [prism("h_jawGuardR",[(-.050,.045),(.040,.055),(.052,-.042),(-.012,-.082),(-.060,-.040)],.052,(.122,.176,-.150),MAT_SHELL,rot=(0,0,-.08),bevel=.010)]
p += [box("h_chinRail",(.142,.052,.030),(0,.180,-.226),MAT_EDGE,bevel=.007)]
p += vent_row("h_chinVent",[-.043,0,.043],.209,-.164,.018,.040,MAT_DARK)
p += [cyl("h_antCollar",.026,.026,(.168,-.020,.214),MAT_EDGE,10,bevel=.004)]
p += [cyl("h_neckSleeve",.118,.105,(0,-.012,-.260),MAT_RUBBER,16,bevel=.010)]
# Surface-hierarchy pass: keep the visor readable as glass inside a mechanical
# bezel and strengthen the helmet silhouette without adding texture-only detail.
p += [box("h_visorTopSeal",(.250,.024,.018),(0,.224,.104),MAT_EDGE,bevel=.004)]
p += [box("h_visorBottomSeal",(.220,.020,.014),(0,.225,-.024),MAT_DARK,bevel=.004)]
p += [prism("h_sideBladeL",[(-.032,.070),(.042,.058),(.052,-.055),(.008,-.092),(-.044,-.050)],.042,(-.225,.105,.086),MAT_SHELL,rot=(0,0,.08),bevel=.008)]
p += [prism("h_sideBladeR",[(-.042,.058),(.032,.070),(.044,-.050),(-.008,-.092),(-.052,-.055)],.042,(.225,.105,.086),MAT_SHELL,rot=(0,0,-.08),bevel=.008)]
p += [box("h_crownSpine",(.042,.150,.026),(0,-.118,.205),MAT_EDGE,bevel=.007)]
components.append(join_component("ZAP_Head",p))

# TORSO — wide armored chest with narrow waist and separated plates.
p=[]
p += [frustum("t_core",(.650,.325),(.355,.235),.535,(0,-.012,0),MAT_RUBBER,bevel=.050)]
p += [frustum("t_underplate",(.595,.112),(.405,.085),.355,(0,.155,.060),MAT_DARK,rot=(math.radians(-3),0,0),bevel=.035)]
p += [prism("t_pecL",[(-.145,.090),(.102,.103),(.137,.050),(.100,-.080),(-.075,-.112),(-.150,-.030)],.074,(-.145,.222,.095),MAT_SHELL,rot=(math.radians(-4),0,math.radians(-3)),bevel=.019)]
p += [prism("t_pecR",[(-.102,.103),(.145,.090),(.150,-.030),(.075,-.112),(-.100,-.080),(-.137,.050)],.074,(.145,.222,.095),MAT_SHELL,rot=(math.radians(-4),0,math.radians(3)),bevel=.019)]
p += [prism("t_pecAccentBackL",[(-.128,.052),(.096,.062),(.120,.008),(.070,-.078),(-.100,-.066)],.044,(-.158,.258,.100),MAT_RUBBER,bevel=.010)]
p += [prism("t_pecAccentBackR",[(-.096,.062),(.128,.052),(.100,-.066),(-.070,-.078),(-.120,.008)],.044,(.158,.258,.100),MAT_RUBBER,bevel=.010)]
# Larger pectoral paint inserts are a distance-readable team anchor. They reuse
# MAT_ACCENT, so the silhouette/readability gain costs no additional draw-call group.
p += [prism("t_pecAccentL",[(-.128,.052),(.100,.066),(.124,.008),(.075,-.078),(-.100,-.070)],.032,(-.158,.286,.100),MAT_ACCENT,bevel=.008)]
p += [prism("t_pecAccentR",[(-.100,.066),(.128,.052),(.100,-.070),(-.075,-.078),(-.124,.008)],.032,(.158,.286,.100),MAT_ACCENT,bevel=.008)]
p += [prism("t_sternum",[(-.072,.125),(.072,.125),(.105,.060),(.072,-.092),(0,-.135),(-.072,-.092),(-.105,.060)],.062,(0,.254,.055),MAT_DARK,bevel=.016)]
p += [prism("t_coreglow",[(-.050,.030),(.050,.030),(.066,.000),(.045,-.034),(-.045,-.034),(-.066,.000)],.024,(0,.294,.080),MAT_GLOW,bevel=.006)]
p += [prism("t_ab1",[(-.128,.040),(.128,.040),(.105,-.050),(-.105,-.050)],.055,(0,.205,-.120),MAT_SHELL,bevel=.014)]
p += [prism("t_ab2",[(-.108,.032),(.108,.032),(.088,-.043),(-.088,-.043)],.050,(0,.198,-.205),MAT_EDGE,bevel=.012)]
p += [prism("t_sideL",[(-.055,.142),(.045,.112),(.065,-.115),(-.025,-.155),(-.072,-.070)],.070,(-.274,.112,.005),MAT_ACCENT,rot=(0,math.radians(-6),math.radians(-5)),bevel=.017)]
p += [prism("t_sideR",[(-.045,.112),(.055,.142),(.072,-.070),(.025,-.155),(-.065,-.115)],.070,(.274,.112,.005),MAT_ACCENT,rot=(0,math.radians(6),math.radians(5)),bevel=.017)]
p += [box("t_ribGlowL",(.026,.024,.165),(-.205,.277,-.018),MAT_GLOW,rot=(0,0,-.09),bevel=.005)]
p += [box("t_ribGlowR",(.026,.024,.165),(.205,.277,-.018),MAT_GLOW,rot=(0,0,.09),bevel=.005)]
p += [frustum("t_back",(.500,.090),(.335,.070),.410,(0,-.186,.020),MAT_SHELL,bevel=.036)]
p += [cyl("t_neck",.102,.132,(0,0,.330),MAT_RUBBER,16,bevel=.012)]
p += [cyl("t_collar",.166,.060,(0,.005,.280),MAT_EDGE,16,bevel=.010)]
p += [box("t_collarGlow",(.090,.020,.022),(0,.170,.286),MAT_GLOW,bevel=.004)]
# Realism pass: exposed shoulder bearings and compact chest service hardware.
p += [cyl("t_socketL",.090,.050,(-.350,-.010,.205),MAT_RUBBER,16,rot=(0,math.pi/2,0),bevel=.008)]
p += [cyl("t_socketR",.090,.050,(.350,-.010,.205),MAT_RUBBER,16,rot=(0,math.pi/2,0),bevel=.008)]
p += [cyl("t_bearingL",.064,.058,(-.378,-.010,.205),MAT_EDGE,14,rot=(0,math.pi/2,0),bevel=.006)]
p += [cyl("t_bearingR",.064,.058,(.378,-.010,.205),MAT_EDGE,14,rot=(0,math.pi/2,0),bevel=.006)]
p += [box("t_serviceRail",(.118,.024,.026),(0,.300,-.248),MAT_EDGE,bevel=.005)]
# Quality pass: split clavicle armor, chest fasteners, vents and compact backpack.
p += [prism("t_clavL",[(-.135,.036),(.122,.046),(.150,.010),(.105,-.034),(-.135,-.026)],.040,(-.162,.218,.240),MAT_EDGE,rot=(0,0,math.radians(-4)),bevel=.009)]
p += [prism("t_clavR",[(-.122,.046),(.135,.036),(.135,-.026),(-.105,-.034),(-.150,.010)],.040,(.162,.218,.240),MAT_EDGE,rot=(0,0,math.radians(4)),bevel=.009)]
p += [front_disc("t_boltL",.018,.015,(-.255,.286,.168),MAT_EDGE,12,.003)]
p += [front_disc("t_boltR",.018,.015,(.255,.286,.168),MAT_EDGE,12,.003)]
p += vent_row("t_ventL",[-.245,-.210,-.175],.287,-.115,.018,.060,MAT_DARK)
p += vent_row("t_ventR",[.175,.210,.245],.287,-.115,.018,.060,MAT_DARK)
p += [box("t_packCore",(.300,.120,.285),(0,-.250,.045),MAT_DARK,bevel=.028)]
p += [box("t_packPlate",(.235,.050,.210),(0,-.320,.050),MAT_SHELL,bevel=.024)]
p += [box("t_packL",(.075,.105,.215),(-.210,-.245,.030),MAT_EDGE,bevel=.018)]
p += [box("t_packR",(.075,.105,.215),(.210,-.245,.030),MAT_EDGE,bevel=.018)]
p += [box("t_packGlow",(.120,.018,.022),(0,-.384,.110),MAT_GLOW,bevel=.004)]
# Collar/rib bridge plates close the largest visual gaps without touching hit meshes.
p += [prism("t_collarGuardL",[(-.105,.034),(.094,.040),(.112,-.008),(.070,-.052),(-.105,-.040)],.042,(-.145,.190,.274),MAT_SHELL,rot=(0,0,math.radians(-4)),bevel=.009)]
p += [prism("t_collarGuardR",[(-.094,.040),(.105,.034),(.105,-.040),(-.070,-.052),(-.112,-.008)],.042,(.145,.190,.274),MAT_SHELL,rot=(0,0,math.radians(4)),bevel=.009)]
p += [prism("t_lowerRibL",[(-.082,.070),(.052,.060),(.066,-.068),(-.025,-.096),(-.090,-.050)],.046,(-.225,.205,-.128),MAT_SHELL,rot=(0,0,-.05),bevel=.010)]
p += [prism("t_lowerRibR",[(-.052,.060),(.082,.070),(.090,-.050),(.025,-.096),(-.066,-.068)],.046,(.225,.205,-.128),MAT_SHELL,rot=(0,0,.05),bevel=.010)]
# Front keel and narrow ab rails break up the broad chest plane at gameplay
# distance; rear blades keep the backpack readable from chase/side angles.
p += [prism("t_centerKeel",[(-.034,.128),(.034,.128),(.045,.040),(.028,-.135),(-.028,-.135),(-.045,.040)],.026,(0,.314,-.030),MAT_EDGE,bevel=.007)]
p += [box("t_abRailL",(.026,.020,.190),(-.132,.270,-.115),MAT_EDGE,rot=(0,0,-.05),bevel=.005)]
p += [box("t_abRailR",(.026,.020,.190),(.132,.270,-.115),MAT_EDGE,rot=(0,0,.05),bevel=.005)]
p += [prism("t_backBladeL",[(-.040,.100),(.040,.100),(.050,-.085),(0,-.120),(-.050,-.085)],.028,(-.105,-.320,.025),MAT_EDGE,rot=(0,0,-.03),bevel=.006)]
p += [prism("t_backBladeR",[(-.040,.100),(.040,.100),(.050,-.085),(0,-.120),(-.050,-.085)],.028,(.105,-.320,.025),MAT_EDGE,rot=(0,0,.03),bevel=.006)]
components.append(join_component("ZAP_Torso",p))

# PELVIS — compact armored belt with separated hip shells.
p=[]
p += [frustum("p_core",(.445,.250),(.335,.215),.190,(0,-.006,0),MAT_RUBBER,bevel=.036)]
p += [prism("p_front",[(-.145,.072),(.145,.072),(.122,-.078),(.060,-.108),(-.060,-.108),(-.122,-.078)],.070,(0,.157,-.004),MAT_SHELL,bevel=.016)]
p += [box("p_belt",(.365,.052,.058),(0,.150,.078),MAT_EDGE,bevel=.014)]
p += [prism("p_sideL",[(-.070,.070),(.055,.060),(.070,-.060),(-.030,-.090),(-.080,-.040)],.082,(-.218,.042,-.010),MAT_ACCENT,rot=(0,0,-.05),bevel=.015)]
p += [prism("p_sideR",[(-.055,.060),(.070,.070),(.080,-.040),(.030,-.090),(-.070,-.060)],.082,(.218,.042,-.010),MAT_ACCENT,rot=(0,0,.05),bevel=.015)]
p += [box("p_pouchL",(.115,.080,.095),(-.205,.095,.092),MAT_DARK,rot=(0,0,-.035),bevel=.018)]
p += [box("p_pouchR",(.115,.080,.095),(.205,.095,.092),MAT_DARK,rot=(0,0,.035),bevel=.018)]
p += [box("p_pouchEdgeL",(.082,.026,.026),(-.205,.145,.102),MAT_EDGE,bevel=.006)]
p += [box("p_pouchEdgeR",(.082,.026,.026),(.205,.145,.102),MAT_EDGE,bevel=.006)]
p += [prism("p_glow",[(-.030,.026),(.030,.026),(.040,0),(.026,-.030),(-.026,-.030),(-.040,0)],.024,(0,.204,.010),MAT_GLOW,bevel=.005)]
p += [prism("p_codpiece",[(-.090,.055),(.090,.055),(.072,-.090),(0,-.125),(-.072,-.090)],.038,(0,.205,-.086),MAT_EDGE,bevel=.010)]
p += [box("p_hipRailL",(.050,.095,.150),(-.255,.015,-.020),MAT_SHELL,rot=(0,0,-.08),bevel=.012)]
p += [box("p_hipRailR",(.050,.095,.150),(.255,.015,-.020),MAT_SHELL,rot=(0,0,.08),bevel=.012)]
p += [front_disc("p_boltL",.016,.014,(-.165,.205,.060),MAT_EDGE,10,.003)]
p += [front_disc("p_boltR",.016,.014,(.165,.205,.060),MAT_EDGE,10,.003)]
p += [cyl("p_hipJointL",.082,.050,(-.292,-.004,-.008),MAT_RUBBER,14,rot=(0,math.pi/2,0),bevel=.008)]
p += [cyl("p_hipJointR",.082,.050,(.292,-.004,-.008),MAT_RUBBER,14,rot=(0,math.pi/2,0),bevel=.008)]
p += [cyl("p_hipBearingL",.058,.034,(-.327,-.004,-.008),MAT_EDGE,14,rot=(0,math.pi/2,0),bevel=.005)]
p += [cyl("p_hipBearingR",.058,.034,(.327,-.004,-.008),MAT_EDGE,14,rot=(0,math.pi/2,0),bevel=.005)]
p += [box("p_beltLatchL",(.038,.022,.052),(-.105,.184,.078),MAT_EDGE,bevel=.005)]
p += [box("p_beltLatchR",(.038,.022,.052),(.105,.184,.078),MAT_EDGE,bevel=.005)]
components.append(join_component("ZAP_Pelvis",p))

# SHOULDER — large pauldron over a black spherical joint.
p=[]
p += [uv_sphere("s_joint",(.112,.104,.112),(0,-.072,-.028),MAT_RUBBER,16,10)]
p += [cyl("s_bearing",.078,.038,(0,-.112,-.028),MAT_EDGE,14,rot=(math.pi/2,0,0),bevel=.006)]
p += [frustum("s_base",(.350,.255),(.265,.195),.180,(0,.012,.028),MAT_ACCENT,rot=(0,math.radians(7),0),bevel=.040)]
p += [prism("s_accent",[(-.135,.050),(-.095,.095),(.095,.095),(.135,.050),(.102,-.050),(-.102,-.050)],.060,(0,.150,.060),MAT_SHELL,bevel=.015)]
p += [prism("s_edge",[(-.108,.030),(.108,.030),(.120,-.018),(.095,-.042),(-.095,-.042),(-.120,-.018)],.030,(0,.184,.015),MAT_EDGE,bevel=.008)]
p += [prism("s_inner",[(-.078,.034),(.078,.034),(.088,-.015),(.058,-.050),(-.058,-.050),(-.088,-.015)],.025,(0,.188,-.055),MAT_DARK,bevel=.006)]
p += [box("s_glow",(.112,.018,.018),(0,.204,.018),MAT_GLOW,bevel=.004)]
p += [prism("s_topCap",[(-.145,.038),(-.105,.074),(.105,.074),(.145,.038),(.120,-.038),(-.120,-.038)],.052,(0,.065,.142),MAT_EDGE,rot=(math.radians(-5),0,0),bevel=.012)]
p += [box("s_rearFin",(.205,.060,.072),(0,-.125,.060),MAT_DARK,rot=(math.radians(8),0,0),bevel=.014)]
p += [front_disc("s_fastener",.020,.014,(0,.215,.092),MAT_EDGE,12,.003)]
p += [prism("s_lowerSkirt",[(-.130,.035),(.130,.035),(.112,-.058),(.060,-.085),(-.060,-.085),(-.112,-.058)],.040,(0,.142,-.078),MAT_SHELL,bevel=.010)]
p += [box("s_outerRail",(.038,.115,.145),(.155,.010,.008),MAT_EDGE,rot=(0,0,.06),bevel=.008)]
components.append(join_component("ZAP_Shoulder",p))

# UPPER ARM — segmented upper shell around a dark flexible core.
p=[]
p += [cyl("ua_core",.092,.455,(0,0,0),MAT_RUBBER,14,bevel=.010)]
p += [uv_sphere("ua_jointTop",(.078,.072,.078),(0,0,.205),MAT_RUBBER,16,10)]
p += [cyl("ua_jointBottom",.080,.072,(0,0,-.220),MAT_RUBBER,14,bevel=.008)]
p += [frustum("ua_shell",(.195,.170),(.145,.135),.285,(0,.018,-.010),MAT_SHELL,bevel=.032)]
p += [prism("ua_frontBack",[(-.082,.100),(.082,.100),(.103,.045),(.074,-.103),(-.074,-.103),(-.103,.045)],.056,(0,.108,-.008),MAT_RUBBER,bevel=.011)]
p += [prism("ua_front",[(-.080,.102),(.080,.102),(.101,.044),(.072,-.104),(-.072,-.104),(-.101,.044)],.042,(0,.134,-.008),MAT_ACCENT,bevel=.009)]
p += [box("ua_edge",(.118,.022,.045),(0,.149,.100),MAT_EDGE,bevel=.006)]
p += [box("ua_glow",(.020,.016,.110),(.061,.158,-.008),MAT_GLOW,bevel=.004)]
p += [box("ua_sideRail",(.042,.082,.170),(-.105,.020,-.008),MAT_EDGE,rot=(0,0,-.04),bevel=.010)]
p += vent_row("ua_vent",[-.042,0,.042],.157,-.095,.018,.042,MAT_DARK)
p += [front_disc("ua_fastener",.015,.012,(.060,.160,.102),MAT_EDGE,10,.003)]
p += [cyl("ua_topCollar",.102,.036,(0,-.010,.212),MAT_EDGE,12,bevel=.006)]
p += [cyl("ua_lowerCollar",.094,.034,(0,-.010,-.214),MAT_EDGE,12,bevel=.006)]
p += [cyl("ua_piston",.022,.225,(-.090,-.086,-.010),MAT_EDGE,8,rot=(0,math.radians(-5),math.radians(-3)),bevel=.004)]
components.append(join_component("ZAP_UpperArm",p))

# FOREARM — oversized tapered gauntlet like the reference.
p=[]
p += [cyl("fa_core",.084,.390,(0,0,0),MAT_RUBBER,14,bevel=.009)]
p += [uv_sphere("fa_elbow",(.074,.069,.074),(0,0,.168),MAT_RUBBER,16,10)]
p += [frustum("fa_shell",(.220,.205),(.145,.145),.300,(0,.020,.000),MAT_SHELL,bevel=.036)]
p += [prism("fa_frontBack",[(-.091,.117),(.091,.117),(.114,.050),(.083,-.122),(-.083,-.122),(-.114,.050)],.060,(0,.128,.010),MAT_RUBBER,bevel=.012)]
p += [prism("fa_front",[(-.090,.118),(.090,.118),(.112,.050),(.082,-.122),(-.082,-.122),(-.112,.050)],.046,(0,.160,.010),MAT_ACCENT,bevel=.010)]
p += [prism("fa_edge",[(-.064,.044),(.064,.044),(.075,0),(.055,-.042),(-.055,-.042),(-.075,0)],.025,(0,.176,.098),MAT_EDGE,bevel=.006)]
p += [cyl("fa_wrist",.088,.055,(0,0,-.175),MAT_DARK,12,bevel=.008)]
p += [box("fa_glow",(.020,.016,.120),(-.064,.181,.012),MAT_GLOW,bevel=.004)]
p += [box("fa_outerRail",(.052,.095,.205),(.118,.020,.012),MAT_EDGE,rot=(0,0,.04),bevel=.012)]
p += [prism("fa_wristPlate",[(-.072,.034),(.072,.034),(.085,-.010),(.056,-.052),(-.056,-.052),(-.085,-.010)],.036,(0,.155,-.145),MAT_ACCENT,bevel=.009)]
p += vent_row("fa_vent",[-.046,0,.046],.184,.064,.018,.052,MAT_DARK)
p += [front_disc("fa_fastener",.016,.012,(.060,.184,-.060),MAT_EDGE,10,.003)]
p += [prism("fa_elbowCap",[(-.072,.040),(.072,.040),(.088,-.008),(.058,-.052),(-.058,-.052),(-.088,-.008)],.040,(0,.148,.168),MAT_EDGE,bevel=.009)]
p += [prism("fa_backPlate",[(-.078,.105),(.078,.105),(.096,.035),(.066,-.112),(-.066,-.112),(-.096,.035)],.038,(0,-.126,.004),MAT_DARK,bevel=.010)]
p += [box("fa_wristRail",(.120,.026,.028),(0,.170,-.150),MAT_EDGE,bevel=.006)]
p += [cyl("fa_wristBearing",.096,.034,(0,-.004,-.181),MAT_EDGE,12,bevel=.006)]
p += [cyl("fa_piston",.020,.205,(.092,-.090,.010),MAT_EDGE,8,rot=(0,math.radians(4),math.radians(3)),bevel=.004)]
p += [box("fa_serviceLatch",(.050,.024,.036),(-.050,.183,-.090),MAT_EDGE,bevel=.005)]
components.append(join_component("ZAP_Forearm",p))

# HAND — dark armored glove with plate and cuff.
p=[]
p += [frustum("hand_core",(.145,.165),(.122,.140),.142,(0,0,0),MAT_RUBBER,bevel=.026)]
p += [box("hand_cuff",(.155,.125,.052),(0,-.005,.092),MAT_ACCENT,bevel=.015)]
p += [prism("hand_knuckle",[(-.068,.028),(.068,.028),(.076,-.018),(.050,-.045),(-.050,-.045),(-.076,-.018)],.035,(0,.105,.020),MAT_SHELL,bevel=.008)]
p += [box("hand_glow",(.052,.015,.014),(0,.129,.012),MAT_GLOW,bevel=.003)]
p += [box("hand_knuckleL",(.038,.032,.030),(-.045,.118,.042),MAT_EDGE,bevel=.006)]
p += [box("hand_knuckleC",(.038,.032,.030),(0,.120,.045),MAT_EDGE,bevel=.006)]
p += [box("hand_knuckleR",(.038,.032,.030),(.045,.118,.042),MAT_EDGE,bevel=.006)]
p += [box("hand_fingerRailL",(.026,.020,.055),(-.042,.108,-.030),MAT_EDGE,bevel=.004)]
p += [box("hand_fingerRailR",(.026,.020,.055),(.042,.108,-.030),MAT_EDGE,bevel=.004)]
components.append(join_component("ZAP_Hand",p))

# THIGH — broad upper-leg shell, strong taper, layered front plate.
p=[]
p += [cyl("th_core",.104,.470,(0,0,0),MAT_RUBBER,14,bevel=.010)]
p += [uv_sphere("th_hip",(.094,.089,.094),(0,0,.205),MAT_RUBBER,16,10)]
p += [cyl("th_kneeSleeve",.086,.075,(0,0,-.218),MAT_RUBBER,14,bevel=.008)]
p += [frustum("th_shell",(.252,.222),(.172,.160),.365,(0,.012,-.005),MAT_SHELL,bevel=.042)]
p += [prism("th_front",[(-.082,.120),(.082,.120),(.105,.058),(.072,-.128),(-.072,-.128),(-.105,.058)],.048,(0,.145,.005),MAT_EDGE,bevel=.011)]
p += [prism("th_accentBack",[(-.053,.101),(.047,.101),(.061,-.090),(.018,-.122),(-.064,-.079)],.044,(.074,.158,.000),MAT_RUBBER,bevel=.008)]
p += [prism("th_accent",[(-.052,.106),(.046,.106),(.060,-.092),(.018,-.124),(-.064,-.082)],.030,(.074,.186,.000),MAT_ACCENT,bevel=.006)]
p += [box("th_glow",(.018,.015,.105),(-.070,.184,.008),MAT_GLOW,bevel=.003)]
p += [box("th_outerRail",(.050,.075,.235),(.126,.010,-.015),MAT_EDGE,rot=(0,0,.045),bevel=.012)]
p += [prism("th_lowerPlate",[(-.070,.040),(.070,.040),(.086,0),(.052,-.055),(-.052,-.055),(-.086,0)],.036,(0,.156,-.142),MAT_DARK,bevel=.009)]
p += [front_disc("th_fastener",.016,.012,(-.050,.184,.118),MAT_EDGE,10,.003)]
p += [prism("th_kneeBridge",[(-.074,.040),(.074,.040),(.088,-.008),(.055,-.060),(-.055,-.060),(-.088,-.008)],.032,(0,.166,-.178),MAT_SHELL,bevel=.008)]
p += [box("th_rearBrace",(.105,.038,.205),(0,-.126,-.025),MAT_DARK,bevel=.010)]
p += [cyl("th_hipCollar",.112,.038,(0,-.010,.216),MAT_EDGE,12,bevel=.006)]
p += [cyl("th_piston",.022,.235,(-.102,-.082,-.010),MAT_EDGE,8,rot=(0,math.radians(-4),math.radians(-3)),bevel=.004)]
p += [box("th_serviceLatch",(.050,.022,.034),(.050,.186,-.126),MAT_EDGE,bevel=.005)]
components.append(join_component("ZAP_Thigh",p))

# SHIN — knee cup + broad shin armor + ankle cuff.
p=[]
p += [cyl("sh_core",.086,.395,(0,0,-.012),MAT_RUBBER,14,bevel=.009)]
p += [uv_sphere("sh_kneeJoint",(.090,.084,.090),(0,0,.170),MAT_RUBBER,16,10)]
p += [frustum("sh_shell",(.218,.202),(.154,.150),.290,(0,.012,-.055),MAT_SHELL,bevel=.037)]
p += [prism("sh_kneeBack",[(-.114,.054),(-.082,.094),(.082,.094),(.114,.054),(.092,-.061),(.058,-.090),(-.058,-.090),(-.092,-.061)],.070,(0,.128,.168),MAT_RUBBER,bevel=.013)]
p += [prism("sh_knee",[(-.102,.048),(-.073,.084),(.073,.084),(.102,.048),(.082,-.054),(.052,-.080),(-.052,-.080),(-.082,-.054)],.050,(0,.160,.168),MAT_ACCENT,bevel=.011)]
p += [prism("sh_front",[(-.065,.102),(.065,.102),(.082,.048),(.060,-.110),(-.060,-.110),(-.082,.048)],.042,(0,.145,-.060),MAT_EDGE,bevel=.009)]
p += [box("sh_glow",(.060,.016,.018),(0,.176,.170),MAT_GLOW,bevel=.004)]
p += [box("sh_ankle",(.152,.140,.060),(0,.010,-.198),MAT_DARK,bevel=.014)]
p += [prism("sh_outer",[(-.040,.080),(.035,.066),(.048,-.072),(.010,-.100),(-.050,-.060)],.036,(.080,.110,-.045),MAT_ACCENT,bevel=.008)]
p += [box("sh_outerRail",(.044,.070,.205),(-.108,.008,-.070),MAT_EDGE,rot=(0,0,-.035),bevel=.010)]
p += vent_row("sh_vent",[-.042,0,.042],.170,-.118,.018,.042,MAT_DARK)
p += [front_disc("sh_fastener",.016,.012,(.058,.174,.095),MAT_EDGE,10,.003)]
p += [prism("sh_calfPlate",[(-.070,.100),(.070,.100),(.086,.032),(.060,-.112),(-.060,-.112),(-.086,.032)],.040,(0,-.122,-.055),MAT_SHELL,bevel=.010)]
p += [box("sh_ankleRail",(.120,.030,.032),(0,.150,-.185),MAT_EDGE,bevel=.006)]
p += [cyl("sh_kneeBearing",.099,.032,(0,-.004,.176),MAT_EDGE,12,bevel=.006)]
p += [cyl("sh_piston",.019,.210,(.090,-.085,-.060),MAT_EDGE,8,rot=(0,math.radians(4),math.radians(3)),bevel=.004)]
p += [box("sh_serviceLatch",(.046,.022,.032),(-.044,.176,-.132),MAT_EDGE,bevel=.005)]
components.append(join_component("ZAP_Shin",p))

# FOOT — wide planted armored boot with layered toe and instep.
p=[]
p += [frustum("f_core",(.250,.315),(.270,.365),.120,(0,.040,0),MAT_RUBBER,rot=(math.radians(-2),0,0),bevel=.035)]
p += [frustum("f_top",(.205,.235),(.225,.270),.095,(0,.050,.080),MAT_SHELL,rot=(math.radians(-7),0,0),bevel=.026)]
p += [prism("f_toe",[(-.105,.030),(.105,.030),(.120,-.010),(.090,-.050),(-.090,-.050),(-.120,-.010)],.095,(0,.170,.030),MAT_EDGE,bevel=.015)]
p += [prism("f_accent",[(-.082,.030),(.082,.030),(.090,-.020),(.065,-.050),(-.065,-.050),(-.090,-.020)],.050,(0,-.088,.095),MAT_ACCENT,bevel=.010)]
p += [box("f_glow",(.074,.016,.014),(0,.120,.108),MAT_GLOW,bevel=.003)]
p += [box("f_sole",(.288,.370,.034),(0,.036,-.070),MAT_DARK,bevel=.010)]
p += [box("f_heel",(.205,.135,.085),(0,-.125,-.020),MAT_EDGE,bevel=.020)]
p += [box("f_toeRail",(.150,.040,.032),(0,.206,.046),MAT_ACCENT,bevel=.008)]
p += [front_disc("f_fastenerL",.013,.010,(-.070,.205,.058),MAT_EDGE,10,.002)]
p += [front_disc("f_fastenerR",.013,.010,(.070,.205,.058),MAT_EDGE,10,.002)]
p += [box("f_toeBumper",(.245,.048,.045),(0,.215,-.005),MAT_RUBBER,bevel=.012)]
p += [box("f_sideClamp",(.055,.240,.050),(.125,.040,-.030),MAT_EDGE,bevel=.010)]
p += [box("f_toeSeam",(.018,.150,.026),(0,.150,.055),MAT_DARK,bevel=.003)]
p += [box("f_ankleLatch",(.090,.030,.030),(0,.152,.105),MAT_EDGE,bevel=.005)]
p += vent_row("f_heelVent",[-.050,0,.050],-.204,-.010,.020,.036,MAT_DARK)
components.append(join_component("ZAP_Foot",p))

# ROLE MODULES — presentation-only add-ons mounted to the existing torso owner.
# They deliberately contain no collision/gameplay metadata. The runtime selects
# exactly one visible module from the current AI role + weapon context.
p=[]
p += [prism("ra_chest",[(-.245,.105),(.245,.105),(.285,.030),(.215,-.120),(-.215,-.120),(-.285,.030)],.070,(0,.330,.095),MAT_SHELL,bevel=.018)]
p += [box("ra_brow",(.330,.052,.050),(0,.372,.190),MAT_EDGE,bevel=.010)]
p += [box("ra_shoulderL",(.165,.135,.165),(-.350,.060,.190),MAT_ACCENT,rot=(0,0,-.12),bevel=.025)]
p += [box("ra_shoulderR",(.165,.135,.165),(.350,.060,.190),MAT_ACCENT,rot=(0,0,.12),bevel=.025)]
p += [box("ra_sternum",(.080,.030,.220),(0,.377,.020),MAT_DARK,bevel=.010)]
role=join_component("ZAP_Role_Assault",p);role["zap_role_variant"]="assault";components.append(role)

p=[]
p += [prism("rs_chest",[(-.125,.120),(.125,.120),(.155,.018),(.090,-.155),(-.090,-.155),(-.155,.018)],.038,(0,.326,.050),MAT_EDGE,bevel=.012)]
p += [box("rs_spine",(.075,.072,.360),(0,-.290,.040),MAT_DARK,bevel=.012)]
p += [box("rs_opticBase",(.110,.100,.085),(.235,.245,.235),MAT_SHELL,bevel=.014)]
p += [cyl("rs_optic",.050,.125,(.235,.330,.250),MAT_RUBBER,14,rot=(math.pi/2,0,0),bevel=.008)]
p += [front_disc("rs_lens",.035,.016,(.235,.398,.250),MAT_GLOW,14,.004)]
role=join_component("ZAP_Role_Sniper",p);role["zap_role_variant"]="sniper";components.append(role)

p=[]
p += [box("re_pack",(.360,.150,.360),(0,-.310,.025),MAT_DARK,bevel=.030)]
p += [box("re_packPlate",(.280,.055,.285),(0,-.405,.030),MAT_SHELL,bevel=.022)]
p += [cyl("re_toolL",.050,.300,(-.245,-.325,-.015),MAT_EDGE,12,bevel=.008)]
p += [cyl("re_toolR",.050,.300,(.245,-.325,-.015),MAT_EDGE,12,bevel=.008)]
p += [box("re_toolGlow",(.150,.020,.030),(0,-.442,.125),MAT_GLOW,bevel=.005)]
p += [box("re_service",(.095,.055,.120),(.185,.315,.020),MAT_ACCENT,bevel=.012)]
role=join_component("ZAP_Role_Engineer",p);role["zap_role_variant"]="engineer";components.append(role)

p=[]
p += [prism("rn_chest",[(-.300,.120),(.300,.120),(.340,.035),(.280,-.170),(-.280,-.170),(-.340,.035)],.085,(0,.345,.070),MAT_SHELL,bevel=.024)]
p += [box("rn_upper",(.470,.075,.120),(0,.385,.205),MAT_EDGE,bevel=.018)]
p += [box("rn_sideL",(.105,.100,.315),(-.330,.255,.025),MAT_SHELL,rot=(0,0,-.08),bevel=.020)]
p += [box("rn_sideR",(.105,.100,.315),(.330,.255,.025),MAT_SHELL,rot=(0,0,.08),bevel=.020)]
p += [box("rn_core",(.105,.030,.175),(0,.402,.020),MAT_ACCENT,bevel=.010)]
p += [box("rn_back",(.410,.095,.300),(0,-.330,.035),MAT_DARK,bevel=.026)]
role=join_component("ZAP_Role_Anchor",p);role["zap_role_variant"]="anchor";components.append(role)

p=[]
p += [prism("rf_chest",[(-.165,.095),(.165,.095),(.205,.010),(.115,-.130),(-.115,-.130),(-.205,.010)],.034,(0,.322,.060),MAT_EDGE,bevel=.010)]
p += [box("rf_railL",(.042,.032,.300),(-.185,.340,.030),MAT_ACCENT,rot=(0,0,-.10),bevel=.006)]
p += [box("rf_railR",(.042,.032,.300),(.185,.340,.030),MAT_ACCENT,rot=(0,0,.10),bevel=.006)]
p += [box("rf_back",(.160,.055,.215),(0,-.285,.020),MAT_DARK,bevel=.016)]
role=join_component("ZAP_Role_Flanker",p);role["zap_role_variant"]="flanker";components.append(role)

for o in components:
    o["zap_component"]=True
    o.location=(0,0,0)
    o.rotation_euler=(0,0,0)
    o.scale=(1,1,1)

# Deterministic runtime derivative for static/file:// loading.
# Geometry is exported as non-indexed triangles grouped by material name.
runtime={"version":46,"components":{}}
component_stats={}
for o in components:
    mesh=o.data
    mesh.calc_loop_triangles()
    buckets={}
    for tri in mesh.loop_triangles:
        mat_name=o.material_slots[tri.material_index].material.name if tri.material_index < len(o.material_slots) else "MAT_DARK"
        bucket=buckets.setdefault(mat_name,{"p":[],"n":[]})
        for vi,li in zip(tri.vertices,tri.loops):
            co=mesh.vertices[vi].co
            cn=mesh.corner_normals[li].vector
            bucket["p"].extend((round(float(co.x),5),round(float(co.z),5),round(float(-co.y),5)))
            bucket["n"].extend((round(float(cn.x),5),round(float(cn.z),5),round(float(-cn.y),5)))
    p=[];n=[];groups=[];start=0
    for mat_name in sorted(buckets.keys()):
        b=buckets[mat_name]
        count=len(b["p"])//3
        p.extend(b["p"]);n.extend(b["n"])
        groups.append({"start":start,"count":count,"material":mat_name})
        start+=count
    max_abs=max((abs(v) for v in p), default=0.0)
    if max_abs > 1.0:
        raise RuntimeError(f"{o.name}: local coordinate {max_abs:.5f} exceeds q16 runtime range [-1, 1]")
    def q16_base64(values):
        q=[max(-32767,min(32767,int(round(v*32767.0)))) for v in values]
        return base64.b64encode(struct.pack("<"+"h"*len(q),*q)).decode("ascii")
    runtime["components"][o.name]={"p16":q16_base64(p),"n16":q16_base64(n),"groups":groups}
    component_stats[o.name]={
        "triangles":len(p)//9,
        "runtimeVertices":len(p)//3,
        "materialGroups":len(groups),
        "maxAbsLocalCoordinate":round(max_abs,6),
    }
with open(OUT_RUNTIME_JS,"w",encoding="utf-8",newline="\n") as f:
    f.write("/* GENERATED by asset-staging/2026-10-06-bot-3d-pack-46/build_bot_3d.py; do not hand-edit. */\n")
    f.write("window.ZAP_BOT_MODEL_46=")
    json.dump(runtime,f,separators=(",",":"))
    f.write(";\n")

bpy.ops.object.select_all(action='DESELECT')
for o in components: o.select_set(True)
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

for o in components:
    o.hide_render=True

def inst(src_name, name, loc, scale=(1,1,1), rot=(0,0,0)):
    src=bpy.data.objects[src_name]
    o=src.copy(); o.data=src.data.copy(); o.name=name
    bpy.context.collection.objects.link(o)
    o.location=loc; o.scale=scale; o.rotation_euler=rot; o.hide_render=False
    return o

inst("ZAP_Pelvis","Preview_Pelvis",(0,0,.88),scale=(1.12,1.08,1.04))
inst("ZAP_Torso","Preview_Torso",(0,0,1.28),scale=(1.16,1.10,1.05))
inst("ZAP_Head","Preview_Head",(0,0,1.825),scale=(.92,.92,.95))
for side in (-1,1):
    sx=.38*side
    mirror=1 if side>0 else -1
    inst("ZAP_Shoulder",f"Preview_Shoulder_{side}",(sx,0,1.48),scale=(mirror*1.18,1.12,1.10))
    inst("ZAP_UpperArm",f"Preview_Upper_{side}",(sx,0,1.22),scale=(mirror*1.12,1.10,1.05),rot=(0,math.radians(8*side),math.radians(-8*side)))
    inst("ZAP_Forearm",f"Preview_Fore_{side}",(sx,0,.84),scale=(mirror*1.15,1.10,1.05),rot=(0,math.radians(4*side),math.radians(-4*side)))
    inst("ZAP_Hand",f"Preview_Hand_{side}",(sx,.02,.60),scale=(mirror*1.04,1.04,1.03))
    inst("ZAP_Thigh",f"Preview_Thigh_{side}",(.17*side,0,.54),scale=(mirror*1.16,1.12,1.06))
    inst("ZAP_Shin",f"Preview_Shin_{side}",(.17*side,0,.15),scale=(mirror*1.13,1.10,1.05))
    inst("ZAP_Foot",f"Preview_Foot_{side}",(.17*side,.07,-.08),scale=(mirror*1.15,1.14,1.05))

bpy.ops.mesh.primitive_plane_add(size=8, location=(0,0,-.145))
ground=bpy.context.object
ground.data.materials.append(make_mat("MAT_PREVIEW_GROUND",(0.025,0.035,0.05),0.1,0.78))

bpy.ops.object.camera_add(location=(3.15,5.2,2.65))
cam=bpy.context.object
bpy.context.scene.camera=cam
def look_at(obj, target):
    direction=Vector(target)-obj.location
    obj.rotation_euler=direction.to_track_quat('-Z','Y').to_euler()
look_at(cam,(0,0,1.0))
cam.data.lens=58

bpy.ops.object.light_add(type='AREA', location=(-2.5,3.0,4.5))
key=bpy.context.object; key.data.energy=1050; key.data.shape='DISK'; key.data.size=4.0
look_at(key,(0,0,1.0))
bpy.ops.object.light_add(type='AREA', location=(3.2,1.0,2.2))
fill=bpy.context.object; fill.data.energy=650; fill.data.size=3.0
look_at(fill,(0,0,1.1))
bpy.ops.object.light_add(type='AREA', location=(0,-3.0,3.8))
rim=bpy.context.object; rim.data.energy=900; rim.data.size=2.2
look_at(rim,(0,0,1.2))

scene=bpy.context.scene
scene.render.engine='BLENDER_EEVEE'
scene.render.resolution_x=900
scene.render.resolution_y=1100
scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG'
scene.render.film_transparent=False
scene.world.color=(0.006,0.010,0.018)
scene.render.filepath=OUT_PREVIEW
scene.view_settings.look='AgX - Medium High Contrast'
bpy.ops.wm.save_as_mainfile(filepath=OUT_BLEND)
bpy.ops.render.render(write_still=True)

def file_identity(path):
    h=hashlib.sha256()
    with open(path,"rb") as f:
        for chunk in iter(lambda:f.read(1024*1024),b""):
            h.update(chunk)
    return {"bytes":os.path.getsize(path),"sha256":h.hexdigest()}

manifest={
    "schema":1,
    "packVersion":46,
    "generator":"asset-staging/2026-10-06-bot-3d-pack-46/build_bot_3d.py",
    "blenderVersion":bpy.app.version_string,
    "coordinateBridge":"Blender (x,y,z) -> runtime (x,z,-y); component-local q16 range [-1,1]",
    "components":component_stats,
    "artifacts":{
        "glb":file_identity(OUT_GLB),
        "runtimeJs":file_identity(OUT_RUNTIME_JS),
        "blend":file_identity(OUT_BLEND),
        "preview":file_identity(OUT_PREVIEW),
        "builder":file_identity(__file__),
    }
}
with open(OUT_MANIFEST,"w",encoding="utf-8",newline="\n") as f:
    json.dump(manifest,f,ensure_ascii=False,indent=2)
    f.write("\n")

print("ZAP_BOT_GLB", OUT_GLB)
print("ZAP_BOT_BLEND", OUT_BLEND)
print("ZAP_BOT_PREVIEW", OUT_PREVIEW)
print("ZAP_BOT_MANIFEST", OUT_MANIFEST)
