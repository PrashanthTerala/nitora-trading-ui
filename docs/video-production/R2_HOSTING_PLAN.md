# Step 2: hosting the lesson videos on Cloudflare R2 (for approval)

Decisions so far (2026-10-17): Cloudflare R2, served on a custom domain. The `nitoratrading.com` DNS zone is on Cloudflare. The player goes inline, under the lesson header (option A).

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

1. **[owner] Create the bucket.**
   - Cloudflare dashboard → R2 → *Create bucket*, named `nitora-media`.
   - Location: *Automatic*, or the *Asia-Pacific* hint if most viewers are in India.
   - Storage class: *Standard*.
2. **[owner] Connect the custom domain.**
   - Bucket → *Settings* → *Custom Domains* → `media.nitoratrading.com`. Cloudflare creates the DNS record itself.
   - Leave the `r2.dev` public URL **disabled**. It's rate-limited and meant for testing.
3. **[owner] Set CORS.** Paste this under bucket → *Settings* → *CORS policy*:

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
4. **[owner] Create an API token.**
   - R2 → *Manage API tokens* → *Create token*.
   - Permission: *Object Read & Write*, **for this bucket only**.
   - Set it in your environment as three variables: `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID` and `R2_SECRET_ACCESS_KEY` (Windows: System → Environment Variables).
   - Don't paste them into chat, and don't put them in a file in the repo. The upload tool reads them from the environment and never prints them.

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
- **Credentials.** It uses the S3-compatible API (`boto3`, a local dev dependency only) with the three environment variables. They never appear in output or logs.

## What I need from you

1. Approve this plan. You can change the bucket name or the domain.
2. Do steps 1–4 above whenever convenient, and tell me when they're done. Don't send the credentials.
3. Tell me which sets are approved for publication, per language. Every one still needs your review, and the Telugu, Hindi and Spanish also need a native speaker's.

Meanwhile I can build the player (step 4 of the prompt) against the local files, with no account needed.
