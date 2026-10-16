"""
Turns a video's rendered languages into a versioned, website-ready set, in lesson order:

    out/publish/<module>/<lesson>/v<version>/
        <lesson>.<lang>.mp4      H.264 + AAC, loudness -16 LUFS, audio language tagged,
                                 moov atom first (starts playing before it has downloaded)
        <lesson>.<lang>.vtt      captions as a separate track (WebVTT), so viewers can turn
        <lesson>.<lang>.srt      them off; the same cues as SRT
        audio/<lesson>.<lang>.m4a        the finished soundtrack alone (AAC)
        audio/<lang>/01-title.wav ...    the narration masters, one per scene, numbered in order
        poster.jpg               a still for the player before playback
        manifest.json            everything above, with durations, voices, sources and status
        qa/<lesson>.<lang>.json  scripts/qa.py's report on the finished file

    python scripts/package.py ma-crossovers [en te hi es]

Input: out/v2/<video>-<lang>.mp4 rendered by Remotion, and narration/<video>/<lang>/timings.json
from scripts/narrate.py. Captions are timed exactly as the video is: each scene lasts
max(base, lead + narration + tail) seconds (the script's "timing" and scene "base"), rounded to
whole frames, and a sentence's cue starts at its scene's start + lead + the sentence's offset.
Nothing here is uploaded anywhere; publishing to the site is a separate, approved step.
"""

import json
import re
import shutil
import subprocess
import sys
import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "scripts"))
import qa  # noqa: E402

FFMPEG = qa.FFMPEG
FPS = 30
ISO639_2 = {"en": "eng", "te": "tel", "hi": "hin", "es": "spa"}
LANG_NAMES = {"en": "English", "te": "తెలుగు (Telugu)", "hi": "हिन्दी (Hindi)", "es": "Español (Latinoamérica)"}
CREDITS = {
    "piper:en_US-ljspeech-high": "Voice: Piper en_US-ljspeech-high, trained on the LJ Speech dataset (public domain).",
    "piper:es_MX-ald-medium": "Voice: Piper es_MX-ald-medium, trained on the Ald Mexican Spanish dataset (Unlicense), fine-tuned from es_ES-davefx (CC0).",
    "google": "Voice: Google Cloud Text-to-Speech ({voice}).",
}


def ff(args: list[str]) -> str:
    r = subprocess.run([FFMPEG, "-hide_banner", "-y", *args], capture_output=True, text=True, encoding="utf-8", errors="replace")
    if r.returncode:
        raise RuntimeError(r.stderr[-1500:])
    return r.stderr


def scene_starts(spec: dict, timings: dict) -> dict:
    lead, tail = spec["timing"]["lead"], spec["timing"]["tail"]
    t, starts = 0, {}
    for scene, meta in spec["scenes"].items():
        starts[scene] = t / FPS
        seconds = max(meta["base"], lead + timings[scene]["seconds"] + tail)
        t += round(seconds * FPS)
    return starts


def split_cue(text: str, start: float, end: float, limit: int = 84) -> list[tuple[str, float, float]]:
    """Long sentences become several cues, split at commas or colons (or spaces), timed by length."""
    if len(text) <= limit:
        return [(text, start, end)]
    pieces, current = [], ""
    for part in re.split(r"(?<=[,:;،])\s+", text):
        if current and len(current) + 1 + len(part) > limit:
            pieces.append(current)
            current = part
        else:
            current = f"{current} {part}".strip()
    pieces.append(current)
    final = []
    for piece in pieces:
        while len(piece) > limit:
            cut = piece.rfind(" ", 0, limit)
            cut = cut if cut > 0 else limit
            final.append(piece[:cut])
            piece = piece[cut:].strip()
        final.append(piece)
    total = sum(len(p) for p in final)
    out, t = [], start
    for p in final:
        d = (end - start) * len(p) / total
        out.append((p, t, t + d))
        t += d
    return out


