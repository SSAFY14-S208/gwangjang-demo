import math
import os
import sys

import bpy
from mathutils import Vector


BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))


def parse_args():
    blend_path = os.path.join(BASE_DIR, "blender_output", "witch_magic_scene.blend")
    render_path = os.path.join(BASE_DIR, "blender_output", "witch_magic_scene_preview.png")

    if "--" in sys.argv:
        extra = sys.argv[sys.argv.index("--") + 1 :]
        if len(extra) >= 1:
            blend_path = extra[0]
        if len(extra) >= 2:
            render_path = extra[1]

    return blend_path, render_path


def ensure_parent(path):
    os.makedirs(os.path.dirname(path), exist_ok=True)


def reset_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)


def set_node_input(node, names, value):
    for name in names:
        socket = node.inputs.get(name)
        if socket is not None:
            socket.default_value = value
            return


def assign_material(obj, material):
    obj.data.materials.clear()
    obj.data.materials.append(material)


def shade_smooth(obj):
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.shade_smooth()


def add_bevel(obj, width=0.03, segments=3):
    bevel = obj.modifiers.new(name="Bevel", type="BEVEL")
    bevel.width = width
    bevel.segments = segments
    bevel.profile = 0.7


def add_subsurf(obj, levels=2):
    subsurf = obj.modifiers.new(name="Subdivision", type="SUBSURF")
    subsurf.levels = levels
    subsurf.render_levels = levels


def make_principled_material(name, color, roughness=0.65, metallic=0.0, specular=0.28, subsurface=0.0):
    material = bpy.data.materials.new(name=name)
    material.use_nodes = True
    bsdf = material.node_tree.nodes["Principled BSDF"]
    set_node_input(bsdf, ["Base Color"], color)
    set_node_input(bsdf, ["Roughness"], roughness)
    set_node_input(bsdf, ["Metallic"], metallic)
    set_node_input(bsdf, ["Specular IOR Level", "Specular"], specular)
    set_node_input(bsdf, ["Subsurface Weight", "Subsurface"], subsurface)
    return material


def make_emission_material(name, color, strength=1.0):
    material = bpy.data.materials.new(name=name)
    material.use_nodes = True
    nodes = material.node_tree.nodes
    links = material.node_tree.links
    nodes.clear()

    emission = nodes.new(type="ShaderNodeEmission")
    output = nodes.new(type="ShaderNodeOutputMaterial")
    emission.inputs["Color"].default_value = color
    emission.inputs["Strength"].default_value = strength
    links.new(emission.outputs["Emission"], output.inputs["Surface"])
    return material


def create_cube(name, location, scale, rotation=(0.0, 0.0, 0.0), material=None, bevel_width=0.0, subsurf_levels=0):
    bpy.ops.mesh.primitive_cube_add(location=location, rotation=rotation)
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale

    if material is not None:
        assign_material(obj, material)
    if bevel_width > 0.0:
        add_bevel(obj, width=bevel_width)
    if subsurf_levels > 0:
        add_subsurf(obj, levels=subsurf_levels)
    shade_smooth(obj)
    return obj


def create_uv_sphere(name, location, scale, material=None, segments=64, rings=32):
    bpy.ops.mesh.primitive_uv_sphere_add(
        segments=segments,
        ring_count=rings,
        location=location,
    )
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    if material is not None:
        assign_material(obj, material)
    shade_smooth(obj)
    return obj


def create_cylinder(name, location, radius, depth, material=None, rotation=(0.0, 0.0, 0.0), vertices=64):
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=vertices,
        radius=radius,
        depth=depth,
        location=location,
        rotation=rotation,
    )
    obj = bpy.context.object
    obj.name = name
    if material is not None:
        assign_material(obj, material)
    shade_smooth(obj)
    return obj


def create_cone(name, location, radius_bottom, radius_top, depth, material=None, rotation=(0.0, 0.0, 0.0), vertices=72):
    bpy.ops.mesh.primitive_cone_add(
        vertices=vertices,
        radius1=radius_bottom,
        radius2=radius_top,
        depth=depth,
        location=location,
        rotation=rotation,
    )
    obj = bpy.context.object
    obj.name = name
    if material is not None:
        assign_material(obj, material)
    shade_smooth(obj)
    return obj


