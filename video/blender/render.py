"""
Renders a Nitora Blender scene to a PNG sequence, entirely from script: no hand-edited .blend
file, nothing random, so the same inputs always give the same frames.

    .blender/blender-5.2.2-windows-x64/blender.exe -b --factory-startup -P blender/render.py -- \
        --scene data_landscape --out public/blender/data-landscape/preview \
        [--res 960x540] [--frames 150] [--samples 8] [--transparent] [--engine eevee|cycles]

Inputs come from build/ (scripts/scene-data.mjs): brand.json, the site's dark-theme colours in
linear RGB, and the scene's data file, the same numbers the Remotion chart draws. Every frame's
render time goes to <out>/render-log.json, with the settings and Blender version, so a preview
gives a measured estimate for the final render.

Scenes are functions in SCENES. Each builds geometry, materials, lights and a camera move into
an empty scene and returns its frame count.
"""

import argparse
import json
import math
import sys
import time
from pathlib import Path

import bpy

VIDEO = Path(__file__).resolve().parent.parent


# ---------------------------------------------------------------- shared rig


def reset() -> bpy.types.Scene:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    return bpy.context.scene


def material(name: str, rgba, emission: float = 0.0, roughness: float = 0.5, metallic: float = 0.0, alpha: float = 1.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    bsdf = m.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = rgba
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Metallic"].default_value = metallic
    bsdf.inputs["Alpha"].default_value = alpha
    if emission:
        bsdf.inputs["Emission Color"].default_value = rgba
        bsdf.inputs["Emission Strength"].default_value = emission
    return m


def world(scene, rgba, strength: float = 1.0):
    w = bpy.data.worlds.new("Nitora")
    w.use_nodes = True
    bg = w.node_tree.nodes["Background"]
    bg.inputs["Color"].default_value = rgba
    bg.inputs["Strength"].default_value = strength
    scene.world = w


def area_light(name: str, location, rotation, energy: float, size: float, rgb=(1, 1, 1)):
    data = bpy.data.lights.new(name, "AREA")
    data.energy, data.size, data.color = energy, size, rgb
    obj = bpy.data.objects.new(name, data)
    obj.location, obj.rotation_euler = location, rotation
    bpy.context.collection.objects.link(obj)
    return obj


def ease_keys(obj, path: str, keys: list[tuple[int, tuple]]):
    """Keyframes with smooth (bezier, auto-clamped) easing: the house camera move."""
    for frame, value in keys:
        setattr(obj, path, value)
        obj.keyframe_insert(path, frame=frame)
    for fc in obj.animation_data.action.fcurves if hasattr(obj.animation_data.action, "fcurves") else []:
        for kp in fc.keyframe_points:
            kp.interpolation = "BEZIER"


def polyline(name: str, points: list[tuple[float, float, float]], radius: float, mat):
    curve = bpy.data.curves.new(name, "CURVE")
    curve.dimensions = "3D"
    curve.bevel_depth = radius
    curve.bevel_resolution = 3
    spline = curve.splines.new("POLY")
    spline.points.add(len(points) - 1)
    for p, (x, y, z) in zip(spline.points, points):
        p.co = (x, y, z, 1)
    obj = bpy.data.objects.new(name, curve)
    obj.data.materials.append(mat)
    bpy.context.collection.objects.link(obj)
    return obj


# ---------------------------------------------------------------- scenes


def data_landscape(scene, brand: dict, frames: int) -> int:
    """
    FinancialDataLandscape: the pilot's synthetic price series as a field of columns on a dark,
    softly reflective floor, its 50- and 200-day SMAs as glowing lines above it, and a camera
    that travels low along the series and settles on the golden cross, the shot the 2D chart
    then takes over from. Same data, same colours as the Remotion chart.
    """
    data = json.loads((VIDEO / "build" / "ma-crossovers.json").read_text(encoding="utf-8"))
    closes, sma50, sma200 = data["closes"], data["sma50"], data["sma200"]
    c = {k: tuple(v["linear"]) for k, v in brand.items()}

    world(scene, c["bg"], 1.0)
    dx, base = 0.05, 75.0
    zf = lambda price: (price - base) * 0.09  # price to height

    # Floor: the page colour, a little gloss for restrained reflections.
    bpy.ops.mesh.primitive_plane_add(size=80, location=(len(closes) * dx / 2, 0, 0))
    bpy.context.object.data.materials.append(material("floor", c["surface-1"], roughness=0.32, metallic=0.2))

    # Columns: one mesh, one box per bar, coloured by direction against the previous close.
    import bmesh

    mesh = bpy.data.meshes.new("columns")
    bm = bmesh.new()
    w, depth = dx * 0.62, 0.35
    for i, close in enumerate(closes):
        x = i * dx
        h = max(zf(close), 0.01)
        geom = bmesh.ops.create_cube(bm, size=1.0)
        verts = geom["verts"]
        bmesh.ops.scale(bm, vec=(w, depth, h), verts=verts)
        bmesh.ops.translate(bm, vec=(x, 0, h / 2), verts=verts)
        up = i == 0 or close >= closes[i - 1]
        for f in {f for v in verts for f in v.link_faces}:
            f.material_index = 0 if up else 1
    bm.to_mesh(mesh)
    bm.free()
    cols = bpy.data.objects.new("columns", mesh)
    # Muted: mostly slate with a hint of direction, so the averages carry the colour.
    mix = lambda a, b, t: tuple(a[k] * (1 - t) + b[k] * t for k in range(3)) + (1.0,)
    mesh.materials.append(material("up", mix(c["ink-muted"], c["up"], 0.35), roughness=0.55, metallic=0.1))
    mesh.materials.append(material("down", mix(c["ink-muted"], c["down"], 0.35), roughness=0.55, metallic=0.1))
    bpy.context.collection.objects.link(cols)

    # The averages, floating just in front of the columns, glowing in the 2D chart's colours.
    def line(values, name, rgba, radius):
        pts = [(i * dx, -0.3, zf(v)) for i, v in enumerate(values) if v is not None]
        return polyline(name, pts, radius, material(name, rgba, emission=1.2, roughness=0.3))

    line(sma50, "sma50", c["chart-2"], 0.035)
    line(sma200, "sma200", c["chart-1"], 0.035)

    # The golden cross: a ring standing where the 50 crosses the 200.
    g = data["golden"]
    bpy.ops.mesh.primitive_torus_add(major_radius=0.32, minor_radius=0.03, location=(g * dx, -0.3, zf(sma50[g])), rotation=(math.pi / 2, 0, 0))
    bpy.context.object.data.materials.append(material("cross", c["up"], emission=1.5))

    # Light: a broad soft key from front-left, a cool rim from behind; low and restrained.
    area_light("key", (6, -9, 9), (math.radians(55), 0, math.radians(-25)), 1800, 10)
    area_light("rim", (14, 8, 6), (math.radians(-60), 0, math.radians(160)), 900, 12, c["accent"][:3])

    # Camera: from low at the start of the series, travelling and rising to frame the cross.
    cam_data = bpy.data.cameras.new("cam")
    cam_data.lens = 35
    cam_data.dof.use_dof = True
    cam_data.dof.aperture_fstop = 2.8
    cam = bpy.data.objects.new("cam", cam_data)
    bpy.context.collection.objects.link(cam)
    scene.camera = cam
    target = bpy.data.objects.new("target", None)
    bpy.context.collection.objects.link(target)
    con = cam.constraints.new("TRACK_TO")
    con.target, con.track_axis, con.up_axis = target, "TRACK_NEGATIVE_Z", "UP_Y"
    cam_data.dof.focus_object = target

    gx, gz = g * dx, zf(sma50[g])
    ease_keys(cam, "location", [(1, (-1.5, -4.5, 1.2)), (frames, (gx - 2.2, -6.2, gz + 1.6))])
    ease_keys(target, "location", [(1, (2.0, 0, 1.0)), (frames, (gx + 0.4, -0.3, gz))])
    return frames


SCENES = {"data_landscape": data_landscape}


# ---------------------------------------------------------------- render


def main(argv: list[str]) -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--scene", required=True, choices=SCENES)
    ap.add_argument("--out", required=True)
    ap.add_argument("--res", default="960x540")
    ap.add_argument("--frames", type=int, default=150)
    ap.add_argument("--fps", type=int, default=30)
    ap.add_argument("--samples", type=int, default=8)
    ap.add_argument("--engine", choices=["eevee", "cycles"], default="eevee")
    ap.add_argument("--transparent", action="store_true")
    ap.add_argument("--only", type=int, help="render just this frame (a still for review)")
    a = ap.parse_args(argv)

    out = (VIDEO / a.out).resolve()
    out.mkdir(parents=True, exist_ok=True)
    brand = json.loads((VIDEO / "build" / "brand.json").read_text(encoding="utf-8"))

    scene = reset()
    frames = SCENES[a.scene](scene, brand, a.frames)

    r = scene.render
    r.resolution_x, r.resolution_y = map(int, a.res.split("x"))
    r.resolution_percentage = 100
    r.fps = a.fps
    scene.frame_start, scene.frame_end = 1, frames
    r.film_transparent = a.transparent
    r.image_settings.file_format = "PNG"
    r.image_settings.color_mode = "RGBA" if a.transparent else "RGB"
    r.image_settings.compression = 30
    # 'Standard' keeps the brand colours as specified; AgX and Filmic would shift them.
    scene.view_settings.view_transform = "Standard"
    scene.view_settings.look = "None"
    if a.engine == "eevee":
        r.engine = "BLENDER_EEVEE"
        scene.eevee.taa_render_samples = a.samples
    else:
        r.engine = "CYCLES"
        scene.cycles.device = "CPU"
        scene.cycles.samples = a.samples
        scene.cycles.use_denoising = True
    r.filepath = str(out / "")

    log = {"scene": a.scene, "engine": r.engine, "res": a.res, "samples": a.samples, "fps": a.fps, "frames": frames, "transparent": a.transparent, "blender": bpy.app.version_string, "frame_seconds": []}
    todo = [a.only] if a.only else range(1, frames + 1)
    started = time.perf_counter()
    for f in todo:
        t = time.perf_counter()
        scene.frame_set(f)
        r.filepath = str(out / f"{f:04d}.png")
        bpy.ops.render.render(write_still=True)
        log["frame_seconds"].append(round(time.perf_counter() - t, 3))
        print(f"frame {f}/{frames} {log['frame_seconds'][-1]:.2f}s", flush=True)
    log["total_seconds"] = round(time.perf_counter() - started, 1)
    (out / "render-log.json").write_text(json.dumps(log, indent=1), encoding="utf-8")
    print(f"done: {len(todo)} frame(s) in {log['total_seconds']}s -> {out}", flush=True)


if __name__ == "__main__":
    main(sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else [])
