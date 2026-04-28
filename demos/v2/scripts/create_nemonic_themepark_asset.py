import math
import os
import sys

import bpy
from mathutils import Vector


BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))


def parse_args():
    blend_path = os.path.join(BASE_DIR, "blender_output", "nemonic_themepark_asset.blend")
    render_path = os.path.join(BASE_DIR, "blender_output", "nemonic_themepark_asset_preview.png")
    glb_path = os.path.join(BASE_DIR, "public", "models", "nemonic_themepark_asset.glb")

    if "--" in sys.argv:
        extra = sys.argv[sys.argv.index("--") + 1 :]
        if len(extra) >= 1:
            blend_path = extra[0]
        if len(extra) >= 2:
            render_path = extra[1]
        if len(extra) >= 3:
            glb_path = extra[2]

    return blend_path, render_path, glb_path


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


def make_principled_material(name, color, roughness=0.5, metallic=0.0, emission=None, emission_strength=0.0):
    material = bpy.data.materials.new(name=name)
    material.use_nodes = True
    bsdf = material.node_tree.nodes["Principled BSDF"]
    set_node_input(bsdf, ["Base Color"], color)
    set_node_input(bsdf, ["Roughness"], roughness)
    set_node_input(bsdf, ["Metallic"], metallic)
    if emission is not None:
        set_node_input(bsdf, ["Emission Color"], emission)
        set_node_input(bsdf, ["Emission Strength"], emission_strength)
    return material


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


def create_mesh_primitive(op, name, material=None, smooth=True, bevel=0.0, subsurf=0, **kwargs):
    op(**kwargs)
    obj = bpy.context.object
    obj.name = name

    if material is not None:
        assign_material(obj, material)
    if bevel > 0.0:
        add_bevel(obj, width=bevel)
    if subsurf > 0:
        add_subsurf(obj, levels=subsurf)
    if smooth:
        shade_smooth(obj)
    return obj


def create_sphere(name, location, scale, material):
    obj = create_mesh_primitive(
        bpy.ops.mesh.primitive_uv_sphere_add,
        name=name,
        material=material,
        location=location,
        segments=48,
        ring_count=24,
    )
    obj.scale = scale
    return obj


def create_cylinder(name, location, radius, depth, material, rotation=(0.0, 0.0, 0.0), vertices=48):
    return create_mesh_primitive(
        bpy.ops.mesh.primitive_cylinder_add,
        name=name,
        material=material,
        location=location,
        radius=radius,
        depth=depth,
        rotation=rotation,
        vertices=vertices,
        bevel=0.01,
    )


def create_cone(name, location, radius_bottom, radius_top, depth, material, rotation=(0.0, 0.0, 0.0), vertices=48):
    return create_mesh_primitive(
        bpy.ops.mesh.primitive_cone_add,
        name=name,
        material=material,
        location=location,
        radius1=radius_bottom,
        radius2=radius_top,
        depth=depth,
        rotation=rotation,
        vertices=vertices,
        bevel=0.01,
    )


def create_torus(name, location, major_radius, minor_radius, material, rotation=(0.0, 0.0, 0.0)):
    return create_mesh_primitive(
        bpy.ops.mesh.primitive_torus_add,
        name=name,
        material=material,
        location=location,
        major_radius=major_radius,
        minor_radius=minor_radius,
        rotation=rotation,
        major_segments=72,
        minor_segments=24,
        bevel=0.0,
    )


def create_cube(name, location, scale, material, rotation=(0.0, 0.0, 0.0)):
    obj = create_mesh_primitive(
        bpy.ops.mesh.primitive_cube_add,
        name=name,
        material=material,
        location=location,
        rotation=rotation,
        bevel=0.03,
    )
    obj.scale = scale
    return obj


def create_disc(name, location, radius, material, thickness=0.12):
    return create_cylinder(name, location, radius, thickness, material)


def parent_to(root, *objects):
    for obj in objects:
        if obj is not None:
            obj.parent = root


def look_at(obj, target):
    direction = target - obj.location
    obj.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()


