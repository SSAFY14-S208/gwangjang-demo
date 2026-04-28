import math
import os
import sys

import bpy
import bmesh
from mathutils import Vector


BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))


def parse_args():
    blend_path = os.path.join(BASE_DIR, "blender_output", "pastel_platform.blend")
    render_path = os.path.join(BASE_DIR, "blender_output", "pastel_platform_preview.png")

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


def make_material(name, color, roughness=1.0, specular=0.1):
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = color
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Specular IOR Level"].default_value = specular
    return mat


def make_flat_material(name, color):
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links

    nodes.clear()
    emission = nodes.new(type="ShaderNodeEmission")
    output = nodes.new(type="ShaderNodeOutputMaterial")
    emission.inputs["Color"].default_value = color
    emission.inputs["Strength"].default_value = 1.0
    links.new(emission.outputs["Emission"], output.inputs["Surface"])
    return mat


def create_lower_body(name):
    profile = [
        (6.1, 0.02),
        (5.95, -0.25),
        (5.4, -1.05),
        (4.35, -2.25),
        (2.85, -3.65),
        (1.2, -4.75),
        (0.08, -5.35),
    ]
    steps = 128
    verts = []
    faces = []

    for step in range(steps):
        angle = (2.0 * math.pi * step) / steps
        c = math.cos(angle)
        s = math.sin(angle)
        for radius, z in profile:
            verts.append((radius * c, radius * s, z))

    points = len(profile)
    for step in range(steps):
        next_step = (step + 1) % steps
        for idx in range(points - 1):
            a = step * points + idx
            b = next_step * points + idx
            c = next_step * points + idx + 1
            d = step * points + idx + 1
            faces.append([a, b, c, d])

    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts, [], faces)
    mesh.update()

    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.shade_smooth()
    return obj


def create_disc(name, radius, depth, location):
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=128,
        radius=radius,
        depth=depth,
        location=location,
    )
    obj = bpy.context.object
    obj.name = name
    bpy.ops.object.shade_smooth()
    return obj


def create_cube(name, size, location):
    bpy.ops.mesh.primitive_cube_add(size=size, location=location)
    obj = bpy.context.object
    obj.name = name
    return obj


def create_ring_sector(name, start_deg, end_deg, r_inner, r_outer, z_top, thickness, top_mat, side_mat):
    if end_deg <= start_deg:
        end_deg += 360.0

    steps = max(16, int((end_deg - start_deg) / 4.0))
    angles = [math.radians(start_deg + (end_deg - start_deg) * i / steps) for i in range(steps + 1)]
    z_bottom = z_top - thickness

    verts = []
    faces = []
    face_materials = []

    top_outer = []
    top_inner = []
    bottom_outer = []
    bottom_inner = []

    for ang in angles:
        c = math.cos(ang)
        s = math.sin(ang)
        top_outer.append(len(verts))
        verts.append((r_outer * c, r_outer * s, z_top))
        top_inner.append(len(verts))
        verts.append((r_inner * c, r_inner * s, z_top))
        bottom_outer.append(len(verts))
        verts.append((r_outer * c, r_outer * s, z_bottom))
        bottom_inner.append(len(verts))
        verts.append((r_inner * c, r_inner * s, z_bottom))

    for i in range(steps):
        faces.append([top_outer[i], top_outer[i + 1], top_inner[i + 1], top_inner[i]])
        face_materials.append(0)

        faces.append([bottom_outer[i], bottom_inner[i], bottom_inner[i + 1], bottom_outer[i + 1]])
        face_materials.append(1)

        faces.append([bottom_outer[i], bottom_outer[i + 1], top_outer[i + 1], top_outer[i]])
        face_materials.append(1)

        faces.append([top_inner[i], top_inner[i + 1], bottom_inner[i + 1], bottom_inner[i]])
        face_materials.append(1)

    faces.append([bottom_outer[0], top_outer[0], top_inner[0], bottom_inner[0]])
    face_materials.append(1)
    faces.append([bottom_outer[-1], bottom_inner[-1], top_inner[-1], top_outer[-1]])
    face_materials.append(1)

    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts, [], faces)
    mesh.update()

    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)

    obj.data.materials.append(top_mat)
    obj.data.materials.append(side_mat)

    for poly, material_index in zip(obj.data.polygons, face_materials):
        poly.material_index = material_index
        poly.use_smooth = material_index == 1

    return obj