def create_mouth(name, location, material):
    curve_data = bpy.data.curves.new(name=name, type="CURVE")
    curve_data.dimensions = "3D"
    curve_data.resolution_u = 24
    curve_data.bevel_depth = 0.012
    curve_data.bevel_resolution = 6

    spline = curve_data.splines.new("BEZIER")
    spline.bezier_points.add(2)

    coords = [
        (-0.065, 0.0, 0.0),
        (0.0, 0.0, 0.026),
        (0.065, 0.0, 0.0),
    ]

    for index, coord in enumerate(coords):
        point = spline.bezier_points[index]
        point.co = Vector(coord)
        point.handle_left_type = "AUTO"
        point.handle_right_type = "AUTO"

    obj = bpy.data.objects.new(name, curve_data)
    bpy.context.collection.objects.link(obj)
    obj.location = location
    obj.rotation_euler = (math.radians(88.0), 0.0, 0.0)
    obj.data.materials.append(material)
    return obj


def create_plane(name, location, size, material):
    bpy.ops.mesh.primitive_plane_add(size=size, location=location)
    obj = bpy.context.object
    obj.name = name
    assign_material(obj, material)
    return obj


def look_at(obj, target):
    direction = target - obj.location
    obj.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()


def parent_to_root(root, *objects):
    for obj in objects:
        if obj is not None:
            obj.parent = root


def setup_scene(render_path):
    scene = bpy.context.scene
    scene.render.engine = "CYCLES"
    scene.render.filepath = render_path
    scene.render.image_settings.file_format = "PNG"
    scene.render.resolution_x = 900
    scene.render.resolution_y = 1200
    scene.render.resolution_percentage = 100

    if hasattr(scene, "cycles"):
        scene.cycles.samples = 96
        scene.cycles.use_denoising = True
        scene.cycles.max_bounces = 8

    world = bpy.data.worlds.get("World")
    if world is None:
        world = bpy.data.worlds.new("World")
    scene.world = world
    world.use_nodes = True
    background = world.node_tree.nodes["Background"]
    background.inputs["Color"].default_value = (0.985, 0.98, 0.97, 1.0)
    background.inputs["Strength"].default_value = 0.18

    scene.view_settings.view_transform = "Standard"
    scene.view_settings.exposure = -0.95

    bpy.ops.object.camera_add(location=(-4.8, -9.5, 4.45))
    camera = bpy.context.object
    camera.data.lens = 60
    look_at(camera, Vector((0.02, -0.12, 2.28)))
    scene.camera = camera

    bpy.ops.object.light_add(type="AREA", location=(-4.6, -4.2, 6.4))
    key = bpy.context.object
    key.data.energy = 780
    key.data.shape = "RECTANGLE"
    key.data.size = 6.0
    key.data.size_y = 5.0
    look_at(key, Vector((0.0, -0.05, 2.2)))

    bpy.ops.object.light_add(type="AREA", location=(4.5, -0.8, 5.0))
    fill = bpy.context.object
    fill.data.energy = 260
    fill.data.shape = "RECTANGLE"
    fill.data.size = 5.0
    fill.data.size_y = 3.5
    look_at(fill, Vector((0.3, -0.2, 2.4)))

    bpy.ops.object.light_add(type="AREA", location=(1.8, 3.0, 4.4))
    rim = bpy.context.object
    rim.data.energy = 90
    rim.data.shape = "RECTANGLE"
    rim.data.size = 3.2
    rim.data.size_y = 2.8
    look_at(rim, Vector((0.0, 0.1, 2.8)))

    return scene


