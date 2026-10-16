"""
Technical QA for rendered videos: measures what can be measured, so a review starts from facts.

    python scripts/qa.py out/ma-crossovers-en.mp4 [more.mp4 ...]      (writes out/qa/<name>.json)
    python scripts/qa.py --sheet out/ma-crossovers-en.mp4               (also a 4x3 contact sheet)

Per file:
  - container and streams (ffprobe): resolution, frame rate, duration, codecs, audio sample
    rate and channels, language tag, size, bitrate;
  - loudness (ffmpeg loudnorm analysis): integrated LUFS, true peak, loudness range;
  - clipping: samples at full scale;
  - silences longer than 2.5 s (ffmpeg silencedetect);
  - black frames, sampled at 2 fps (mean luma below 12 of 255);
  - subtitles: <name>.<lang>.vtt / .srt next to the video.
Thresholds are in CHECKS; a failed check is listed, never hidden. Needs ffmpeg/ffprobe (the
ones Remotion ships are used) and numpy (+ Pillow for --sheet).
"""

import json
import re
import subprocess
import sys
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent.parent
BIN = ROOT / "node_modules" / "@remotion" / "compositor-win32-x64-msvc"
FFMPEG, FFPROBE = str(BIN / "ffmpeg"), str(BIN / "ffprobe")

CHECKS = {
    "width": 1920,
    "height": 1080,
    "fps": 30,
    "video_codec": "h264",
    "audio_codec": "aac",
    "true_peak_max_dbtp": -1.0,      # no inter-sample clipping
    "lufs_range": (-20.0, -13.0),    # speech for online video; -16 LUFS is the usual target
    "max_silence_s": 2.5,
    "max_black_frames": 2,           # the first and last fades may dip to black
}


def run(args: list[str]) -> str:
    """Runs an ffmpeg analysis and returns its log (stderr), where the filters report."""
    return subprocess.run(args, capture_output=True, text=True, encoding="utf-8", errors="replace").stderr


def probe(path: Path) -> dict:
    out = subprocess.run([FFPROBE, "-v", "error", "-print_format", "json", "-show_format", "-show_streams", str(path)], capture_output=True, text=True).stdout
    data = json.loads(out)
    v = next((s for s in data["streams"] if s["codec_type"] == "video"), {})
    a = [s for s in data["streams"] if s["codec_type"] == "audio"]
    num, den = (v.get("avg_frame_rate") or "0/1").split("/")
    return {
        "width": v.get("width"),
        "height": v.get("height"),
        "fps": round(int(num) / int(den), 3) if int(den) else None,
        "video_codec": v.get("codec_name"),
        "duration_s": round(float(data["format"]["duration"]), 2),
        "size_mb": round(int(data["format"]["size"]) / 1e6, 1),
        "bitrate_kbps": round(int(data["format"]["bit_rate"]) / 1000),
        "audio_streams": [
            {"codec": s.get("codec_name"), "sample_rate": int(s.get("sample_rate", 0)), "channels": s.get("channels"), "language": s.get("tags", {}).get("language")}
            for s in a
        ],
    }


def loudness(path: Path) -> dict:
    err = run([FFMPEG, "-hide_banner", "-i", str(path), "-vn", "-af", "loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json", "-f", "null", "-"])
    block = err[err.rfind("{") : err.rfind("}") + 1]
    d = json.loads(block)
    return {"integrated_lufs": float(d["input_i"]), "true_peak_dbtp": float(d["input_tp"]), "loudness_range_lu": float(d["input_lra"])}


def samples(path: Path) -> np.ndarray:
    # Through WAV: the minimal ffmpeg has no raw-PCM muxer.
    raw = subprocess.run([FFMPEG, "-v", "error", "-i", str(path), "-vn", "-ac", "1", "-ar", "48000", "-c:a", "pcm_s16le", "-f", "wav", "-"], capture_output=True).stdout
    if len(raw) <= 44:
        raise RuntimeError(f"ffmpeg returned no audio for {path}")
    return np.frombuffer(raw[raw.index(b"data") + 8 :], dtype=np.int16)


def silences(path: Path, min_s: float) -> list[list[float]]:
    err = run([FFMPEG, "-hide_banner", "-i", str(path), "-vn", "-af", f"silencedetect=noise=-40dB:d={min_s}", "-f", "null", "-"])
    starts = [float(x) for x in re.findall(r"silence_start: ([\d.]+)", err)]
    ends = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", err)]
    return [[round(s, 2), round(e, 2)] for s, e in zip(starts, ends)]