def wrap(text: str, width: int = 42) -> str:
    if len(text) <= width:
        return text
    cut = text.rfind(" ", 0, len(text) // 2 + 10)
    return text if cut <= 0 else text[:cut] + "\n" + text[cut + 1 :]


def stamp(seconds: float, sep: str) -> str:
    ms = round(seconds * 1000)
    h, ms = divmod(ms, 3_600_000)
    m, ms = divmod(ms, 60_000)
    s, ms = divmod(ms, 1000)
    return f"{h:02d}:{m:02d}:{s:02d}{sep}{ms:03d}"


def captions(spec: dict, timings: dict) -> list[tuple[str, float, float]]:
    lead = spec["timing"]["lead"]
    cues = []
    for scene, start in scene_starts(spec, timings).items():
        for c in timings[scene]["cues"]:
            if c["text"].strip():
                cues += split_cue(c["text"].strip(), start + lead + c["start"], start + lead + c["end"])
    return cues


def write_captions(cues, vtt: Path, srt: Path) -> None:
    vtt.write_text("WEBVTT\n\n" + "\n".join(f"{i}\n{stamp(a, '.')} --> {stamp(b, '.')}\n{wrap(t)}\n" for i, (t, a, b) in enumerate(cues, 1)), encoding="utf-8")
    srt.write_text("\n".join(f"{i}\n{stamp(a, ',')} --> {stamp(b, ',')}\n{wrap(t)}\n" for i, (t, a, b) in enumerate(cues, 1)), encoding="utf-8")


def finish(src: Path, dst: Path, lang: str) -> dict:
    """Two-pass loudness normalisation to -16 LUFS (linear gain), language tag, faststart."""
    log = ff(["-i", str(src), "-vn", "-af", "loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json", "-f", "null", "-"])
    measured = json.loads(log[log.rfind("{") : log.rfind("}") + 1])
    m = {"integrated_lufs": float(measured["input_i"])}
    af = (
        f"loudnorm=I=-16:TP=-1.5:LRA=11:measured_I={measured['input_i']}:measured_TP={measured['input_tp']}"
        f":measured_LRA={measured['input_lra']}:measured_thresh={measured['input_thresh']}:offset={measured['target_offset']}:linear=true"
    )
    ff(["-i", str(src), "-map", "0:v:0", "-map", "0:a:0", "-c:v", "copy", "-af", af, "-ar", "48000", "-c:a", "aac", "-b:a", "160k",
        "-metadata:s:a:0", f"language={ISO639_2[lang]}", "-metadata", f"title=Nitora Trading Academy ({lang})", "-movflags", "+faststart", str(dst)])
    return {"before_lufs": m["integrated_lufs"], "after": qa.loudness(dst)}


# Cuts other than the full lesson: which scenes, their bases, where the renders are, where to
# publish. The bases must match the composition's (src/MaCrossoversCinematic.tsx BASES); a cut
# over every scene takes its overrides per lesson.
# Where the poster frame is, as a share of the English video.
POSTER_AT = {"ma-crossovers": 0.36, "engulfing": 0.25}
CUTS = {
    # The proof of concept (4 scenes); its composition has since grown into the full lesson.
    "cinematic-poc": {"bases": {"title": 7, "average": 30, "golden": 18, "lag": 26}, "input": "v3/{name}-cinematic-{lang}.mp4", "dir": "v3-cinematic-poc"},
    # The full cinematic lesson: every scene, the script's bases (the crossover lesson's intro: 7 s).
    "cinematic": {"bases": {"ma-crossovers": {"title": 7}}, "all": True, "input": "v3/{name}-cinematic-{lang}.mp4", "dir": "v3"},
}


def main() -> None:
    cut_name = next((sys.argv[i + 1] for i, a in enumerate(sys.argv) if a == "--cut"), None)
    sys.argv = [a for i, a in enumerate(sys.argv) if a != "--cut" and (i == 0 or sys.argv[i - 1] != "--cut")]
    name = sys.argv[1] if len(sys.argv) > 1 else "ma-crossovers"
    spec = json.loads((ROOT / "narration" / f"{name}.json").read_text(encoding="utf-8"))
    langs = sys.argv[2:] or list(spec["languages"])
    module, lesson = spec["lesson"].split("/")
    cut = CUTS.get(cut_name or "", None)
    if cut:
        if cut.get("all"):
            bases = cut["bases"].get(name, {})
            spec = {**spec, "scenes": {k: {**m, "base": bases.get(k, m["base"])} for k, m in spec["scenes"].items()}}
        else:
            spec = {**spec, "scenes": {k: {**spec["scenes"][k], "base": b} for k, b in cut["bases"].items()}}
    out = ROOT / "out" / "publish" / module / lesson / (cut["dir"] if cut else f"v{spec['version']}")
    (out / "audio").mkdir(parents=True, exist_ok=True)
    (out / "qa").mkdir(exist_ok=True)
    manifest_path = out / "manifest.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8")) if manifest_path.exists() else {}
    manifest.update({
        "lesson": spec["lesson"],
        "version": spec["version"],
        "source": spec["source"],
        "data": "Every chart is synthetic, for teaching; every number is computed by the site's indicator engine.",
        "status": "awaiting human review: not for publication until approved",
        "generated": datetime.datetime.now().isoformat(timespec="seconds"),
        "poster": "poster.jpg",
        "languages": manifest.get("languages", {}),
    })

    for lang in langs:
        script = spec["languages"][lang]
        src = ROOT / "out" / (cut["input"].format(name=name, lang=lang) if cut else f"v2/{name}-{lang}.mp4")
        timings = json.loads((ROOT / "narration" / name / lang / "timings.json").read_text(encoding="utf-8"))
        base = f"{lesson}.{lang}"
        print(f"{lang}: finishing {src.name}")
        loud = finish(src, out / f"{base}.mp4", lang)
        write_captions(captions(spec, timings), out / f"{base}.vtt", out / f"{base}.srt")
        ff(["-i", str(out / f"{base}.mp4"), "-vn", "-c:a", "copy", "-f", "mp4", "-movflags", "+faststart", str(out / "audio" / f"{base}.m4a")])
        masters = out / "audio" / lang
        shutil.rmtree(masters, ignore_errors=True)
        masters.mkdir()
        for i, scene in enumerate(spec["scenes"], 1):
            shutil.copyfile(ROOT / "narration" / name / lang / f"{scene}.wav", masters / f"{i:02d}-{scene}.wav")
        report = qa.qa(out / f"{base}.mp4", sheet=False)
        # A <pause> in the script (the quiz's thinking time) is silence on purpose: report it as
        # such instead of as a fault, but only when the silence sits inside a scripted pause.
        lead = spec["timing"]["lead"]
        intended = []
        for scene, start in scene_starts(spec, timings).items():
            cues = timings[scene]["cues"]
            for a, b in zip(cues, cues[1:]):
                if b["start"] - a["end"] >= 2.0:
                    intended.append((start + lead + a["end"], start + lead + b["start"]))
        report["silences_intended"] = [s for s in report.get("silences_over_s", []) if any(a - 0.4 <= s[0] and s[1] <= b + 0.4 for a, b in intended)]
        report["silences_over_s"] = [s for s in report.get("silences_over_s", []) if s not in report["silences_intended"]]
        report["checks"]["no_long_silence"] = not report["silences_over_s"]
        report["failed"] = [k for k, ok in report["checks"].items() if not ok]
        (ROOT / "out" / "qa" / f"{base}.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
        shutil.copyfile(ROOT / "out" / "qa" / f"{base}.json", out / "qa" / f"{base}.json")
        provider = script.get("provider", "piper")
        credit = CREDITS["google"].format(voice=script["voice"]) if provider == "google" else CREDITS.get(f"piper:{script['voice']}", f"Voice: Piper {script['voice']}.")
        manifest["languages"][lang] = {
            "name": LANG_NAMES[lang],
            "video": f"{base}.mp4",
            "captions": {"vtt": f"{base}.vtt", "srt": f"{base}.srt", "default": "off"},
            "audio": f"audio/{base}.m4a",
            "narration_masters": [f"audio/{lang}/{i:02d}-{s}.wav" for i, s in enumerate(spec["scenes"], 1)],
            "duration_s": report["duration_s"],
            "voice": {"provider": provider, "name": script["voice"], "credit": credit},
            "loudness_lufs": loud["after"]["integrated_lufs"],
            "true_peak_dbtp": loud["after"]["true_peak_dbtp"],
            "qa_failed": report["failed"],
            "review": "approved by the owner (English v1 voice); v2 script approved" if lang == "en" else "awaiting native-speaker review",
        }
        print(f"  {report['duration_s']}s, {loud['before_lufs']} -> {loud['after']['integrated_lufs']} LUFS, failed: {report['failed'] or 'none'}")

    poster_src = ROOT / "out" / (cut["input"].format(name=name, lang="en") if cut else f"v2/{name}-en.mp4")
    if poster_src.exists() and not (out / "poster.jpg").exists():
        # A still that says what the lesson is: the golden-cross chart, or the engulfing pair.
        ff(["-ss", f"{report['duration_s'] * POSTER_AT.get(name, 0.36):.2f}", "-i", str(poster_src), "-frames:v", "1", "-c:v", "mjpeg", "-q:v", "3", "-f", "image2", str(out / "poster.jpg")])
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"-> {out}")


if __name__ == "__main__":
    main()
