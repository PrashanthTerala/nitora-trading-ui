# Deploying Nitora Trading Academy

The public site is a static build served by nginx in a single container. It has no
database, no secrets and no backend, so deploying it is: build an image, put it on the
server, restart one container.

```
push to master
  └─ GitHub Actions: build.yml
       test    npm run check -- typecheck, content lint, price check, engine and figure tests
       image   docker build -> ghcr.io/prashanthterala/nitora-trading-ui:latest (+ :sha-...)
       deploy  scp deploy/docker-compose.yml, then over SSH:
               docker compose pull && up -d, then smoke-test the running site

server: ~/nitora-trading-ui/docker-compose.yml   Compose project "nitora-trading"
        container nitora-trading-ui  <-  nitorastone Caddy (network nitora-edge)
                                     <-  https://nitoratrading.com
```

It runs as its own Compose project, separate from the nitorastone stack, so deploying one
can never pull, restart or break the other.

**What is not deployed:** `nitora-trading-service`, the market-data service. The public
build does not use it, and what it fetches may not be shown to anyone but its operator
(see that repository's README). Its workflow tests and publishes an image but has no
deploy job, on purpose.

## One-time setup

### GitHub

In this repository: **Settings -> Secrets and variables -> Actions**.

| Kind | Name | Value |
|---|---|---|
| Secret | `DEPLOY_HOST` | the server's address -- the same value nitorastone-ui uses |
| Secret | `DEPLOY_USER` | the SSH user -- same as nitorastone-ui |
| Secret | `DEPLOY_SSH_KEY` | the private deploy key -- same as nitorastone-ui |
| Variable | `DEPLOY_ENABLED` | `true` |

Until `DEPLOY_ENABLED` is `true`, every push still tests and publishes the image, but
nothing reaches the server. That makes it safe to push before the server is ready.

### Server

1. **Registry login.** The repository is private, so its image is too. The server pulls
   it with the same `docker login ghcr.io` it already uses for the nitorastone images.
   A classic token with `read:packages` covers every package on the account, including
   new ones. If the first deploy fails with `unauthorized` or `denied`, log in again
   with such a token.

2. **Port.** The site listens on `8090` by default. Check nothing else has it:

   ```bash
   ss -ltn | grep ':8090 '
   ```

   To use another port, create `~/nitora-trading-ui/.env` with `TRADING_PORT=8091`.
   The deploy job reads it, so its smoke test follows along.

3. **Firewall.** A port published by Docker bypasses `ufw`: Docker writes its own
   iptables rules, which are evaluated first. So `8090` is reachable even if `ufw` does
   not allow it -- and, the same way, anything else published on `0.0.0.0` is public
   whatever `ufw` says. If the Contabo control-panel firewall is enabled, allow TCP 8090
   there.

## Deploying

Push to `master`, or run **Actions -> build -> Run workflow**. Then open
<https://nitoratrading.com>.

The deploy job checks the running site before it reports success:

- a deep link (`/simulator`) comes back as the app, so nginx's fallback is working and
  shared lesson links will not 404;
- no file in the served bundle contains `localhost:5300`, the development address of the
  market-data service. A public build must never reach for it.

To roll back, set `TAG` in `~/nitora-trading-ui/.env` to an earlier `sha-...` tag from
the package page, then `docker compose up -d` in that directory.

## The domain: nitoratrading.com

The site is served at **https://nitoratrading.com**, with `www.nitoratrading.com`
redirecting to it. The name is registered with Cloudflare, which also hosts its DNS.

Ports 80 and 443 belong to the Caddy in the nitorastone stack, which issues and renews
certificates automatically. The site goes behind that Caddy rather than running a second
proxy: one change in **nitorastone-service** and one here. Do the steps in this order.

1. **DNS, in Cloudflare.** Two records, both **DNS only** (grey cloud), not proxied:

   | Type | Name | Content |
   |---|---|---|
   | A | `nitoratrading.com` (`@`) | the server's IP (the `DEPLOY_HOST` secret) |
   | A | `www` | the same IP |

   DNS only, because Caddy proves it owns the name by answering Let's Encrypt on port 80
   itself. Behind Cloudflare's proxy that challenge is intercepted, and with "Always Use
   HTTPS" it is redirected to an origin that has no certificate yet, so issuance fails.
   The proxy can be switched on later, once Caddy holds a certificate, with Cloudflare's
   SSL mode set to **Full (strict)**.

2. **A network both stacks can share.** Once, on the server:

   ```bash
   docker network create nitora-edge
   ```

3. **In nitorastone-service**, `infra/docker-compose.yml`: attach Caddy to it.

   ```yaml
   services:
     caddy:
       networks: [default, nitora-edge]

   networks:
     nitora-edge:
       external: true
   ```

   And in `infra/Caddyfile`, two site blocks:

   ```
   nitoratrading.com {
   	encode zstd gzip
   	reverse_proxy nitora-trading-ui:8080

   	header {
   		Strict-Transport-Security "max-age=31536000; includeSubDomains"
   		X-Content-Type-Options "nosniff"
   		Referrer-Policy "strict-origin-when-cross-origin"
   		-Server
   	}
   }

   www.nitoratrading.com {
   	redir https://nitoratrading.com{uri} permanent
   }
   ```

   Then recreate Caddy with the new network, in that stack's `infra` directory on the
   server: `docker compose --profile prod up -d caddy` (Caddy is in the `prod` profile, so
   without the flag Compose leaves it alone). `preload` is left off the HSTS header on purpose: unlike the rest it is very
   hard to undo, and it can be added once the domain has settled.

4. **Here**, `deploy/docker-compose.yml` attaches the site to the same network (already
   done in this repository). It must not be deployed before step 2: Compose refuses to
   start a service whose external network does not exist, which is also why the network
   is not declared in advance.

   On the server, add `TRADING_BIND=127.0.0.1` to `~/nitora-trading-ui/.env`. Caddy
   reaches the container over the shared network, so port 8090 then answers only on the
   server itself, where the deploy job's check still uses it, and the public
   IP-and-port address closes.

5. **The sitemap.** In the repository's Actions variables, set `SITE_URL` to
   `https://nitoratrading.com` (no trailing slash). The next build writes
   `sitemap.xml` from the curriculum and names it in `robots.txt`. Until then the build
   writes `robots.txt` only, because a sitemap may not list relative URLs.

6. **Check.** `https://nitoratrading.com` loads with a valid certificate and a
   `Strict-Transport-Security` header; `http://` and `www.` both land on it; a deep link
   such as `/learn/m02-candlestick-patterns/06-engulfing` loads the lesson; and
   `http://<server-ip>:8090` no longer answers from outside.
