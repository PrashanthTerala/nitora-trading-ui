# Prompt: putting the lesson videos on nitoratrading.com

Written 2026-10-17, on the owner's instruction. **New video production is paused** until this work is approved and shipped.

**Draft for approval.** No step below runs until the owner approves it in chat. Nothing is uploaded, deployed or published, and no DNS or account setting changes, without a separate explicit yes for that step.

---

You are adding the narrated lesson videos to the Nitora Trading Academy site (`nitora-trading-ui`). The work must meet the standard of a serious course platform such as Khan Academy, Coursera or MDN, while staying simple enough for a static site with no backend.

## What exists

- **Videos ready for review:** nine lesson sets in `video/out/publish/<module>/<lesson>/v3/`.
  - Each set has, per language:
    - an H.264/AAC MP4 at 1080p30 and −16 LUFS, with `faststart`;
    - WebVTT and SRT captions;
    - an `m4a` audio track.
  - Each set also has a `poster.jpg` and a `manifest.json`.
  - English and Telugu throughout. The crossovers and engulfing sets also have Hindi and Spanish.
  - Every manifest says `"status": "awaiting human review"`. Only sets the owner approves may go public.
- **The site:** a static Vite/React build, served by nginx in one container on the Contabo server, behind the nitorastone Caddy (see `docs/DEPLOYMENT.md`).
  - Lessons are MDX, rendered by `src/pages/LessonPage.tsx`.
  - The page has three columns: the outline, the article (`max-w-(--container-lesson)`), and "on this page".
  - The site already stores progress locally, and has its own language setting.
- **The player's needs:** `docs/video-production/WEBSITE_HANDOFF.md`, "How a player would use them".

## Non-negotiables

1. **Never commit video files to git, and never bake them into the Docker image.** Media lives in object storage and is referenced by URL.
2. **Publishing gates.**
   - Only owner-approved sets are uploaded to the public bucket.
   - The Telugu, Hindi and Spanish tracks also need a native speaker's sign-off, recorded in the manifest (`"review": {"te": "approved 2026-..", ...}`).
   - A set without approval never appears on the site, even if its files exist.
3. **Privacy.**
   - No third-party player, embed, tracker or cookie: no YouTube or Vimeo embeds.
   - Plain HTML5 `<video>`, served from our own domain or bucket.
   - Any watch progress stays in `localStorage`, like the rest of the site.
4. **Accessibility, WCAG 2.2 AA.**
   - Captions in every language, with the browser's captions control off by default.
   - Full keyboard operation, visible focus, and labels on every control.
   - A transcript generated from the VTT.
   - No autoplay. The site's reduced-motion preference is respected.
5. **Performance.**
   - The video never blocks the lesson text. Nothing loads until the reader asks: `preload="none"`, poster only.
   - Lesson pages keep their current scores: LCP stays on the text, CLS stays 0, and the player box reserves its 16:9 space.
   - Any player code is lazy-loaded and stays under 10 kB gzipped.
6. **Synthetic data, honestly labelled.** The videos' own tags and disclaimers stay. The player must not hide them.
7. **No production change without explicit approval.** This covers DNS, buckets, CORS, CSP, nginx and Caddy. Each one is a separate ask, with the exact change shown first.

## Hosting (recommended: Cloudflare R2; the owner decides)

- **Recommended:** Cloudflare R2, a bucket served on a custom domain, e.g. `media.nitoratrading.com`.
  - No egress fees.
  - It sits on Cloudflare's CDN, so viewers in India, the EU and the US are all served from nearby.
  - About 1.3 GB today, which is inside the free tier.
  - The custom domain needs the `nitoratrading.com` zone on Cloudflare DNS. Check that before anything else.
  - The `r2.dev` URL is rate-limited and not for production.
- **The paths are versioned and immutable:** `/<module>/<lesson>/<version>/<file>`, served with `Cache-Control: public, max-age=31536000, immutable`.
  - A re-render gets a new version folder, so no cache ever serves a stale file.
  - The site reads a small index (`videos.json`), built with the site, to know the current version of each lesson.
- **Not on the Contabo server.**
  - One origin, no CDN, and the video traffic would compete with the app container.
  - The image would bloat, and every deploy would ship gigabytes.
  - It is kept only as a fallback if Cloudflare is not possible.
- **Later, if analytics or slow connections show the need:**
  - adaptive streaming, with HLS 1080p/720p/480p renditions;
  - or Cloudflare Stream. It is paid per minute, so it needs the owner's approval.
  - For now, progressive MP4 plus a 720p rendition (about 0.8 Mbps), picked by the reader's choice or `navigator.connection`, is enough.

## Steps (each ends at an approval gate)

1. **Design.** Show the player placement and states on the lesson page, desktop and mobile, as mockups. → *Owner picks one.*
2. **Hosting.** Confirm the DNS zone and account, and write the bucket plan. That covers:
   - the bucket's name and region;
   - the custom domain;
   - CORS, a GET/HEAD from the site's origin, needed for VTT `<track>`;
   - cache headers.

   → *Owner approves; the owner creates the bucket and token.* Never enter or display credentials; read them from env.
3. **Upload tooling.** `video/scripts/upload.py`:
   - It uploads only approved sets, and only the files the site needs: MP4s, VTTs, the poster and a trimmed manifest. No WAV masters and no SRT.
   - It verifies each file by size and SHA-256 after upload, then writes `src/content/videos.json`.
   - It runs dry by default; `--apply` actually uploads.

   → *Owner approves the dry-run listing before `--apply`.*
4. **Player.** A `LessonVideo` component:
   - a 16:9 box with the poster and a play button;
   - a language picker that follows the site language, remembers the choice, and swaps `<source>`/`<track>` while keeping the reader's place;
   - captions, speed and full screen, all built-in;
   - resume per lesson and language;
   - the lesson marked "watched" at 90%, in the existing progress store;
   - a transcript disclosure;
   - an error state with a download link.

   It also needs:
   - translations for the site's languages;
   - tests: unit tests for the manifest and index, and a Playwright smoke test on a local build covering keyboard use, captions, the language swap and resume;
   - a check that `npm run check` still passes.
5. **SEO.**
   - `VideoObject` JSON-LD on lesson pages with a video (name, description, thumbnail, duration, contentUrl, uploadDate, inLanguage).
   - Video entries in the sitemap.
   - Canonical stays the lesson URL.
6. **Security headers.** Add the media origin to the CSP `media-src`/`img-src`. → *Owner approves the nginx/Caddy diff.*
7. **Staged release.**
   - A preview build, locally or as a pull request, with the real bucket URLs and one approved lesson.
   - The owner reviews it on desktop and phone. → *Owner approves the merge to `master`, which deploys.*
8. **After release.**
   - Check range requests (`206`), caching headers, CORS on VTT, and playback on iOS Safari and Android Chrome.
   - Record what shipped in `WEBSITE_HANDOFF.md`.
   - Video production resumes only when the owner says so.

## Definition of done

- One approved lesson plays on the live site in English and Telugu, on desktop and phone.
- Captions work, the reader's place is kept, there are no console errors, and there is no third-party request.
- The lesson text loads exactly as fast as before.
- The rest of the approved sets can follow with one dry-run, then one `--apply`.
