import sys
from pathlib import Path

import bpy


def main():
    if "--" not in sys.argv:
        raise SystemExit("Usage: blender --background file.blend --python export_witch_asset.py -- output.glb")

    output_path = Path(sys.argv[sys.argv.index("--") + 1])
    output_path.parent.mkdir(parents=True, exist_ok=True)

    bpy.ops.object.select_all(action="DESELECT")
    selected_count = 0

    for obj in bpy.context.scene.objects:
        name = obj.name.lower()
        is_reference = (
            obj.name.startswith("REF_")
            or "contact_sheet" in name
            or obj.name == "BASE_round_cream_plinth"
        )
        if obj.type in {"MESH", "EMPTY", "ARMATURE"} and not is_reference:
            obj.select_set(True)
            selected_count += 1

    if selected_count == 0:
        raise SystemExit("No exportable objects found.")

    bpy.ops.export_scene.gltf(
        filepath=str(output_path),
        export_format="GLB",
        use_selection=True,
        export_apply=True,
    )

    print(f"Exported {selected_count} objects to {output_path}")


if __name__ == "__main__":
    main()
