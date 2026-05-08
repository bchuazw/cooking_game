import math
from pathlib import Path

import bpy


ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "public" / "models"
OUT_DIR.mkdir(parents=True, exist_ok=True)
OUT_FILE = OUT_DIR / "hainanese_chicken_cut.glb"


def clear_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()


def mat(name, color):
    material = bpy.data.materials.new(name)
    material.use_nodes = True
    bsdf = material.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = color
        bsdf.inputs["Roughness"].default_value = 0.82
    return material


def low_poly(obj):
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.shade_flat()
    obj.select_set(False)
    return obj


def ellipsoid(name, material, loc, scale, rot=(0, 0, 0), segments=12, rings=6):
    bpy.ops.mesh.primitive_uv_sphere_add(
        segments=segments,
        ring_count=rings,
        radius=1,
        location=loc,
        rotation=rot,
    )
    obj = bpy.context.object
    obj.name = name
    obj.data.name = f"{name}_mesh"
    obj.scale = scale
    obj.data.materials.append(material)
    return low_poly(obj)


def box(name, material, loc, scale, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc, rotation=rot)
    obj = bpy.context.object
    obj.name = name
    obj.data.name = f"{name}_mesh"
    obj.scale = scale
    obj.data.materials.append(material)
    return low_poly(obj)


def cylinder(name, material, loc, radius, depth, rot=(0, 0, 0), vertices=8):
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=vertices,
        radius=radius,
        depth=depth,
        location=loc,
        rotation=rot,
    )
    obj = bpy.context.object
    obj.name = name
    obj.data.name = f"{name}_mesh"
    obj.data.materials.append(material)
    return low_poly(obj)


def chicken_body_mesh(name, material):
    bottom_z = 0.58
    top_z = 0.98
    crest_z = 1.12
    points = [
        (-0.22, -1.08),
        (-0.52, -0.98),
        (-0.72, -0.72),
        (-0.68, -0.42),
        (-0.48, -0.16),
        (-0.18, 0.04),
        (0.0, 0.12),
        (0.18, 0.04),
        (0.48, -0.16),
        (0.68, -0.42),
        (0.72, -0.72),
        (0.52, -0.98),
        (0.22, -1.08),
        (0.0, -1.14),
    ]
    verts = [(x, y, bottom_z) for x, y in points]
    verts += [(x * 0.86, y * 0.9, top_z + (0.08 if -0.7 < y < -0.15 else 0)) for x, y in points]
    verts.append((0, -0.5, crest_z))
    center = len(verts) - 1
    n = len(points)
    faces = []
    for i in range(n):
        faces.append((i, (i + 1) % n, n + (i + 1) % n, n + i))
        faces.append((n + i, n + (i + 1) % n, center))
    faces.append(tuple(reversed(range(n))))
    mesh = bpy.data.meshes.new(f"{name}_mesh")
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    obj.data.materials.append(material)
    return low_poly(obj)


def add_chicken():
    skin = mat("poached_chicken_skin", (0.88, 0.67, 0.42, 1))
    skin_light = mat("poached_chicken_light", (0.98, 0.83, 0.58, 1))
    skin_dark = mat("poached_chicken_brown", (0.63, 0.42, 0.25, 1))
    meat = mat("pale_chicken_meat", (1.0, 0.9, 0.68, 1))
    bone = mat("chicken_bone", (1.0, 0.95, 0.82, 1))

    # Blender is Z-up; glTF exports to Three's Y-up. Blender Y becomes scene depth.
    chicken_body_mesh("body_main", skin)
    ellipsoid("body_breast_left", skin_light, (-0.22, -0.52, 1.02), (0.18, 0.14, 0.06), (0.1, -0.08, -0.06), 10, 5)
    ellipsoid("body_breast_right", skin_light, (0.22, -0.54, 1.02), (0.18, 0.14, 0.06), (0.1, 0.08, 0.06), 10, 5)
    ellipsoid("body_neck_cap", meat, (0, 0.03, 1.05), (0.18, 0.13, 0.09), (-0.1, 0, 0), 8, 4)
    box("body_skin_line", skin_dark, (0, 0.15, 1.08), (0.5, 0.035, 0.03), (0.02, 0, 0))
    box("body_center_highlight", meat, (0, -0.7, 1.1), (0.2, 0.045, 0.025), (0.02, 0, 0))
    box("body_left_shadow", skin_dark, (-0.48, -0.48, 0.82), (0.06, 0.34, 0.035), (0.02, 0.1, 0.18))
    box("body_right_shadow", skin_dark, (0.48, -0.48, 0.82), (0.06, 0.34, 0.035), (0.02, -0.1, -0.18))

    # Wings stay tucked close to the body so the silhouette reads as poultry, not a crab.
    ellipsoid("left_wing_upper", skin_dark, (-0.64, -0.58, 0.74), (0.18, 0.3, 0.1), (0.1, -0.44, -0.18), 10, 5)
    ellipsoid("left_wing_tip", skin, (-0.77, -0.76, 0.72), (0.1, 0.17, 0.07), (0.02, -0.5, -0.2), 8, 4)
    box("left_wing_skin_edge", skin_light, (-0.66, -0.42, 0.86), (0.1, 0.03, 0.025), (0, -0.14, 0))

    ellipsoid("right_wing_upper", skin_dark, (0.64, -0.58, 0.74), (0.18, 0.3, 0.1), (0.1, 0.44, 0.18), 10, 5)
    ellipsoid("right_wing_tip", skin, (0.77, -0.76, 0.72), (0.1, 0.17, 0.07), (0.02, 0.5, 0.2), 8, 4)
    box("right_wing_skin_edge", skin_light, (0.66, -0.42, 0.86), (0.1, 0.03, 0.025), (0, 0.14, 0))

    # Raised drumsticks follow the reference silhouette with visible white bone ends.
    ellipsoid("left_drumlet_meat", skin, (-0.34, -0.16, 1.22), (0.18, 0.18, 0.4), (0.02, 0.12, -0.06), 10, 5)
    cylinder("left_drumlet_bone", bone, (-0.42, -0.18, 1.62), 0.06, 0.36, (0, 0.08, -0.06), 8)
    ellipsoid("left_drumlet_bone_knob", bone, (-0.47, -0.2, 1.84), (0.13, 0.13, 0.11), (0, 0.12, 0), 8, 4)

    ellipsoid("right_drumlet_meat", skin, (0.34, -0.16, 1.22), (0.18, 0.18, 0.4), (0.02, -0.12, 0.06), 10, 5)
    cylinder("right_drumlet_bone", bone, (0.42, -0.18, 1.62), 0.06, 0.36, (0, -0.08, 0.06), 8)
    ellipsoid("right_drumlet_bone_knob", bone, (0.47, -0.2, 1.84), (0.13, 0.13, 0.11), (0, -0.12, 0), 8, 4)

    # Small tail nub reinforces bird orientation without adding clutter.
    ellipsoid("body_tail_nub", skin_dark, (0, 0.64, 0.82), (0.16, 0.12, 0.08), (0.05, 0, 0), 8, 4)


def main():
    clear_scene()
    add_chicken()
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.export_scene.gltf(
        filepath=str(OUT_FILE),
        export_format="GLB",
        use_selection=True,
        export_yup=True,
        export_apply=True,
    )
    print(f"exported {OUT_FILE}")


if __name__ == "__main__":
    main()
