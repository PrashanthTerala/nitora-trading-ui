"""
The site's index of lesson videos, built from the packaged sets in out/publish/.

    python scripts/video_index.py --local

writes ../src/content/videos.local.json. It lists every packaged set, approved or not, with
its files under /media-local/, which the site's development server serves straight from
out/publish/. The file is gitignored and never reaches a public build. The public index,
src/content/videos.json, is written only by the upload tool, for sets that are approved and
uploaded.

Each language carries its scene start times, so the player can keep the reader's place when
they switch language. Languages run to different lengths, so the same second is a different
point in the lesson.
"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE = ROOT.parent
sys.path.insert(0, str(ROOT / "scripts"))
import package  # noqa: E402  (scene_starts and the cuts, so the times match the captions exactly)

ORDER = ["en", "te", "hi", "es"]


def narration_for(lesson: str) -> tuple[str, dict]:
    """The narration script (and its video name) that produced a lesson's set."""
    for path in sorted((ROOT / "narration").glob("*.json")):
        spec = json.loads(path.read_text(encoding="utf-8"))
        if spec.get("lesson") == lesson:
            return path.stem, spec
    raise SystemExit(f"no narration script for {lesson}")


def entry(set_dir: Path, base: str) -> tuple[str, dict]:
    manifest = json.loads((set_dir / "manifest.json").read_text(encoding="utf-8"))
    name, spec = narration_for(manifest["lesson"])
    bases = package.CUTS["cinematic"]["bases"].get(name, {})
    spec = {**spec, "scenes": {k: {**m, "base": bases.get(k, m["base"])} for k, m in spec["scenes"].items()}}
    tracks = []
    langs = manifest["languages"]
    for lang in sorted(langs, key=lambda l: ORDER.index(l) if l in ORDER else 99):
        info = langs[lang]
        timings = json.loads((ROOT / "narration" / name / lang / "timings.json").read_text(encoding="utf-8"))
        starts = package.scene_starts(spec, timings)
        tracks.append({
            "lang": lang,
            "video": info["video"],
            "captions": info["captions"]["vtt"],
            "duration": info["duration_s"],
            "scenes": [round(s, 2) for s in starts.values()],
            "credit": info["voice"]["credit"],
        })
    return manifest["lesson"], {"base": base, "poster": manifest["poster"], "tracks": tracks}


def main() -> None:
    if "--local" not in sys.argv:
        raise SystemExit("usage: python scripts/video_index.py --local   (the public index is written by the upload tool)")
    index = {}
    for manifest in sorted((ROOT / "out" / "publish").glob("*/*/v3/manifest.json")):
        set_dir = manifest.parent
        module, lesson = set_dir.parent.parent.name, set_dir.parent.name
        if not all((set_dir / json.loads(manifest.read_text(encoding="utf-8"))["languages"][l]["video"]).exists() for l in json.loads(manifest.read_text(encoding="utf-8"))["languages"]):
            continue  # a set still rendering
        key, value = entry(set_dir, f"/media-local/{module}/{lesson}/v3")
        index[key] = value
    out = SITE / "src" / "content" / "videos.local.json"
    out.write_text(json.dumps(index, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"{len(index)} lesson(s) -> {out.relative_to(SITE)}")
    for key, value in index.items():
        print(f"  {key}: {', '.join(t['lang'] for t in value['tracks'])}")


if __name__ == "__main__":
    main()
