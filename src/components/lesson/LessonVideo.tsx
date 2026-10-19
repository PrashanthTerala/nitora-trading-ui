import { useEffect, useRef, useState } from 'react';
import { Play } from 'lucide-react';
import { Segmented } from '@/components/ui/Segmented';
import { toast } from '@/components/ui/Toast';
import { useProgress } from '@/store/progress';
import { PREF_KEYS } from '@/lib/storageKeys';
import { LANGUAGE_NAMES, fileUrl, formatTime, mapTime, parseVtt, resumePoint, type Cue, type LessonVideoEntry, type VideoTrack } from '@/lib/video';
import { t } from '@/i18n';

/** Read and write the per-lesson, per-language positions; storage can be blocked, so every touch is guarded. */
function readPositions(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(PREF_KEYS.videoPositions) ?? '{}') as Record<string, number>;
  } catch {
    return {};
  }
}
function writePosition(id: string, seconds: number | null) {
  try {
    const all = readPositions();
    if (seconds === null) delete all[id];
    else all[id] = Math.round(seconds);
    localStorage.setItem(PREF_KEYS.videoPositions, JSON.stringify(all));
  } catch {
    // Without storage the video still plays; it just cannot remember where it was.
  }
}
/** The language the reader last chose, if this video has it; else English; else the first. */
export function readLang(tracks: VideoTrack[]): string {
  try {
    const saved = localStorage.getItem(PREF_KEYS.videoLang);
    if (saved && tracks.some((x) => x.lang === saved)) return saved;
  } catch {
    // fall through
  }
  return tracks.some((x) => x.lang === 'en') ? 'en' : tracks[0].lang;
}

/**
 * The lesson's video, under its header. Nothing is downloaded until the reader presses play: the
 * box shows the poster, at a fixed 16:9 so the text below never moves. Then a plain HTML5 video
 * with the browser's own controls (captions off until chosen, speed, full screen, keyboard).
 *
 * Around it: the language (each language is its own recording, timed to its own narration, so
 * switching keeps the reader's place in the lesson rather than the second), resume where the
 * reader left off, the lesson marked complete once 90% has been watched, and a transcript read
 * from the captions. No third-party player, nothing tracked: positions stay in this browser.
 */
