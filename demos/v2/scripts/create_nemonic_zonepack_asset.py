import math
import os
import sys

import bpy
from mathutils import Vector


BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))


def parse_args():
    blend_path = os.path.join(BASE_DIR, "blender_output", "nemonic_zonepack_asset.blend")
    render_path = os.path.join(BASE_DIR, "blender_output", "nemonic_zonepack_asset_preview.png")
    glb_path = os.path.join(BASE_DIR, "public", "models", "nemonic_zonepack_asset.glb")

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


def make_principled_material(name, color, roughness=0.5, metallic=0.0, emission=None, emission_strength=0.0, transmission=0.0):
    material = bpy.data.materials.new(name=name)
    material.use_nodes = True
    bsdf = material.node_tree.nodes["Principled BSDF"]
    set_node_input(bsdf, ["Base Color"], color)
    set_node_input(bsdf, ["Roughness"], roughness)
    set_node_input(bsdf, ["Metallic"], metallic)
    set_node_input(bsdf, ["Transmission Weight", "Transmission"], transmission)
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
        segments=40,
        ring_count=20,
    )
    obj.scale = scale
    return obj


def create_cylinder(name, location, radius, depth, material, rotation=(0.0, 0.0, 0.0), vertices=40):
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


def create_cone(name, location, radius_bottom, radius_top, depth, material, rotation=(0.0, 0.0, 0.0), vertices=40):
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


def create_cube(name, location, scale, material, rotation=(0.0, 0.0, 0.0)):
    obj = create_mesh_primitive(
        bpy.ops.mesh.primitive_cube_add,
        name=name,
        material=material,
        location=location,
        rotation=rotation,
        bevel=0.025,
    )
    obj.scale = scale
    return obj


def create_torus(name, location, major_radius, minor_radius, material, rotation=(0.0, 0.0, 0.0), major_segments=60):
    return create_mesh_primitive(
        bpy.ops.mesh.primitive_torus_add,
        name=name,
        material=material,
        location=location,
        major_radius=major_radius,
        minor_radius=minor_radius,
        rotation=rotation,
        major_segments=major_segments,
        minor_segments=20,
    )


def create_disc(name, location, radius, material, thickness=0.12):
    return create_cylinder(name, location, radius, thickness, material)


def parent_to(root, *objects):
    for obj in objects:
        if obj is not None:
            obj.parent = root


def look_at(obj, target):
    direction = target - obj.location
    obj.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()


