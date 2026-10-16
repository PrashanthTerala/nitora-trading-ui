"""
Speaks a video's narration in every language its script has, and writes what the video and
its captions need:

    narration/<video>/<lang>/<scene>.wav   one recording per scene and language
    narration/<video>/<lang>/timings.json  per scene: each sentence's text, start and end (s),
                                           and the hash of what was spoken (for the cache)
    narration/<video>/index.ts             imports the recordings, with each one's length

    .piper/Scripts/python scripts/narrate.py ma-crossovers            every language
    .piper/Scripts/python scripts/narrate.py ma-crossovers te         one language
    .piper/Scripts/python scripts/narrate.py ma-crossovers te --force regenerate, ignoring the cache

The script is narration/<video>.json. Per language:
  provider    "piper" (default; local, free) or "google" (Cloud Text-to-Speech, scripts/google_tts.py)
  voice       a Piper voice in .piper/voices, or a Google voice name (te-IN-Chirp3-HD-Achird)
  languageCode  Google only, e.g. te-IN
  lengthScale, noiseScale, noiseW   Piper only: speed (above 1 is slower) and variation
  pauses      silence in seconds after a sentence ending in '.', '?' or '!'. With pauses, each
              sentence is spoken on its own; without, Piper speaks the passage in one go (its
              own sentence split gives the timings). Google always speaks sentence by sentence,
              so every caption is timed exactly.
  scenes      one passage per scene

A scene is only re-spoken when its text or voice settings change: the cache key is in
timings.json. That keeps paid or metered voices from being charged twice for the same words.
The generated files are not committed; they are rebuilt from the JSON.
"""

import hashlib
import json
import re
import sys
import wave
from pathlib import Path

root = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(root / "scripts"))
args = [a for a in sys.argv[1:] if not a.startswith("--")]
name = args[0] if args else "ma-crossovers"
only = set(args[1:])
force = "--force" in sys.argv

spec = json.loads((root / "narration" / f"{name}.json").read_text(encoding="utf-8"))
out = root / "narration" / name


def sentences(text: str) -> list[str]:
    return [m.group(0).strip() for m in re.finditer(r"[^.?!।]+[.?!।]*", text) if m.group(0).strip()]


def length(path: Path) -> float:
    with wave.open(str(path), "rb") as wav:
        return wav.getnframes() / wav.getframerate()


class Writer:
    """Collects PCM into a WAV and the start and end of each sentence in it."""

    def __init__(self, path: Path, rate: int):
        self.wav = wave.open(str(path), "wb")
        self.wav.setnchannels(1)
        self.wav.setsampwidth(2)
        self.wav.setframerate(rate)
        self.rate, self.samples, self.cues = rate, 0, []

    def speech(self, text: str, pcm: bytes) -> None:
        start = self.samples / self.rate
        self.wav.writeframes(pcm)
        self.samples += len(pcm) // 2
        self.cues.append({"text": text, "start": round(start, 3), "end": round(self.samples / self.rate, 3)})

    def silence(self, seconds: float) -> None:
        n = round(seconds * self.rate)
        self.wav.writeframes(bytes(2 * n))
        self.samples += n

    def close(self) -> list[dict]:
        self.wav.close()
        return self.cues


TOKEN = re.compile(r"<(pause|mark) ([^>]+)>")


