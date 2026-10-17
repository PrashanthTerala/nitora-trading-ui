# Step 2: hosting the lesson videos on Cloudflare R2 (for approval)

Decisions so far (2026-10-17): Cloudflare R2, in a bucket of its own, `nitora-trading-media`. (`nitora-media` already serves the stone site.) It is served on a custom domain. The `nitoratrading.com` DNS zone is on Cloudflare. The player goes inline, under the lesson header (option A).

**Nothing in this plan has been done.**
- The owner does the account steps marked **[owner]**. They need your Cloudflare login, which I never use.
- I write the tooling.
- Nothing is uploaded until you approve a dry run.

## What gets stored

| | |
|---|---|
| Files | Per lesson: each language's MP4 and WebVTT captions, `poster.jpg`, and `manifest.json` (trimmed to what the player needs). No WAV masters, SRT or `m4a`. |
| Size today | About 1.0 GB for the nine sets (the abandoned-baby set is still rendering) |
| Cost | R2's free tier covers 10 GB of storage and 10 million reads a month, and R2 never charges for egress. Expect $0 a month at this size. |
| Paths | `media.nitoratrading.com/<module>/<lesson>/<version>/<file>`, e.g. `/m02-candlestick-patterns/12-three-inside-outside/v3-20261017/12-three-inside-outside.te.mp4` |
| Versioning | A re-render gets a new version folder. Old folders stay until a cleanup you approve. A page never points at a file that changed under it. |

## The bucket

1. **Done, 2026-10-17.** The bucket was created with Wrangler on the owner's go-ahead: `wrangler r2 bucket create nitora-trading-media`.
   - Storage class: Standard.
   - Location: automatic. Cloudflare placed it in ENAM (Eastern North America). Viewers elsewhere are served from Cloudflare's cache near them once the custom domain is on.
2. **Connect the custom domain.** Either in the dashboard (bucket → *Settings* → *Custom Domains* → `media.nitoratrading.com`), or with Wrangler on the owner's approval:
   - `wrangler r2 bucket domain add nitora-trading-media --domain media.nitoratrading.com --zone-id <zone id>`.
   - The zone ID is on the `nitoratrading.com` overview page. It is not a secret.
   - Either way, Cloudflare creates the DNS record itself.
   - Leave the `r2.dev` public URL **disabled**. It's rate-limited and meant for testing.
3. **Set CORS.** Either in the dashboard (bucket → *Settings* → *CORS policy*), or with Wrangler on the owner's approval: `wrangler r2 bucket cors set nitora-trading-media --file cors.json`. The policy:

   ```json
   [
     {
       "AllowedOrigins": ["https://nitoratrading.com", "https://www.nitoratrading.com", "http://localhost:5173", "http://localhost:4173"],
       "AllowedMethods": ["GET", "HEAD"],
       "AllowedHeaders": ["Range"],
       "ExposeHeaders": ["Content-Length", "Content-Range", "Accept-Ranges", "ETag"],
       "MaxAgeSeconds": 86400
     }
   ]
   ```

   `<track>` captions are fetched with CORS, so without this they fail silently. The localhost origins are only for local preview builds.
4. **No API token needed.** The upload tool uses Wrangler under the owner's existing sign-in: `wrangler r2 object put --remote`, with `--content-type` and `--cache-control`. Wrangler takes files up to 300 MB; ours are 100 MB or less. So no access key is created, stored or handled.

## Headers on every object (set by the upload tool)

| File | `Content-Type` | `Cache-Control` |
|---|---|---|
| `.mp4` | `video/mp4` | `public, max-age=31536000, immutable` |
| `.vtt` | `text/vtt; charset=utf-8` | `public, max-age=31536000, immutable` |
| `poster.jpg` | `image/jpeg` | `public, max-age=31536000, immutable` |
| `manifest.json` | `application/json` | `public, max-age=31536000, immutable` |

The long cache is safe because the paths are versioned.

Cloudflare's edge caches these files on the custom domain. All of ours are well under its 512 MB per-file limit, and it serves byte ranges (`206`), so seeking works and playback starts before the download ends.

## The upload tool (I write this next, after your approval)

`video/scripts/upload.py`:

- **Only approved sets.** It reads each set's `manifest.json` and uploads only those marked approved for each language. Today none are, because every set says "awaiting human review". Your review approvals get recorded there first.
- **Dry run by default.** It prints every file it would upload, with its size, SHA-256, target path and headers. `--apply` uploads.
- **Verifies after upload.** It checks each object's size and checksum, then fetches one MP4 with a `Range` header from `media.nitoratrading.com` and expects `206`.
- **Writes the index.** It writes `src/content/videos.json`: lesson → version, languages, durations and file names. The site builds from that, so a lesson shows a player only when its video is really online.
- **Credentials.** It runs Wrangler, signed in as the owner, and touches no keys itself. It checks each upload against the file's MD5, which is the ETag R2 returns for a single-part upload, with a `HEAD` on the custom domain.

## What I need from you

1. **The custom domain and CORS (steps 2 and 3).** Approve me running the two Wrangler commands and give me the `nitoratrading.com` zone ID, or do both in the dashboard.
2. **Which sets are approved for publication, per language.** Every one still needs your review, and the Telugu, Hindi and Spanish also need a native speaker's.

The player is already built and tested against the local files (commits `8b3e19f` and `01a21fa`).