def pngs(args: list[str]) -> list:
    """Decodes the frames an ffmpeg command writes as a PNG stream. Remotion's ffmpeg is a minimal
    build without raw-video output, so frames come through PNG; an empty result is an error,
    never 'no problems found'."""
    from io import BytesIO

    from PIL import Image

    data = subprocess.run([FFMPEG, "-v", "error", *args, "-f", "image2pipe", "-c:v", "png", "-"], capture_output=True).stdout
    sig = bytes.fromhex("89504e470d0a1a0a")  # the PNG signature
    parts = [sig + chunk for chunk in data.split(sig)[1:]]
    if not parts:
        raise RuntimeError(f"ffmpeg returned no frames for {args}")
    return [Image.open(BytesIO(part)).convert("RGB") for part in parts]


def black_frames(path: Path) -> list[float]:
    fps = 2
    # The minimal ffmpeg has no fps filter; resampling the output rate does the same job.
    frames = pngs(["-i", str(path), "-vf", "scale=96:54", "-r", str(fps)])
    return [round(i / fps, 1) for i, f in enumerate(frames) if np.asarray(f.convert("L")).mean() < 12]


def contact_sheet(path: Path, duration: float, out: Path) -> None:
    from PIL import Image

    cols, rows = 4, 3
    tiles = [pngs(["-ss", f"{duration * (i + 0.5) / (cols * rows):.2f}", "-i", str(path), "-frames:v", "1", "-vf", "scale=480:270"])[0] for i in range(cols * rows)]
    sheet = Image.new("RGB", (480 * cols, 270 * rows))
    for i, tile in enumerate(tiles):
        sheet.paste(tile, ((i % cols) * 480, (i // cols) * 270))
    sheet.save(out, quality=88)


def qa(path: Path, sheet: bool) -> dict:
    info = probe(path)
    report = {"file": str(path), **info, "checks": {}, "failed": []}
    if info["audio_streams"]:
        report["loudness"] = loudness(path)
        pcm = samples(path)
        report["clipped_samples"] = int(np.sum(np.abs(pcm.astype(np.int32)) >= 32767))
        report["sample_peak_dbfs"] = round(20 * np.log10(max(np.abs(pcm).max(), 1) / 32768), 2)
        report["silences_over_s"] = silences(path, CHECKS["max_silence_s"])
    report["black_frames_at_s"] = black_frames(path)
    stem = path.name[: -len(path.suffix)]
    report["subtitles"] = sorted(p.name for p in path.parent.glob(f"{stem}*") if p.suffix in (".vtt", ".srt"))

    c = report["checks"]
    c["resolution_1080p"] = info["width"] == CHECKS["width"] and info["height"] == CHECKS["height"]
    c["fps_30"] = info["fps"] == CHECKS["fps"]
    c["h264"] = info["video_codec"] == CHECKS["video_codec"]
    c["aac_audio"] = bool(info["audio_streams"]) and info["audio_streams"][0]["codec"] == CHECKS["audio_codec"]
    if info["audio_streams"]:
        lo, hi = CHECKS["lufs_range"]
        c["loudness_in_range"] = lo <= report["loudness"]["integrated_lufs"] <= hi
        c["true_peak_ok"] = report["loudness"]["true_peak_dbtp"] <= CHECKS["true_peak_max_dbtp"]
        c["no_clipping"] = report["clipped_samples"] == 0
        c["no_long_silence"] = not report["silences_over_s"]
        c["audio_language_tagged"] = bool(info["audio_streams"][0]["language"]) and info["audio_streams"][0]["language"] != "und"
    c["no_black_frames"] = len(report["black_frames_at_s"]) <= CHECKS["max_black_frames"]
    c["subtitles_present"] = bool(report["subtitles"])
    report["failed"] = [k for k, ok in c.items() if not ok]

    out = ROOT / "out" / "qa"
    out.mkdir(parents=True, exist_ok=True)
    (out / f"{stem}.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
    if sheet:
        contact_sheet(path, info["duration_s"], out / f"{stem}-sheet.jpg")
    return report


if __name__ == "__main__":
    sheet = "--sheet" in sys.argv
    for arg in [a for a in sys.argv[1:] if not a.startswith("--")]:
        r = qa(Path(arg).resolve(), sheet)
        lo = r.get("loudness", {})
        print(
            f"{Path(arg).name:28} {r['width']}x{r['height']} {r['fps']}fps {r['duration_s']:7.1f}s {r['size_mb']:5.1f}MB "
            f"audio={len(r['audio_streams'])} LUFS={lo.get('integrated_lufs', '-')} TP={lo.get('true_peak_dbtp', '-')} "
            f"clip={r.get('clipped_samples', '-')} black={len(r['black_frames_at_s'])} subs={len(r['subtitles'])} "
            f"FAILED={','.join(r['failed']) or 'none'}"
        )