class Voice:
    """One provider's voice: rate, and speak(text) -> list of (sentence, pcm) for one passage."""

    def __init__(self, script: dict):
        self.script = script
        self.provider = script.get("provider", "piper")
        if self.provider == "google":
            import google_tts as g

            self.g, self.rate = g, g.SAMPLE_RATE
        else:
            from piper import PiperVoice, SynthesisConfig

            self.voice = Voice.piper.get(script["voice"]) or PiperVoice.load(root / ".piper" / "voices" / f"{script['voice']}.onnx")
            Voice.piper[script["voice"]] = self.voice
            self.config = SynthesisConfig(length_scale=script.get("lengthScale", 1.0), noise_scale=script.get("noiseScale"), noise_w_scale=script.get("noiseW"))
            self.rate = self.voice.config.sample_rate

    piper: dict = {}

    def one_by_one(self) -> bool:
        """Sentence by sentence (exact caption timing, but the voice restarts its intonation every
        sentence, which can sound choppy) unless the language asks to flow."""
        if self.script.get("flow"):
            return False
        return self.provider == "google" or bool(self.script.get("pauses"))

    def sentence(self, text: str) -> bytes:
        if self.provider == "google":
            s = self.script
            # commaPause: a Chirp 3 HD pause tag after every comma, colon or semicolon, so lists
            # and clauses get a real breath (punctuation alone barely slows a flowing voice).
            tag = s.get("commaPause")
            spoken = re.sub(r"([,:;])\s*", lambda m: f"{m.group(1)} {tag} ", text) if tag else text
            return self.g.synthesize(spoken, s["languageCode"], s["voice"], model=s.get("model"), prompt=s.get("prompt"), markup=bool(tag), speaking_rate=s.get("speakingRate"))
        return b"".join(c.audio_int16_bytes for c in self.voice.synthesize(text, syn_config=self.config))

    def passage(self, text: str) -> list[tuple[str, bytes]]:
        """
        The passage in one go, so the voice keeps its natural flow across sentences. Piper yields
        one chunk per sentence. Google returns one recording, which is cut into sentences at its
        own pauses (see split_at_pauses) so each caption still gets its own timing.
        """
        if self.provider == "google":
            return split_at_pauses(self.sentence(text), self.rate, sentences(text))
        chunks = [c.audio_int16_bytes for c in self.voice.synthesize(text, syn_config=self.config)]
        parts = sentences(text)
        if len(parts) == len(chunks):
            return list(zip(parts, chunks))
        print(f"    note: Piper split {len(chunks)} sentence(s), the script has {len(parts)}; cues spread by length")
        return [(" ".join(parts), b"".join(chunks))]