def build_character():
    root = bpy.data.objects.new("WitchCharacter", None)
    bpy.context.collection.objects.link(root)

    robe_mat = make_principled_material("Robe", (0.31, 0.27, 0.50, 1.0), roughness=0.92)
    robe_dark_mat = make_principled_material("RobeDark", (0.27, 0.23, 0.43, 1.0), roughness=0.9)
    hat_band_mat = make_principled_material("HatBand", (0.91, 0.58, 0.58, 1.0), roughness=0.72)
    skin_mat = make_principled_material("Skin", (0.98, 0.88, 0.84, 1.0), roughness=0.58, subsurface=0.07)
    hair_mat = make_principled_material("Hair", (0.62, 0.47, 0.35, 1.0), roughness=0.82)
    boot_mat = make_principled_material("Boot", (0.34, 0.24, 0.20, 1.0), roughness=0.85)
    eye_mat = make_principled_material("Eye", (0.11, 0.09, 0.14, 1.0), roughness=0.25, specular=0.42)
    blush_mat = make_principled_material("Blush", (0.98, 0.77, 0.79, 1.0), roughness=0.78)
    charm_mat = make_principled_material("Charm", (0.98, 0.85, 0.78, 1.0), roughness=0.65, metallic=0.05)
    floor_mat = make_principled_material("Floor", (0.965, 0.96, 0.95, 1.0), roughness=0.9)
    shadow_tint = make_emission_material("ShadowTint", (1.0, 1.0, 1.0, 1.0), strength=0.0)
    del shadow_tint

    floor = create_plane("Floor", location=(0.0, 0.0, 0.0), size=14.0, material=floor_mat)

    body = create_cone(
        "Body",
        location=(0.0, 0.0, 1.57),
        radius_bottom=0.88,
        radius_top=0.50,
        depth=2.24,
        material=robe_mat,
    )
    add_bevel(body, width=0.05, segments=3)
    add_subsurf(body, levels=2)
    shade_smooth(body)

    head = create_uv_sphere("Head", location=(0.0, -0.04, 3.04), scale=(0.58, 0.60, 0.58), material=skin_mat)

    hair_back = create_uv_sphere("HairBack", location=(0.0, 0.14, 2.98), scale=(0.78, 0.60, 0.70), material=hair_mat)
    hair_left = create_uv_sphere("HairLeft", location=(-0.58, 0.10, 2.72), scale=(0.30, 0.23, 0.48), material=hair_mat)
    hair_right = create_uv_sphere("HairRight", location=(0.58, 0.11, 2.72), scale=(0.30, 0.23, 0.48), material=hair_mat)
    bang_left = create_uv_sphere("BangLeft", location=(-0.20, -0.25, 3.40), scale=(0.24, 0.10, 0.18), material=hair_mat, segments=48, rings=24)
    bang_right = create_uv_sphere("BangRight", location=(0.24, -0.22, 3.44), scale=(0.26, 0.10, 0.20), material=hair_mat, segments=48, rings=24)
    fringe_center = create_uv_sphere("FringeCenter", location=(0.02, -0.18, 3.53), scale=(0.22, 0.07, 0.10), material=hair_mat, segments=48, rings=24)

    ear_left = create_uv_sphere("EarLeft", location=(-0.58, -0.02, 2.95), scale=(0.09, 0.07, 0.10), material=skin_mat, segments=32, rings=16)
    ear_right = create_uv_sphere("EarRight", location=(0.60, -0.02, 2.95), scale=(0.09, 0.07, 0.10), material=skin_mat, segments=32, rings=16)

    left_sleeve = create_cone(
        "LeftSleeve",
        location=(-0.67, -0.01, 1.95),
        radius_bottom=0.26,
        radius_top=0.17,
        depth=1.08,
        rotation=(math.radians(1.0), math.radians(5.0), math.radians(8.0)),
        material=robe_dark_mat,
    )
    right_sleeve = create_cone(
        "RightSleeve",
        location=(0.72, -0.18, 1.92),
        radius_bottom=0.26,
        radius_top=0.17,
        depth=1.04,
        rotation=(math.radians(11.0), math.radians(-4.0), math.radians(-14.0)),
        material=robe_dark_mat,
    )

    left_hand = create_uv_sphere("LeftHand", location=(-0.74, -0.03, 1.33), scale=(0.11, 0.09, 0.15), material=skin_mat, segments=32, rings=18)
    right_hand = create_uv_sphere("RightHand", location=(0.85, -0.22, 1.28), scale=(0.11, 0.09, 0.15), material=skin_mat, segments=32, rings=18)

    left_leg = create_cylinder("LeftLeg", location=(-0.15, 0.02, 0.50), radius=0.10, depth=0.52, material=skin_mat)
    right_leg = create_cylinder("RightLeg", location=(0.18, -0.05, 0.49), radius=0.10, depth=0.52, material=skin_mat)

    left_boot = create_uv_sphere("LeftBoot", location=(-0.19, 0.04, 0.13), scale=(0.26, 0.18, 0.23), material=boot_mat, segments=48, rings=24)
    right_boot = create_uv_sphere("RightBoot", location=(0.24, -0.09, 0.12), scale=(0.26, 0.18, 0.23), material=boot_mat, segments=48, rings=24)
    left_boot_top = create_cylinder("LeftBootTop", location=(-0.17, 0.02, 0.34), radius=0.15, depth=0.24, material=boot_mat)
    right_boot_top = create_cylinder("RightBootTop", location=(0.22, -0.06, 0.33), radius=0.15, depth=0.24, material=boot_mat)

    eye_left = create_uv_sphere("EyeLeft", location=(-0.13, -0.60, 3.00), scale=(0.055, 0.040, 0.042), material=eye_mat, segments=24, rings=16)
    eye_right = create_uv_sphere("EyeRight", location=(0.15, -0.61, 2.99), scale=(0.055, 0.040, 0.042), material=eye_mat, segments=24, rings=16)
    cheek_left = create_uv_sphere("CheekLeft", location=(-0.25, -0.57, 2.84), scale=(0.045, 0.016, 0.022), material=blush_mat, segments=24, rings=16)
    cheek_right = create_uv_sphere("CheekRight", location=(0.27, -0.58, 2.83), scale=(0.045, 0.016, 0.022), material=blush_mat, segments=24, rings=16)
    nose = create_uv_sphere("Nose", location=(0.01, -0.62, 2.90), scale=(0.016, 0.012, 0.014), material=skin_mat, segments=24, rings=16)
    mouth = create_mouth("Mouth", location=(0.03, -0.63, 2.78), material=blush_mat)

    charm = create_uv_sphere("Charm", location=(0.04, -0.33, 2.14), scale=(0.12, 0.04, 0.12), material=charm_mat, segments=32, rings=18)

    hat_brim = create_cylinder(
        "HatBrim",
        location=(0.02, -0.02, 3.89),
        radius=0.96,
        depth=0.08,
        material=robe_dark_mat,
        rotation=(math.radians(4.0), math.radians(-7.0), math.radians(-6.0)),
    )
    hat_cone = create_cone(
        "HatCone",
        location=(0.18, 0.02, 4.50),
        radius_bottom=0.50,
        radius_top=0.05,
        depth=1.36,
        material=robe_dark_mat,
        rotation=(math.radians(-2.0), math.radians(20.0), math.radians(-8.0)),
        vertices=32,
    )
    hat_band = create_cylinder(
        "HatBand",
        location=(0.08, -0.01, 4.01),
        radius=0.50,
        depth=0.12,
        material=hat_band_mat,
        rotation=(math.radians(4.0), math.radians(-7.0), math.radians(-6.0)),
    )
    add_subsurf(hat_cone, levels=3)
    shade_smooth(hat_cone)

    parent_to_root(
        root,
        floor,
        body,
        head,
        hair_back,
        hair_left,
        hair_right,
        bang_left,
        bang_right,
        fringe_center,
        ear_left,
        ear_right,
        left_sleeve,
        right_sleeve,
        left_hand,
        right_hand,
        left_leg,
        right_leg,
        left_boot,
        right_boot,
        left_boot_top,
        right_boot_top,
        eye_left,
        eye_right,
        cheek_left,
        cheek_right,
        nose,
        mouth,
        charm,
        hat_brim,
        hat_cone,
        hat_band,
    )

    root.location = (0.0, 0.0, 0.0)
    root.rotation_euler = (0.0, 0.0, math.radians(-6.0))
    return root


def main():
    blend_path, render_path = parse_args()
    ensure_parent(blend_path)
    ensure_parent(render_path)

    reset_scene()
    setup_scene(render_path)
    build_character()

    bpy.ops.object.select_all(action="DESELECT")
    bpy.ops.wm.save_as_mainfile(filepath=blend_path)
    bpy.ops.render.render(write_still=True)

    print(f"Saved blend to: {blend_path}")
    print(f"Saved render to: {render_path}")


if __name__ == "__main__":
    main()
