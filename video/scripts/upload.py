"""
Publishes approved lesson videos to the media bucket, and writes the site's video index.

    python scripts/upload.py approve en [lesson ...]   record the owner's approval of these files
    python scripts/upload.py                           dry run: what would be uploaded, nothing sent
    python scripts/upload.py --apply                   upload, verify, and write src/content/videos.json

Only approved files go up. An approval (video/publish-approvals.json, committed) names a lesson,
a language, the date, and the SHA-256 of the exact MP4 and captions approved. A re-render
changes the hashes, so it needs a fresh approval before it can be published.

Files are named by their content (`12-three-inside-outside.en.3f2a1b9c.mp4`) under
`<module>/<lesson>/` in the bucket, served at https://media.nitoratrading.com/, with a year-long
immutable cache. A URL never changes what it serves, so no cache can ever be stale.

Uploads run through Wrangler, signed in as the owner (`wrangler r2 object put --remote`); this
script handles no keys. Each file is then checked through the public domain: status, size,
the ETag against the file's MD5, and a byte-range request answered with 206.

Only the files the player needs are published: the MP4, its WebVTT captions, and the poster.
"""
import datetime as dt
import hashlib
import json
import shutil
import subprocess
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE = ROOT.parent
sys.path.insert(0, str(ROOT / "scripts"))
import video_index  # noqa: E402  (scene starts, exactly as the captions are timed)

BUCKET = "nitora-trading-media"
MEDIA = "https://media.nitoratrading.com"
APPROVALS = ROOT / "publish-approvals.json"
INDEX = SITE / "src" / "content" / "videos.json"
TYPES = {".mp4": "video/mp4", ".vtt": "text/vtt; charset=utf-8", ".jpg": "image/jpeg"}
CACHE = "public, max-age=31536000, immutable"


def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def md5(path: Path) -> str:
    h = hashlib.md5()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def sets() -> dict[str, Path]:
    """Every packaged set: lesson key -> its folder."""
    return {f"{m.parent.parent.parent.name}/{m.parent.parent.name}": m.parent for m in sorted((ROOT / "out" / "publish").glob("*/*/v3/manifest.json"))}


def hashed(path: Path) -> str:
    """`name.en.mp4` -> `name.en.<sha8>.mp4`."""
    return f"{path.stem}.{sha256(path)[:8]}{path.suffix}"


def wrangler() -> list[str]:
    """Wrangler's own script, run with node (a .cmd shim cannot be run without a shell)."""
    shim = shutil.which("wrangler")
    if not shim:
        raise SystemExit("wrangler is not installed (npm i -g wrangler) or not on PATH")
    js = Path(shim).parent / "node_modules" / "wrangler" / "bin" / "wrangler.js"
    return ["node", str(js)] if js.exists() else [shim]


def head(url: str, extra: dict | None = None) -> tuple[int, dict]:
    # The checks go past Cloudflare's cache (a query string is part of the cache key; R2 ignores
    # it): a check made before an upload must not leave a cached 404 for the check after it.
    url = f"{url}?check={dt.datetime.now().timestamp():.0f}"
    req = urllib.request.Request(url, method="GET" if extra else "HEAD", headers={"User-Agent": "nitora-upload/1", **(extra or {})})
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            if extra:
                r.read(2048)
            return r.status, {k.lower(): v for k, v in r.headers.items()}
    except urllib.error.HTTPError as e:
        return e.code, {k.lower(): v for k, v in e.headers.items()}