def create_cloud_group(name, location, scale, material):
    root = bpy.data.objects.new(name, None)
    bpy.context.collection.objects.link(root)
    root.location = location
    puff_specs = [
        (-0.42, 0.0, 0.02, 0.42),
        (-0.12, 0.12, 0.08, 0.56),
        (0.22, 0.14, 0.02, 0.5),
        (0.54, 0.02, 0.0, 0.36),
        (0.06, -0.05, -0.02, 0.46),
    ]
    for index, (x, y, z, radius) in enumerate(puff_specs):
        puff = create_sphere(
            name=f"{name}_Puff_{index}",
            location=(location[0] + x * scale, location[1] + y * scale, location[2] + z * scale),
            scale=(radius * scale, radius * scale * 0.9, radius * scale * 0.8),
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
        scale=(0.2 * scale, 0.2 * scale, 0.26 * scale),
        material=color_material,
    )
    balloon.parent = root

    knot = create_cone(
        name=f"{name}_Knot",
        location=(location[0], location[1], location[2] - 0.24 * scale),
        radius_bottom=0.026 * scale,
        radius_top=0.0,
        depth=0.05 * scale,
        material=color_material,
        rotation=(math.pi, 0.0, 0.0),
        vertices=12,
    )
    knot.parent = root

    string = create_cylinder(
        name=f"{name}_String",
        location=(location[0], location[1], location[2] - 0.56 * scale),
        radius=0.004 * scale,
        depth=0.62 * scale,
        material=string_material,
        vertices=8,
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
    background.inputs["Color"].default_value = (0.985, 0.9, 0.95, 1.0)
    background.inputs["Strength"].default_value = 0.72

    scene.view_settings.view_transform = "Standard"
    scene.view_settings.exposure = -0.92

    bpy.ops.object.camera_add(location=(0.0, -15.4, 6.2))
    camera = bpy.context.object
    camera.data.lens = 50
    look_at(camera, Vector((0.0, 0.0, 1.6)))
    scene.camera = camera

    bpy.ops.object.light_add(type="AREA", location=(-8.0, -6.5, 8.6))
    key = bpy.context.object
    key.data.energy = 1180
    key.data.shape = "RECTANGLE"
    key.data.size = 8.0
    key.data.size_y = 6.0
    look_at(key, Vector((0.0, 0.0, 1.5)))

    bpy.ops.object.light_add(type="AREA", location=(7.5, -4.2, 6.5))
    fill = bpy.context.object
    fill.data.energy = 460
    fill.data.shape = "RECTANGLE"
    fill.data.size = 5.5
    fill.data.size_y = 4.2
    look_at(fill, Vector((0.0, 0.0, 1.4)))

    bpy.ops.object.light_add(type="AREA", location=(0.0, 1.0, 6.6))
    rim = bpy.context.object
    rim.data.energy = 180
    rim.data.shape = "RECTANGLE"
    rim.data.size = 4.0
    rim.data.size_y = 3.0
    look_at(rim, Vector((0.0, 0.0, 1.8)))


def build_zonepack_asset():
    root = bpy.data.objects.new("NemonicZonePack", None)
    bpy.context.collection.objects.link(root)

    base_white = make_principled_material("BaseWhite", (0.97, 0.985, 1.0, 1.0), roughness=0.58)
    pearl = make_principled_material("Pearl", (0.92, 0.97, 1.0, 1.0), roughness=0.54)
    cloud = make_principled_material("Cloud", (1.0, 0.985, 1.0, 1.0), roughness=0.72)
    yellow = make_principled_material("Yellow", (1.0, 0.88, 0.42, 1.0), roughness=0.34, emission=(1.0, 0.88, 0.42, 1.0), emission_strength=0.06)
    mint = make_principled_material("Mint", (0.48, 0.95, 0.82, 1.0), roughness=0.34)
    aqua = make_principled_material("Aqua", (0.3, 0.84, 1.0, 1.0), roughness=0.34)
    blue = make_principled_material("Blue", (0.24, 0.62, 1.0, 1.0), roughness=0.34)
    pink = make_principled_material("Pink", (1.0, 0.58, 0.8, 1.0), roughness=0.34)
    peach = make_principled_material("Peach", (1.0, 0.78, 0.58, 1.0), roughness=0.38)
    violet = make_principled_material("Violet", (0.72, 0.57, 1.0, 1.0), roughness=0.34)
    coral = make_principled_material("Coral", (1.0, 0.58, 0.43, 1.0), roughness=0.34)
    glass = make_principled_material("Glass", (0.88, 0.98, 1.0, 1.0), roughness=0.08, transmission=0.55)
    ink = make_principled_material("Ink", (0.26, 0.2, 0.31, 1.0), roughness=0.44)
    string = make_principled_material("String", (0.99, 0.98, 1.0, 1.0), roughness=1.0)

    base_floor = create_disc("ZonePackFloor", (0.0, 0.0, 0.0), 4.8, base_white, thickness=0.18)
    base_floor.scale = (1.25, 0.96, 0.55)
    parent_to(root, base_floor)

    community_root = bpy.data.objects.new("CommunityZoneRoot", None)
    relay_root = bpy.data.objects.new("RelayZoneRoot", None)
    fortune_root = bpy.data.objects.new("FortuneZoneRoot", None)
    bpy.context.collection.objects.link(community_root)
    bpy.context.collection.objects.link(relay_root)
    bpy.context.collection.objects.link(fortune_root)
    community_root.parent = root
    relay_root.parent = root
    fortune_root.parent = root
    community_root.location = (-2.85, 0.05, 0.2)
    relay_root.location = (2.85, 0.05, 0.18)
    fortune_root.location = (0.0, -1.2, -1.65)

    community_base = create_disc("CommunityBase", community_root.location, 1.28, pearl, thickness=0.14)
    community_mid = create_disc("CommunityMid", (community_root.location.x, community_root.location.y, community_root.location.z + 0.12), 1.1, base_white, thickness=0.12)
    community_cloud = create_cloud_group("CommunityCloudFloat", (-2.55, -0.28, 1.7), 0.38, cloud)
    parent_to(community_root, community_base, community_mid)
    community_cloud.parent = community_root

    note_mats = [pink, yellow, mint, aqua, peach, violet]
    for row in range(10):
        for col in range(6):
            note = create_cube(
                name=f"CommunityNote_{row}_{col}",
                location=(
                    community_root.location.x + 0.08 + (row % 2) * 0.02,
                    community_root.location.y + (col - 2.5) * 0.26,
                    community_root.location.z + 0.24 + row * 0.18,
                ),
                scale=(0.06, 0.12, 0.16),
                material=note_mats[(row + col) % len(note_mats)],
                rotation=(0.0, math.radians(8.0), math.radians((col - 2) * 4.0)),
            )
            note.parent = community_root

    for index, offset in enumerate([(-0.26, -0.55, 0.42), (-0.24, 0.5, 0.98)]):
        ladder_left = create_cylinder(
            name=f"CommunityLadderRailA_{index}",
            location=(community_root.location.x + offset[0], community_root.location.y + offset[1], community_root.location.z + offset[2] + 0.32),
            radius=0.01,
            depth=0.74,
            material=yellow,
        )
        ladder_right = create_cylinder(
            name=f"CommunityLadderRailB_{index}",
            location=(community_root.location.x + offset[0] + 0.09, community_root.location.y + offset[1], community_root.location.z + offset[2] + 0.32),
            radius=0.01,
            depth=0.74,
            material=yellow,
        )
        ladder_left.rotation_euler = (0.0, math.radians(90.0), math.radians(8.0 if index == 0 else -6.0))
        ladder_right.rotation_euler = ladder_left.rotation_euler
        ladder_left.parent = community_root
        ladder_right.parent = community_root
        for rung in range(4):
            rung_obj = create_cube(
                name=f"CommunityLadderRung_{index}_{rung}",
                location=(community_root.location.x + offset[0] + 0.045, community_root.location.y + offset[1], community_root.location.z + offset[2] + 0.1 + rung * 0.16),
                scale=(0.06, 0.008, 0.012),
                material=mint if rung % 2 == 0 else aqua,
                rotation=ladder_left.rotation_euler,
            )
            rung_obj.parent = community_root

    balloon_a = create_balloon("CommunityBalloon_A", (-3.2, -0.34, 2.42), yellow, string, scale=0.92)
    balloon_b = create_balloon("CommunityBalloon_B", (-2.46, 0.62, 2.1), pink, string, scale=0.8)
    balloon_a.parent = community_root
    balloon_b.parent = community_root

    relay_base = create_disc("RelayBase", relay_root.location, 1.38, pearl, thickness=0.14)
    relay_mid = create_disc("RelayMid", (relay_root.location.x, relay_root.location.y, relay_root.location.z + 0.12), 1.2, base_white, thickness=0.12)
    parent_to(relay_root, relay_base, relay_mid)

    relay_track = create_torus("RelayTrack", (relay_root.location.x + 0.08, relay_root.location.y, relay_root.location.z + 1.05), 1.02, 0.08, yellow, rotation=(math.radians(90.0), 0.0, 0.0))
    relay_track.scale = (1.0, 0.8, 0.72)
    relay_track.parent = relay_root

    for index, angle_deg in enumerate([18.0, 124.0, 240.0]):
        angle = math.radians(angle_deg)
        pod = create_cube(
            name=f"RelayPod_{index}",
            location=(
                relay_root.location.x + math.cos(angle) * 0.86,
                relay_root.location.y + math.sin(angle) * 0.56,
                relay_root.location.z + 1.04 + math.sin(angle * 1.2) * 0.08,
            ),
            scale=(0.24, 0.18, 0.18),
            material=glass,
            rotation=(0.0, 0.0, angle),
        )
        pod.parent = relay_root
        for strip in range(3):
            memo_strip = create_cube(
                name=f"RelayStrip_{index}_{strip}",
                location=(pod.location.x, pod.location.y, pod.location.z + 0.03 - strip * 0.06),
                scale=(0.09, 0.012, 0.02),
                material=[pink, yellow, aqua][strip],
                rotation=pod.rotation_euler,
            )
            memo_strip.parent = relay_root

    funnel = create_cone("RelayFunnel", (relay_root.location.x - 0.72, relay_root.location.y + 0.05, relay_root.location.z + 0.74), 0.34, 0.06, 0.72, yellow)
    press = create_cube("RelayPress", (relay_root.location.x - 0.72, relay_root.location.y + 0.05, relay_root.location.z + 1.22), (0.28, 0.28, 0.08), coral)
    memo_face = create_cube("RelayMemoFace", (relay_root.location.x - 0.72, relay_root.location.y + 0.05, relay_root.location.z + 1.46), (0.34, 0.22, 0.03), yellow)
    eye_a = create_sphere("RelayEyeA", (relay_root.location.x - 0.81, relay_root.location.y + 0.06, relay_root.location.z + 1.5), (0.04, 0.04, 0.04), ink)
    eye_b = create_sphere("RelayEyeB", (relay_root.location.x - 0.62, relay_root.location.y + 0.06, relay_root.location.z + 1.5), (0.04, 0.04, 0.04), ink)
    mouth = create_torus("RelayMouth", (relay_root.location.x - 0.72, relay_root.location.y + 0.06, relay_root.location.z + 1.42), 0.08, 0.012, ink, rotation=(math.radians(90.0), 0.0, math.pi))
    parent_to(relay_root, funnel, press, memo_face, eye_a, eye_b, mouth)

    relay_cloud = create_cloud_group("RelayCloudFloat", (2.5, 0.22, 1.82), 0.34, cloud)
    relay_cloud.parent = relay_root
    relay_balloon = create_balloon("RelayBalloon_A", (3.18, 0.68, 2.3), aqua, string, scale=0.88)
    relay_balloon.parent = relay_root

    fortune_base = create_disc("FortuneBase", fortune_root.location, 1.4, pearl, thickness=0.14)
    fortune_mid = create_disc("FortuneMid", (fortune_root.location.x, fortune_root.location.y, fortune_root.location.z + 0.12), 1.12, base_white, thickness=0.12)
    parent_to(fortune_root, fortune_base, fortune_mid)

    for x in (-0.62, 0.62):
        pillar = create_cylinder(
            name=f"FortunePillar_{'L' if x < 0 else 'R'}",
            location=(fortune_root.location.x + x, fortune_root.location.y, fortune_root.location.z + 0.92),
            radius=0.12,
            depth=1.42,
            material=base_white,
        )
        pillar.parent = fortune_root

    arch = create_torus("FortuneArch", (fortune_root.location.x, fortune_root.location.y, fortune_root.location.z + 1.62), 0.92, 0.08, pink, rotation=(math.radians(90.0), 0.0, 0.0), major_segments=48)
    arch.scale = (1.0, 0.62, 0.78)
    arch.parent = fortune_root

    machine_base = create_cylinder("FortuneMachineBase", (fortune_root.location.x, fortune_root.location.y, fortune_root.location.z + 0.54), 0.62, 0.56, pink)
    machine_rim = create_cylinder("FortuneMachineRim", (fortune_root.location.x, fortune_root.location.y, fortune_root.location.z + 0.86), 0.68, 0.08, yellow)
    globe = create_sphere("FortuneGlobe", (fortune_root.location.x, fortune_root.location.y, fortune_root.location.z + 1.36), (0.6, 0.6, 0.6), glass)
    cap = create_cylinder("FortuneCap", (fortune_root.location.x, fortune_root.location.y, fortune_root.location.z + 2.02), 0.24, 0.22, yellow)
    memo = create_cube("FortuneMemo", (fortune_root.location.x, fortune_root.location.y + 0.82, fortune_root.location.z + 0.4), (0.36, 0.18, 0.04), yellow)
    lever_rod = create_cylinder("FortuneLeverRod", (fortune_root.location.x + 0.8, fortune_root.location.y, fortune_root.location.z + 0.64), 0.04, 0.72, yellow, rotation=(0.0, 0.0, math.radians(-34.0)), vertices=16)
    lever_ball = create_sphere("FortuneLeverBall", (fortune_root.location.x + 1.0, fortune_root.location.y + 0.12, fortune_root.location.z + 0.95), (0.12, 0.12, 0.12), pink)
    parent_to(fortune_root, machine_base, machine_rim, globe, cap, memo, lever_rod, lever_ball)

    orb_mats = [pink, mint, yellow, aqua, violet, coral]
    for index, angle_deg in enumerate(range(0, 360, 45)):
        angle = math.radians(angle_deg)
        orb = create_sphere(
            name=f"FortuneOrb_{index}",
            location=(
                fortune_root.location.x + math.cos(angle) * 0.28,
                fortune_root.location.y + math.sin(angle) * 0.22,
                fortune_root.location.z + 1.34 + math.sin(angle * 1.7) * 0.12,
            ),
            scale=(0.1, 0.1, 0.1),
            material=orb_mats[index % len(orb_mats)],
        )
        orb.parent = fortune_root

    sparkle_cloud = create_cloud_group("FortuneCloudFloat", (0.0, -1.2, 1.8), 0.42, cloud)
    sparkle_cloud.parent = fortune_root
    balloon_left = create_balloon("FortuneBalloon_A", (-0.96, -1.5, 2.36), white_material := cloud, string, scale=0.8)
    balloon_right = create_balloon("FortuneBalloon_B", (0.96, -0.92, 2.18), yellow, string, scale=0.72)
    balloon_left.parent = fortune_root
    balloon_right.parent = fortune_root

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
    build_zonepack_asset()

    bpy.ops.object.select_all(action="DESELECT")
    bpy.ops.wm.save_as_mainfile(filepath=blend_path)
    bpy.ops.render.render(write_still=True)
    export_glb(glb_path)

    print(f"Saved blend to: {blend_path}")
    print(f"Saved render to: {render_path}")
    print(f"Saved glb to: {glb_path}")


if __name__ == "__main__":
    main()