def create_cloud_cluster(name, location, scale, material):
    root = bpy.data.objects.new(name, None)
    bpy.context.collection.objects.link(root)
    root.location = location
    root.scale = (scale, scale, scale)

    puff_specs = [
        (-0.55, 0.0, 0.0, 0.48),
        (-0.20, 0.08, 0.12, 0.6),
        (0.18, 0.04, 0.18, 0.54),
        (0.52, 0.0, 0.04, 0.42),
        (0.02, -0.02, -0.05, 0.52),
    ]

    for index, (x, y, z, radius) in enumerate(puff_specs):
        puff = create_sphere(
            name=f"{name}_Puff_{index}",
            location=(location[0] + x * scale, location[1] + y * scale, location[2] + z * scale),
            scale=(radius * scale, radius * scale * 0.9, radius * scale * 0.82),
            material=material,
        )
        puff.parent = root

    return root


def create_balloon(name, location, color_material, string_material, scale=1.0):
    root = bpy.data.objects.new(name, None)
    bpy.context.collection.objects.link(root)
    root.location = location

    balloon = create_sphere(
        name=f"{name}_Body",
        location=location,
        scale=(0.22 * scale, 0.22 * scale, 0.28 * scale),
        material=color_material,
    )
    balloon.parent = root

    knot = create_cone(
        name=f"{name}_Knot",
        location=(location[0], location[1], location[2] - 0.26 * scale),
        radius_bottom=0.03 * scale,
        radius_top=0.0,
        depth=0.06 * scale,
        material=color_material,
        rotation=(math.pi, 0.0, 0.0),
        vertices=12,
    )
    knot.parent = root

    string = create_cylinder(
        name=f"{name}_String",
        location=(location[0], location[1], location[2] - 0.64 * scale),
        radius=0.004 * scale,
        depth=0.72 * scale,
        material=string_material,
        vertices=10,
    )
    string.parent = root

    return root


def setup_scene(render_path):
    scene = bpy.context.scene
    scene.render.engine = "CYCLES"
    scene.render.filepath = render_path
    scene.render.image_settings.file_format = "PNG"
    scene.render.resolution_x = 1600
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
    background.inputs["Color"].default_value = (1.0, 0.88, 0.95, 1.0)
    background.inputs["Strength"].default_value = 0.9

    scene.view_settings.view_transform = "Standard"
    scene.view_settings.exposure = -0.8

    bpy.ops.object.camera_add(location=(0.0, -13.8, 4.7))
    camera = bpy.context.object
    camera.data.lens = 52
    look_at(camera, Vector((0.0, 0.0, 1.75)))
    scene.camera = camera

    bpy.ops.object.light_add(type="AREA", location=(-6.2, -6.5, 8.2))
    key = bpy.context.object
    key.data.energy = 1250
    key.data.shape = "RECTANGLE"
    key.data.size = 8.0
    key.data.size_y = 6.5
    look_at(key, Vector((0.0, 0.0, 1.7)))

    bpy.ops.object.light_add(type="AREA", location=(6.2, -3.6, 6.1))
    fill = bpy.context.object
    fill.data.energy = 480
    fill.data.shape = "RECTANGLE"
    fill.data.size = 5.5
    fill.data.size_y = 4.5
    look_at(fill, Vector((0.0, 0.0, 1.5)))

    bpy.ops.object.light_add(type="AREA", location=(0.0, 1.4, 7.2))
    rim = bpy.context.object
    rim.data.energy = 220
    rim.data.shape = "RECTANGLE"
    rim.data.size = 4.0
    rim.data.size_y = 3.6
    look_at(rim, Vector((0.0, 0.0, 1.5)))


