# Lesson videos: website hand-off

This describes the files `video/scripts/package.py` produces, and how a lesson page would play them. It is a proposal only. **Nothing here is wired into the site yet.** Integration is a separate step that needs approval: it changes the site, and the videos must pass review first.

## What a lesson ships as

```
video/out/publish/m05-indicators/03-ma-crossovers/v2/
  03-ma-crossovers.en.mp4   .te.mp4   .hi.mp4   .es.mp4     one video per language (each timed to its own voice)
  03-ma-crossovers.en.vtt   .te.vtt   .hi.vtt   .es.vtt     captions, a separate track: viewers turn them on/off
  03-ma-crossovers.en.srt   ...                           the same captions as SRT (for YouTube and similar)
  audio/03-ma-crossovers.<lang>.m4a                       the finished soundtrack alone
  audio/<lang>/01-title.wav … 14-end.wav                   narration masters, one per scene, in lesson order
  poster.jpg                                              the still shown before playback
  manifest.json                                           all of the above, plus durations, voices, credits and review status
  qa/03-ma-crossovers.<lang>.json                         the technical QA report for each file
```

## Sets ready for review

Both are the cinematic (V3) cut. All files passed `qa.py` and are at −16 LUFS. Each set is awaiting human review, including a native speaker's check of the Telugu, Hindi and Spanish.

| Lesson | Folder | en | te | hi | es | Size |
|---|---|---|---|---|---|---|
| m05 · 03 Moving average crossovers | `video/out/publish/m05-indicators/03-ma-crossovers/v3/` | 6:45 | 8:32 | 6:08 | 6:50 | 248 MB |
| m02 · 06 Bullish and bearish engulfing | `video/out/publish/m02-candlestick-patterns/06-engulfing/v3/` | 6:35 | 8:04 | 6:01 | 6:49 | 189 MB |

New lessons are made in English and Telugu only, until the owner revisits the other languages after these videos are on the site.

The engulfing set follows two later rules:
- disclaimer tags ("Synthetic data, for teaching", "Illustration") sit in the frame's top-right corner;
- the end card shows the Nitora icon.

The crossover v3 set was rendered before these rules and is kept as it is.

**Why one video per language,** rather than one video with four audio tracks:
- Each language is timed to its own narration, because the directive forbids squeezing every language onto the English timing. Telugu runs about a third longer than English.
- So the pictures differ per language, and a single video can't carry them all.
- Switching language means switching the video source, then resuming at the same point *in the lesson*, not the same second.

The MP4s are encoded for the web:
- H.264 and AAC;
- loudness evened to −16 LUFS, so switching language doesn't jump the volume;
- an audio language tag (`eng`, `tel`, `hin`, `spa`);
- `faststart`, so playback begins before the download finishes.

## How a player would use them

A plain HTML5 `<video>` covers every requirement in directive §19:

```html
<video controls preload="metadata" playsinline poster="…/poster.jpg">
  <source src="…/03-ma-crossovers.te.mp4" type="video/mp4" />
  <track kind="captions" src="…/03-ma-crossovers.te.vtt" srclang="te" label="తెలుగు" />
  <!-- no `default` attribute: captions start off, the viewer turns them on -->
</video>
```

| Requirement | How |
|---|---|
| Four language choices | A language picker that swaps `<source>` and `<track>`, remembers the choice (localStorage) and defaults to the site language |
| Captions on and off | The browser's own captions control (`<track>`), off by default |
| Playback speed, full screen | Built-in controls |
| Mobile | `playsinline`. Chart text is now at least 30 px at 1080p |
| Resume | Save `currentTime` per lesson and language; restore it on load |
| Lesson progress | Mark the lesson watched past about 90%, using the site's existing progress store |
| Transcript | Rendered from the `.vtt`, which has the same sentences as the narration |

**Hosting.** Each language MP4 is about 25–35 MB, roughly 100–140 MB a lesson. That rules out committing them to git. Static hosting or a CDN behind the existing Caddy is the likely route, but that decision is yours.