export function LessonVideo({ id, title, entry }: { id: string; title: string; entry: LessonVideoEntry }) {
  const [lang, setLang] = useState(() => readLang(entry.tracks));
  const [started, setStarted] = useState(false);
  // false while it plays; otherwise the browser's MediaError code (0 when it gives none), shown with the error.
  const [failed, setFailed] = useState<number | false>(false);
  // The captions as a same-origin blob: URL (see below), once fetched.
  const [trackSrc, setTrackSrc] = useState<string | null>(null);
  const [resumedAt, setResumedAt] = useState<number | null>(null);
  const [cues, setCues] = useState<Cue[] | 'loading' | 'failed' | null>(null);
  const [transcriptOpen, setTranscriptOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const pending = useRef<{ at: number; play: boolean } | null>(null);
  const lastSaved = useRef(0);
  const markedDone = useRef(false);
  const done = useProgress((s) => !!s.completed[id]);
  const markComplete = useProgress((s) => s.markComplete);
  const track = entry.tracks.find((x) => x.lang === lang) ?? entry.tracks[0];
  const posKey = `${id}|${track.lang}`;

  const start = (at?: number) => {
    const from = at ?? resumePoint(readPositions()[posKey], track.duration);
    pending.current = { at: from, play: true };
    setResumedAt(at === undefined && from > 0 ? from : null);
    if (started && videoRef.current) {
      videoRef.current.currentTime = from;
      void videoRef.current.play().catch(() => undefined);
      pending.current = null;
    }
    setStarted(true);
  };

  const changeLang = (next: string) => {
    const v = videoRef.current;
    const to = entry.tracks.find((x) => x.lang === next);
    if (!to) return;
    if (started && v) pending.current = { at: mapTime(track, to, v.currentTime), play: !v.paused };
    setLang(next);
    setResumedAt(null);
    try {
      localStorage.setItem(PREF_KEYS.videoLang, next);
    } catch {
      // the choice just is not remembered
    }
  };

  const onLoaded = () => {
    const v = videoRef.current;
    const p = pending.current;
    if (!v || !p) return;
    pending.current = null;
    if (p.at > 0) v.currentTime = p.at;
    if (p.play) void v.play().catch(() => undefined);
  };

  const onTime = () => {
    const v = videoRef.current;
    if (!v || !v.duration) return;
    if (Math.abs(v.currentTime - lastSaved.current) >= 5) {
      lastSaved.current = v.currentTime;
      writePosition(posKey, v.currentTime);
    }
    if (!done && !markedDone.current && v.currentTime / v.duration >= 0.9) {
      markedDone.current = true;
      markComplete(id);
      toast({ title: t('video.watched'), description: title, tone: 'up' });
    }
  };

  // The transcript, read from the captions of the language showing, once it is opened.
  const captionsUrl = fileUrl(entry, track.captions);
  useEffect(() => {
    if (!transcriptOpen) return;
    let alive = true;
    setCues('loading');
    fetch(captionsUrl)
      .then((res) => (res.ok ? res.text() : Promise.reject(new Error(String(res.status)))))
      .then((text) => alive && setCues(parseVtt(text)))
      .catch(() => alive && setCues('failed'));
    return () => {
      alive = false;
    };
  }, [transcriptOpen, captionsUrl]);

  // The video plays as a plain request, exactly as when its link is opened directly: no
  // crossOrigin, because some phone browsers fail a cross-origin video in CORS mode even when the
  // server answers it correctly (the lesson page failed on a phone that played the file itself).
  // A cross-origin <track> needs a CORS-mode video, so the captions are fetched instead (a normal
  // CORS fetch) and handed to the track as a same-origin blob: URL.
  useEffect(() => {
    if (!started) return;
    let url: string | null = null;
    let alive = true;
    fetch(captionsUrl)
      .then((res) => (res.ok ? res.text() : Promise.reject(new Error(String(res.status)))))
      .then((text) => {
        if (!alive) return;
        url = URL.createObjectURL(new Blob([text], { type: 'text/vtt' }));
        setTrackSrc(url);
      })
      .catch(() => alive && setTrackSrc(null));
    return () => {
      alive = false;
      setTrackSrc(null);
      if (url) URL.revokeObjectURL(url);
    };
  }, [started, captionsUrl]);

  const options = entry.tracks.map((x) => ({ value: x.lang, label: LANGUAGE_NAMES[x.lang]?.native ?? x.lang }));
  const videoUrl = fileUrl(entry, track.video);

  return (
    <section id="lesson-video" aria-label={t('video.region')} className="not-prose mb-10 scroll-mt-24">
      <div className="relative aspect-video overflow-hidden rounded-card border border-line bg-surface-2">
        {started && failed === false ? (
          <video
            ref={videoRef}
            className="absolute inset-0 h-full w-full"
            controls
            playsInline
            preload="metadata"
            poster={fileUrl(entry, entry.poster)}
            src={videoUrl}
            onLoadedMetadata={onLoaded}
            onTimeUpdate={onTime}
            onPause={() => videoRef.current && writePosition(posKey, videoRef.current.currentTime)}
            onEnded={() => writePosition(posKey, null)}
            onError={() => setFailed(videoRef.current?.error?.code ?? 0)}
          >
            {/* No `default`: captions start off, and the reader turns them on from the controls. */}
            {trackSrc && <track key={trackSrc} kind="captions" src={trackSrc} srcLang={track.lang} label={LANGUAGE_NAMES[track.lang]?.native ?? track.lang} />}
          </video>
        ) : failed !== false ? (
          <div role="alert" className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center text-body-sm text-ink">
            <p>{t('video.error')}</p>
            <p className="font-mono text-caption text-ink-muted">{t('video.errorCode', { code: failed })}</p>
            <a href={videoUrl} download className="font-semibold text-accent underline underline-offset-4">
              {t('video.download')}
            </a>
          </div>
        ) : (
          <button type="button" onClick={() => start()} className="group absolute inset-0 h-full w-full focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-accent" aria-label={t('video.play', { duration: formatTime(track.duration) })}>
            <img src={fileUrl(entry, entry.poster)} alt="" width={1920} height={1080} loading="lazy" decoding="async" className="h-full w-full object-cover" />
            <span className="absolute inset-0 flex items-center justify-center" aria-hidden>
              <span className="flex size-16 items-center justify-center rounded-full bg-accent text-on-accent shadow-2 transition-transform duration-(--duration-fast) group-hover:scale-105">
                <Play size={28} strokeWidth={2} className="translate-x-0.5" />
              </span>
            </span>
            <span className="absolute bottom-3 right-3 rounded-control bg-surface-3 px-2 py-0.5 font-mono text-caption text-ink" aria-hidden>
              {formatTime(track.duration)}
            </span>
          </button>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-body-sm text-ink-soft">
        {options.length > 1 && <Segmented size="sm" label={t('video.language')} value={track.lang} onChange={changeLang} options={options} />}
        {resumedAt !== null && (
          <span className="flex items-center gap-2">
            {t('video.resumed', { time: formatTime(resumedAt) })}
            <button type="button" className="font-semibold text-accent underline underline-offset-4" onClick={() => start(0)}>
              {t('video.startOver')}
            </button>
          </span>
        )}
      </div>

      <details className="mt-3 rounded-card border border-line bg-surface-1" onToggle={(e) => setTranscriptOpen((e.currentTarget as HTMLDetailsElement).open)}>
        <summary className="cursor-pointer px-4 py-2.5 text-body-sm font-semibold text-ink">{t('video.transcript')}</summary>
        <div className="max-h-80 overflow-y-auto border-t border-line px-4 py-3 text-body-sm text-ink-soft" lang={track.lang}>
          {cues === 'loading' && <p>{t('video.transcriptLoading')}</p>}
          {cues === 'failed' && <p role="alert">{t('video.transcriptFailed')}</p>}
          {Array.isArray(cues) && (
            <ol className="space-y-1.5">
              {cues.map((c, i) => (
                <li key={i} className="flex gap-3">
                  <button type="button" className="shrink-0 font-mono text-caption text-accent hover:underline" onClick={() => start(c.start)} aria-label={t('video.seekTo', { time: formatTime(c.start) })}>
                    {formatTime(c.start)}
                  </button>
                  <span>{c.text}</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </details>
    </section>
  );
}