def build_themepark_asset():
    root = bpy.data.objects.new("NemonicThemepark", None)
    bpy.context.collection.objects.link(root)

    shell_mat = make_principled_material("Shell", (0.96, 0.97, 1.0, 1.0), roughness=0.48)
    pearl_mat = make_principled_material("Pearl", (0.92, 0.95, 1.0, 1.0), roughness=0.52)
    white_mat = make_principled_material("CloudWhite", (1.0, 0.985, 1.0, 1.0), roughness=0.68)
    string_mat = make_principled_material("String", (0.98, 0.97, 1.0, 1.0), roughness=1.0)
    yellow_mat = make_principled_material("Yellow", (1.0, 0.86, 0.34, 1.0), roughness=0.32, emission=(1.0, 0.86, 0.34, 1.0), emission_strength=0.08)
    mint_mat = make_principled_material("Mint", (0.44, 0.95, 0.84, 1.0), roughness=0.34, emission=(0.44, 0.95, 0.84, 1.0), emission_strength=0.04)
    cyan_mat = make_principled_material("Cyan", (0.27, 0.83, 1.0, 1.0), roughness=0.34, emission=(0.27, 0.83, 1.0, 1.0), emission_strength=0.04)
    blue_mat = make_principled_material("Blue", (0.18, 0.63, 1.0, 1.0), roughness=0.34)
    coral_mat = make_principled_material("Coral", (1.0, 0.5, 0.53, 1.0), roughness=0.34)
    pink_mat = make_principled_material("Pink", (1.0, 0.56, 0.8, 1.0), roughness=0.34)
    violet_mat = make_principled_material("Violet", (0.72, 0.56, 1.0, 1.0), roughness=0.34)
    peach_mat = make_principled_material("Peach", (1.0, 0.78, 0.57, 1.0), roughness=0.4)
    glass_mat = make_principled_material("Glass", (0.88, 0.98, 1.0, 1.0), roughness=0.15)
    ink_mat = make_principled_material("Ink", (0.25, 0.18, 0.31, 1.0), roughness=0.52)

    floor = create_disc("Floor", (0.0, 0.0, 0.0), radius=4.55, material=shell_mat, thickness=0.24)
    floor.scale = (1.0, 1.0, 0.65)
    parent_to(root, floor)

    cloud_bank = create_cloud_cluster("CloudBank", (0.0, 0.28, 0.52), 2.25, white_mat)
    cloud_bank.parent = root

    rainbow_colors = [blue_mat, cyan_mat, mint_mat, yellow_mat, peach_mat, coral_mat, pink_mat]
    for index, material in enumerate(rainbow_colors):
        torus = create_torus(
            name=f"Rainbow_{index}",
            location=(0.0, -1.15 + index * 0.02, 2.55 - index * 0.05),
            major_radius=3.7 - index * 0.34,
            minor_radius=0.18,
            material=material,
            rotation=(math.radians(90.0), 0.0, 0.0),
        )
        torus.scale = (1.0, 1.0, 0.92)
        parent_to(root, torus)

    arch_cloud_center = create_cloud_cluster("ArchCloudCenter", (0.0, -0.25, 3.16), 0.9, white_mat)
    arch_cloud_left = create_cloud_cluster("ArchCloudLeft", (-1.55, -0.48, 2.7), 0.48, white_mat)
    arch_cloud_right = create_cloud_cluster("ArchCloudRight", (1.55, -0.48, 2.7), 0.48, white_mat)
    arch_cloud_center.parent = root
    arch_cloud_left.parent = root
    arch_cloud_right.parent = root

    base_stack = create_disc("StageBase", (0.0, 0.0, 0.48), radius=1.7, material=pearl_mat, thickness=0.16)
    mid_stack = create_disc("StageMid", (0.0, 0.0, 0.64), radius=1.35, material=shell_mat, thickness=0.14)
    top_stack = create_disc("StageTop", (0.0, 0.0, 0.82), radius=1.02, material=yellow_mat, thickness=0.12)
    center_pole = create_cylinder("CenterPole", (0.0, 0.0, 1.8), radius=0.09, depth=1.8, material=yellow_mat)
    parent_to(root, base_stack, mid_stack, top_stack, center_pole)

    canopy_disc = create_disc("CanopyDisc", (0.0, 0.0, 2.72), radius=1.42, material=peach_mat, thickness=0.12)
    canopy_top = create_cone("CanopyTop", (0.0, 0.0, 3.28), 1.08, 0.0, 0.98, pink_mat)
    canopy_cap = create_sphere("CanopyCap", (0.0, 0.0, 3.82), (0.24, 0.24, 0.24), yellow_mat)
    parent_to(root, canopy_disc, canopy_top, canopy_cap)

    memo_mats = [pink_mat, cyan_mat, yellow_mat, violet_mat]
    memo_positions = [
        (-0.72, 0.28, 1.0),
        (-0.18, 0.52, 0.95),
        (0.42, 0.34, 1.02),
        (0.72, -0.14, 0.98),
        (0.12, -0.5, 0.94),
    ]
    for index, (x, y, z) in enumerate(memo_positions):
        memo = create_cube(
            name=f"Memo_{index}",
            location=(x, y, z),
            scale=(0.26, 0.18, 0.03),
            material=memo_mats[index % len(memo_mats)],
            rotation=(0.0, 0.0, math.radians((index - 2) * 14.0)),
        )
        parent_to(root, memo)

    hanger_angles = [0.0, 72.0, 144.0, 216.0, 288.0]
    ornament_mats = [yellow_mat, mint_mat, pink_mat, cyan_mat, peach_mat]
    for index, angle_deg in enumerate(hanger_angles):
        angle = math.radians(angle_deg)
        x = math.cos(angle) * 0.95
        y = math.sin(angle) * 0.95
        string = create_cylinder(
            name=f"CanopyString_{index}",
            location=(x, y, 2.2),
            radius=0.008,
            depth=0.78,
            material=string_mat,
            vertices=10,
        )
        orb = create_sphere(
            name=f"CanopyOrb_{index}",
            location=(x, y, 1.72),
            scale=(0.11, 0.11, 0.11),
            material=ornament_mats[index],
        )
        parent_to(root, string, orb)

    balloon_specs = [
        ("BalloonLeftA", (-2.78, -0.1, 3.05), yellow_mat, 1.2),
        ("BalloonLeftB", (-2.18, 0.18, 2.55), pink_mat, 1.0),
        ("BalloonRightA", (2.76, 0.04, 3.0), white_mat, 1.15),
        ("BalloonRightB", (2.22, -0.16, 2.62), cyan_mat, 0.98),
    ]
    for name, location, color, scale in balloon_specs:
        balloon = create_balloon(name, location, color, string_mat, scale=scale)
        balloon.parent = root

    side_cloud_left = create_cloud_cluster("SideCloudLeft", (-2.32, 0.0, 1.42), 0.84, white_mat)
    side_cloud_right = create_cloud_cluster("SideCloudRight", (2.36, 0.0, 1.36), 0.78, white_mat)
    side_cloud_left.parent = root
    side_cloud_right.parent = root

    bulb_mats = [yellow_mat, cyan_mat, pink_mat, mint_mat, violet_mat]
    for index in range(10):
        bulb = create_sphere(
            name=f"FrontBulb_{index}",
            location=(-3.2 + index * 0.72, 1.22, 0.78),
            scale=(0.11, 0.11, 0.11),
            material=bulb_mats[index % len(bulb_mats)],
        )
        parent_to(root, bulb)

    rail = create_cylinder("FrontRail", (0.0, 1.18, 0.7), radius=0.05, depth=6.9, material=white_mat, rotation=(0.0, math.radians(90.0), 0.0), vertices=24)
    parent_to(root, rail)

    for x in (-1.05, 0.0, 1.05):
        stand = create_cylinder("Podium", (x, -0.18, 1.18), radius=0.08, depth=0.5, material=yellow_mat, vertices=18)
        top = create_sphere("PodiumTop", (x, -0.18, 1.48), (0.12, 0.12, 0.12), pink_mat if x < 0 else cyan_mat if x > 0 else mint_mat)
        parent_to(root, stand, top)

    sign_board = create_cube("TicketSign", (2.05, 0.5, 1.95), (0.42, 0.16, 0.05), yellow_mat)
    sign_dot_left = create_sphere("SignDotLeft", (1.92, 0.5, 1.97), (0.05, 0.05, 0.05), ink_mat)
    sign_dot_right = create_sphere("SignDotRight", (2.18, 0.5, 1.97), (0.05, 0.05, 0.05), ink_mat)
    parent_to(root, sign_board, sign_dot_left, sign_dot_right)

    root.location = (0.0, 0.0, 0.0)
    return root


def export_glb(glb_path):
    bpy.ops.export_scene.gltf(
        filepath=glb_path,
        export_format="GLB",
        use_selection=False,
        export_apply=True,
        export_yup=True,
    )


def main():
    blend_path, render_path, glb_path = parse_args()
    ensure_parent(blend_path)
    ensure_parent(render_path)
    ensure_parent(glb_path)

    reset_scene()
    setup_scene(render_path)
    build_themepark_asset()

    bpy.ops.object.select_all(action="DESELECT")
    bpy.ops.wm.save_as_mainfile(filepath=blend_path)
    bpy.ops.render.render(write_still=True)
    export_glb(glb_path)

    print(f"Saved blend to: {blend_path}")
    print(f"Saved render to: {render_path}")
    print(f"Saved glb to: {glb_path}")


if __name__ == "__main__":
    main()