def split_at_pauses(pcm: bytes, rate: int, parts: list[str]) -> list[tuple[str, bytes]]:
    """
    Cuts one flowing recording into its sentences, for caption timing only (the audio is not
    changed, just divided). Each boundary is placed at the quiet spot nearest to where the text
    says it should be (by share of characters); with no quiet spot within 1.5 s, at that estimate.
    """
    import numpy as np

    if len(parts) < 2:
        return [(" ".join(parts), pcm)]
    x = np.frombuffer(pcm, dtype=np.int16).astype(np.float32)
    win = int(rate * 0.02)
    rms = np.sqrt(np.mean(x[: len(x) // win * win].reshape(-1, win) ** 2, axis=1))
    quiet = rms < max(rms.max(), 1) * 0.03
    runs, start = [], None
    for i, q in enumerate(list(quiet) + [False]):
        if q and start is None:
            start = i
        elif not q and start is not None:
            if i - start >= 6:  # at least 120 ms of quiet
                runs.append((start + i) // 2 * win)
            start = None
    total, chars = len(x), sum(len(p) for p in parts)
    cuts, done, prev = [], 0, 0
    for p in parts[:-1]:
        done += len(p)
        expect = int(total * done / chars)
        near = [r for r in runs if r > prev and abs(r - expect) <= 1.5 * rate]
        cut = min(near, key=lambda r: abs(r - expect)) if near else max(expect, prev + 1)
        cuts.append(cut)
        prev = cut
    edges = [0] + cuts + [total]
    return [(p, pcm[2 * a : 2 * b]) for p, a, b in zip(parts, edges, edges[1:])]


def speak(voice: Voice, text: str, path: Path) -> tuple[list[dict], dict]:
    """
    Speaks a scene: text, <pause s> and <mark name> tokens in order. Returns the caption cues
    (one per sentence, with start and end in seconds) and the marks (seconds from the start of
    the recording to the next sentence's onset). One-by-one voices leave script['pauses'] of
    silence after each sentence; an explicit <pause> replaces that gap.
    """
    w = Writer(path, voice.rate)
    gaps = voice.script.get("pauses", {".": 0.3, "?": 0.45, "!": 0.35})
    pending, marks = 0.0, {}
    for i, part in enumerate(TOKEN.split(text)):
        kind = i % 3  # re.split with two groups: text, token kind, token value, text, ...
        if kind == 1:
            token = part
            continue
        if kind == 2:
            if token == "pause":
                pending = float(part)
            else:
                w.silence(pending)
                pending = 0.0
                marks[part.strip()] = round(w.samples / w.rate, 3)
            continue
        if not part.strip():
            continue
        if voice.one_by_one():
            for sentence in sentences(part):
                w.silence(pending)
                w.speech(sentence, voice.sentence(sentence))
                pending = gaps.get(sentence[-1], gaps.get(".", 0.3))
        else:
            # sentenceGap: a breath between the sentences of a flowing passage ({".": s, "?": s}).
            # Piper speaks each sentence as its own chunk and joins them with no gap, which
            # sounds rushed; the passage is still synthesized in one go, so this is not choppy.
            breath = voice.script.get("sentenceGap", {})
            for sentence, pcm in voice.passage(part.strip()):
                w.silence(pending)
                w.speech(sentence, pcm)
                pending = breath.get(sentence[-1], breath.get(".", 0.0)) if breath else 0.0
    return w.close(), marks


for lang, script in spec["languages"].items():
    if only and lang not in only:
        continue
    provider = script.get("provider", "piper")
    settings = {k: v for k, v in script.items() if k not in ("scenes", "note")}
    (out / lang).mkdir(parents=True, exist_ok=True)
    timings_path = out / lang / "timings.json"
    timings = json.loads(timings_path.read_text(encoding="utf-8")) if timings_path.exists() else {}
    print(f"{lang} ({provider}: {script['voice']})")
    voice = None
    for scene, text in script["scenes"].items():
        path = out / lang / f"{scene}.wav"
        key = hashlib.sha256(json.dumps([settings, text], ensure_ascii=False, sort_keys=True).encode()).hexdigest()[:16]
        if not force and path.exists() and timings.get(scene, {}).get("key") == key:
            print(f"  {scene:12} {length(path):5.1f}s (unchanged)")
            continue
        voice = voice or Voice(script)
        cues, marks = speak(voice, text, path)
        timings[scene] = {"key": key, "seconds": round(length(path), 3), "cues": cues, "marks": marks}
        timings_path.write_text(json.dumps(timings, ensure_ascii=False, indent=1), encoding="utf-8")
        print(f"  {scene:12} {length(path):5.1f}s")
    # Drop scenes the script no longer has.
    timings = {s: t for s, t in timings.items() if s in script["scenes"]}
    timings_path.write_text(json.dumps(timings, ensure_ascii=False, indent=1), encoding="utf-8")

# The index covers every language whose recordings exist, so regenerating one keeps the rest.
langs = [lang for lang in spec["languages"] if (out / lang).is_dir()]
scenes = list(next(iter(spec["languages"].values()))["scenes"])
lines = [f"// Generated by scripts/narrate.py from narration/{name}.json. Do not edit."]
for lang in langs:
    for scene in scenes:
        lines.append(f"import {lang}_{scene} from './{lang}/{scene}.wav';")
lines += ["", "/** Each language's narration, per scene: the recording, its length and its timing marks, in seconds. */", "export const narration = {"]
for lang in langs:
    lines.append(f"  {lang}: {{")
    for scene in scenes:
        marks = json.loads((out / lang / "timings.json").read_text(encoding="utf-8")).get(scene, {}).get("marks", {})
        lines.append(f"    {scene}: {{ src: {lang}_{scene}, seconds: {length(out / lang / f'{scene}.wav'):.3f}, marks: {json.dumps(marks)} }},")
    lines.append("  },")
lines += ["} as const;", "", "export type Lang = keyof typeof narration;"]
(out / "index.ts").write_text("\n".join(lines) + "\n", encoding="utf-8")
for lang in langs:
    total = sum(length(out / lang / f"{s}.wav") for s in scenes)
    print(f"{lang}: {total:.1f}s of narration")
