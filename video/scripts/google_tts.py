"""
Google Cloud Text-to-Speech for the narration: Chirp 3 HD voices, and Gemini-TTS voices that
take a plain-language style prompt ("a friendly elder brother explaining...").

The API key is read from the GOOGLE_TTS_API_KEY environment variable (or, on Windows, the
user's saved variable when this process started before it was set) and is sent in a header,
never in a URL. Restrict the key to the Cloud Text-to-Speech API.

Every request is recorded in narration/.google-usage.json, per calendar month: characters per
voice family and an estimated cost for Gemini. synthesize() refuses a request that would take
Chirp past CHIRP_MONTHLY_LIMIT characters (inside Google's 1M free each month) or Gemini past
GEMINI_BUDGET_USD of estimated spend (paid from the free-trial credit), so a mistake cannot
run up a bill. Prices are Google's published ones, checked 2026-10-15; the estimate is an
estimate, and the billing report is the truth.

    .piper/Scripts/python scripts/google_tts.py voices te-IN
"""

import base64
import datetime
import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
USAGE = ROOT / "narration" / ".google-usage.json"
ENDPOINT = "https://texttospeech.googleapis.com/v1"

CHIRP_MONTHLY_LIMIT = 900_000          # Google gives 1,000,000 Chirp 3 HD characters free a month
GEMINI_BUDGET_USD = 25.0               # per month, out of the $300 trial credit
GEMINI_OUTPUT_USD_PER_M = {            # per 1M audio tokens; 25 tokens per second of audio
    "gemini-2.5-flash-tts": 10.0,
    "gemini-2.5-pro-tts": 20.0,
    "gemini-3.1-flash-tts-preview": 20.0,
}
SAMPLE_RATE = 24_000


def _key() -> str:
    key = os.environ.get("GOOGLE_TTS_API_KEY")
    if not key and sys.platform == "win32":
        import winreg

        try:
            with winreg.OpenKey(winreg.HKEY_CURRENT_USER, "Environment") as env:
                key = winreg.QueryValueEx(env, "GOOGLE_TTS_API_KEY")[0]
        except OSError:
            key = None
    if not key:
        sys.exit("GOOGLE_TTS_API_KEY is not set")
    return key


def _call(method: str, path: str, body: dict | None = None) -> dict:
    request = urllib.request.Request(
        f"{ENDPOINT}/{path}",
        data=json.dumps(body).encode() if body is not None else None,
        method=method,
        headers={"X-Goog-Api-Key": _key(), "Content-Type": "application/json"},
    )
    try:
        with urllib.request.urlopen(request, timeout=300) as response:
            return json.loads(response.read())
    except urllib.error.HTTPError as error:
        sys.exit(f"Google TTS {error.code}: {error.read().decode(errors='replace')[:600]}")


def _usage() -> dict:
    month = datetime.date.today().strftime("%Y-%m")
    data = json.loads(USAGE.read_text(encoding="utf-8")) if USAGE.exists() else {}
    return data, data.setdefault(month, {"chirpChars": 0, "geminiChars": 0, "geminiSeconds": 0.0, "geminiUsd": 0.0})


def voices(language: str) -> list[dict]:
    return _call("GET", f"voices?languageCode={language}").get("voices", [])


def synthesize(text: str, language: str, voice: str, model: str | None = None, prompt: str | None = None, markup: bool = False, speaking_rate: float | None = None) -> bytes:
    """
    Returns 16-bit mono PCM at SAMPLE_RATE. `model` set means a Gemini-TTS voice. For Chirp 3 HD,
    `markup` sends the text in the markup field, where pause tags ([pause short], [pause],
    [pause long]) work, and `speaking_rate` (0.25-2.0) sets the pace.
    """
    data, month = _usage()
    if model:
        if month["geminiUsd"] >= GEMINI_BUDGET_USD:
            sys.exit(f"Gemini budget for this month (${GEMINI_BUDGET_USD}) is used up: ${month['geminiUsd']:.2f}")
    elif month["chirpChars"] + len(text) > CHIRP_MONTHLY_LIMIT:
        sys.exit(f"Chirp limit for this month ({CHIRP_MONTHLY_LIMIT:,} characters) would be passed: {month['chirpChars']:,} used")

    body = {
        "input": {("markup" if markup else "text"): text, **({"prompt": prompt} if prompt else {})},
        "voice": {"languageCode": language, "name": voice, **({"modelName": model} if model else {})},
        "audioConfig": {"audioEncoding": "LINEAR16", "sampleRateHertz": SAMPLE_RATE, **({"speakingRate": speaking_rate} if speaking_rate else {})},
    }
    audio = base64.b64decode(_call("POST", "text:synthesize", body)["audioContent"])
    # LINEAR16 comes back as a WAV file; keep only the samples after its header.
    if audio[:4] == b"RIFF":
        audio = audio[audio.index(b"data") + 8 :]

    seconds = len(audio) / 2 / SAMPLE_RATE
    if model:
        month["geminiChars"] += len(text)
        month["geminiSeconds"] += seconds
        month["geminiUsd"] += seconds * 25 / 1e6 * GEMINI_OUTPUT_USD_PER_M.get(model, 20.0)
    else:
        month["chirpChars"] += len(text)
    USAGE.write_text(json.dumps(data, indent=2), encoding="utf-8")
    return audio


if __name__ == "__main__":
    if sys.argv[1:2] == ["voices"]:
        for v in voices(sys.argv[2] if len(sys.argv) > 2 else "te-IN"):
            print(v["name"], v.get("ssmlGender", ""), v.get("naturalSampleRateHertz", ""))
    elif sys.argv[1:2] == ["usage"]:
        print(json.dumps(_usage()[0], indent=2))