def assign_cube_materials(cube, side_mat, top_mat):
    cube.data.materials.clear()
    cube.data.materials.append(side_mat)
    cube.data.materials.append(top_mat)

    for poly in cube.data.polygons:
        poly.material_index = 1 if poly.normal.z > 0.9 else 0


def assign_rotated_cube_materials(cube, left_mat, right_mat, top_mat):
    cube.data.materials.clear()
    cube.data.materials.append(left_mat)
    cube.data.materials.append(right_mat)
    cube.data.materials.append(top_mat)

    for poly in cube.data.polygons:
        if poly.normal.z > 0.9:
            poly.material_index = 2
        elif poly.normal.x < 0:
            poly.material_index = 0
        else:
            poly.material_index = 1


def look_at(obj, target):
    direction = target - obj.location
    quat = direction.to_track_quat("-Z", "Y")
    obj.rotation_euler = quat.to_euler()


def setup_scene(render_path):
    scene = bpy.context.scene
    scene.render.engine = "CYCLES"
    scene.render.image_settings.file_format = "PNG"
    scene.render.filepath = render_path
    scene.render.resolution_x = 1600
    scene.render.resolution_y = 1200
    scene.render.film_transparent = False

    if hasattr(scene, "cycles"):
        scene.cycles.samples = 96
        scene.cycles.use_denoising = True

    world = bpy.data.worlds.get("World")
    if world is None:
        world = bpy.data.worlds.new("World")
    scene.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes["Background"]
    bg.inputs["Color"].default_value = (1.0, 1.0, 1.0, 1.0)
    bg.inputs["Strength"].default_value = 1.0

    scene.view_settings.view_transform = "Standard"
    scene.view_settings.exposure = 0.0

    bpy.ops.object.camera_add(location=(0.0, -21.5, 6.5))
    camera = bpy.context.object
    camera.data.lens = 48
    look_at(camera, Vector((0.0, 0.2, -1.8)))
    scene.camera = camera


def main():
    blend_path, render_path = parse_args()
    ensure_parent(blend_path)
    ensure_parent(render_path)

    reset_scene()
    setup_scene(render_path)

    body_mat = make_flat_material("BodyGray", (0.84, 0.84, 0.84, 1.0))
    side_mat = make_flat_material("RingSideCream", (0.96, 0.94, 0.84, 1.0))
    disk_mat = make_flat_material("CenterDiskGray", (0.79, 0.79, 0.79, 1.0))
    cube_left_mat = make_flat_material("CubeLeft", (0.86, 0.86, 0.86, 1.0))
    cube_right_mat = make_flat_material("CubeRight", (0.97, 0.97, 0.97, 1.0))
    cube_top_mat = make_flat_material("CubeTopPink", (0.98, 0.90, 0.91, 1.0))

    cyan = make_flat_material("SectorCyan", (0.72, 0.95, 0.95, 1.0))
    lavender = make_flat_material("SectorLavender", (0.87, 0.85, 0.98, 1.0))
    green = make_flat_material("SectorGreen", (0.77, 0.98, 0.79, 1.0))
    yellow = make_flat_material("SectorYellow", (0.99, 0.97, 0.83, 1.0))

    lower_body = create_lower_body("LowerBody")
    lower_body.data.materials.append(body_mat)

    ring_specs = [
        ("BackLavender", 45, 135, lavender),
        ("LeftCyan", 135, 225, cyan),
        ("FrontYellow", 225, 315, yellow),
        ("RightGreen", 315, 405, green),
    ]

    for name, start, end, mat in ring_specs:
        create_ring_sector(
            name=name,
            start_deg=start,
            end_deg=end,
            r_inner=3.15,
            r_outer=6.1,
            z_top=0.42,
            thickness=0.35,
            top_mat=mat,
            side_mat=side_mat,
        )

    center_disk = create_disc("CenterDisk", radius=2.9, depth=0.14, location=(0.0, 0.0, 0.50))
    center_disk.data.materials.append(disk_mat)

    cube = create_cube("CenterCube", size=2.0, location=(0.0, 0.0, 1.57))
    cube.rotation_euler.z = math.radians(45.0)
    assign_rotated_cube_materials(cube, cube_left_mat, cube_right_mat, cube_top_mat)

    bpy.ops.object.select_all(action="DESELECT")
    bpy.ops.wm.save_as_mainfile(filepath=blend_path)
    bpy.ops.render.render(write_still=True)

    print(f"Saved blend to: {blend_path}")
    print(f"Saved render to: {render_path}")


if __name__ == "__main__":
    main()