def approve(lang: str, lessons: list[str]) -> None:
    approvals = json.loads(APPROVALS.read_text(encoding="utf-8")) if APPROVALS.exists() else {}
    for key, folder in sets().items():
        if lessons and key not in lessons and key.split("/")[1] not in lessons:
            continue
        manifest = json.loads((folder / "manifest.json").read_text(encoding="utf-8"))
        info = manifest["languages"].get(lang)
        if not info or not (folder / info["video"]).exists():
            print(f"  skip {key}: no {lang} video")
            continue
        approvals.setdefault(key, {})[lang] = {
            "approved": dt.date.today().isoformat(),
            "by": "owner, in chat",
            "video": {"file": info["video"], "sha256": sha256(folder / info["video"])},
            "captions": {"file": info["captions"]["vtt"], "sha256": sha256(folder / info["captions"]["vtt"])},
        }
        print(f"  approved {key} [{lang}]")
    APPROVALS.write_text(json.dumps(approvals, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def plan() -> list[dict]:
    """Every file to publish, checked against its approval. A mismatch stops everything."""
    approvals = json.loads(APPROVALS.read_text(encoding="utf-8")) if APPROVALS.exists() else {}
    all_sets = sets()
    jobs = []
    for key, langs in sorted(approvals.items()):
        folder = all_sets.get(key)
        if not folder:
            raise SystemExit(f"{key}: approved but not packaged")
        poster = folder / "poster.jpg"
        jobs.append({"key": key, "lang": None, "kind": "poster", "path": poster})
        for lang, a in sorted(langs.items()):
            for kind in ("video", "captions"):
                path = folder / a[kind]["file"]
                if not path.exists() or sha256(path) != a[kind]["sha256"]:
                    raise SystemExit(f"{key} [{lang}] {kind}: the file is not the one approved (re-rendered?). Approve it again.")
                jobs.append({"key": key, "lang": lang, "kind": kind, "path": path})
    for j in jobs:
        j["object"] = f"{j['key']}/{hashed(j['path'])}"
        j["url"] = f"{MEDIA}/{j['object']}"
        j["size"] = j["path"].stat().st_size
    return jobs


def verify(j: dict) -> str | None:
    status, h = head(j["url"])
    if status != 200:
        return f"HEAD {status}"
    if int(h.get("content-length", -1)) != j["size"]:
        return f"size {h.get('content-length')} != {j['size']}"
    if h.get("etag", "").strip('"') != md5(j["path"]):
        return f"etag {h.get('etag')} != md5"
    if TYPES[j["path"].suffix] not in h.get("content-type", ""):
        return f"content-type {h.get('content-type')}"
    if j["kind"] == "video":
        status, h = head(j["url"], {"Range": "bytes=0-1023", "Origin": "https://nitoratrading.com"})
        if status != 206:
            return f"range request answered {status}"
    return None


def write_index(jobs: list[dict]) -> None:
    """The site's index: each lesson's poster and its published languages, with their scene starts."""
    index = json.loads(INDEX.read_text(encoding="utf-8")) if INDEX.exists() else {}
    by_key: dict[str, list[dict]] = {}
    for j in jobs:
        by_key.setdefault(j["key"], []).append(j)
    for key, js in by_key.items():
        folder = sets()[key]
        _, local = video_index.entry(folder, "")
        name = lambda kind, lang=None: next(j["object"].split("/")[-1] for j in js if j["kind"] == kind and j["lang"] == lang)  # noqa: E731
        langs = sorted({j["lang"] for j in js if j["lang"]}, key=lambda l: video_index.ORDER.index(l) if l in video_index.ORDER else 99)
        tracks = [{**t, "video": name("video", t["lang"]), "captions": name("captions", t["lang"])} for t in local["tracks"] if t["lang"] in langs]
        published = index.get(key, {}).get("published") or dt.date.today().isoformat()
        index[key] = {"base": f"{MEDIA}/{key}", "poster": name("poster"), "tracks": tracks, "published": published}
    INDEX.write_text(json.dumps(dict(sorted(index.items())), ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def main() -> None:
    args = sys.argv[1:]
    if args[:1] == ["approve"]:
        if len(args) < 2:
            raise SystemExit("usage: upload.py approve <lang> [lesson ...]")
        return approve(args[1], args[2:])
    apply = "--apply" in args
    jobs = plan()
    if not jobs:
        raise SystemExit("nothing approved: run `upload.py approve <lang>` on the owner's approval")
    total = sum(j["size"] for j in jobs)
    print(f"{'UPLOAD' if apply else 'DRY RUN'}: {len(jobs)} files, {total / 1e6:.1f} MB -> {BUCKET} ({MEDIA})")
    for j in jobs:
        print(f"  {j['size'] / 1e6:7.1f} MB  {j['object']}")
    if not apply:
        print("Nothing sent. Run with --apply to upload.")
        return
    cli = wrangler()
    failures = []
    for j in jobs:
        status, h = head(j["url"])
        if status == 200 and h.get("etag", "").strip('"') == md5(j["path"]):
            print(f"  already there  {j['object']}")
        else:
            r = subprocess.run([*cli, "r2", "object", "put", f"{BUCKET}/{j['object']}", "--file", str(j["path"]), "--content-type", TYPES[j["path"].suffix], "--cache-control", CACHE, "--remote"], capture_output=True, text=True, encoding="utf-8", errors="replace")
            if r.returncode:
                failures.append(f"{j['object']}: upload failed: {(r.stderr or r.stdout)[-400:]}")
                continue
            print(f"  uploaded       {j['object']}")
        problem = verify(j)
        if problem:
            failures.append(f"{j['object']}: {problem}")
    if failures:
        print("FAILED; the index was not written:")
        for f in failures:
            print("  " + f)
        raise SystemExit(1)
    write_index(jobs)
    print(f"All {len(jobs)} files verified. Wrote {INDEX.relative_to(SITE)}.")


if __name__ == "__main__":
    main()
