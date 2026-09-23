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
        container nitora-trading-ui   ->   http://<server-ip>:8090
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
`http://<server-ip>:8090`.

The deploy job checks the running site before it reports success:

- a deep link (`/simulator`) comes back as the app, so nginx's fallback is working and
  shared lesson links will not 404;
- no file in the served bundle contains `localhost:5300`, the development address of the
  market-data service. A public build must never reach for it.

To roll back, set `TAG` in `~/nitora-trading-ui/.env` to an earlier `sha-...` tag from
the package page, then `docker compose up -d` in that directory.

## Plain HTTP, for now

Served by IP, the site is plain HTTP and browsers will mark it "Not secure". That is
tolerable for a while because the site has no accounts and no forms, and sends nothing to
the server. Lesson progress and the trade journal stay in the visitor's own browser. It
is not a permanent state: move to a domain with TLS before sending anyone the link.

## When the domain is ready

Ports 80 and 443 belong to the Caddy in the nitorastone stack, which already issues
certificates automatically. The site goes behind that Caddy rather than running a second
proxy. That means one change in **nitorastone-service** and one here.

1. **DNS.** Point an A record for the new name at the server.

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

   And in `infra/Caddyfile`, with the real name in place of `trading.example.com`:

   ```
   trading.example.com {
   	encode zstd gzip
   	reverse_proxy nitora-trading-ui:8080

   	header {
   		Strict-Transport-Security "max-age=31536000; includeSubDomains"
   		X-Content-Type-Options "nosniff"
   		Referrer-Policy "strict-origin-when-cross-origin"
   		-Server
   	}
   }
   ```

   `preload` is left off the HSTS header on purpose. Unlike the rest, it is very hard to
   undo, and it can be added once the domain has settled.

4. **Here**, `deploy/docker-compose.yml`: attach the site to the same network.

   ```yaml
   services:
     web:
       networks: [default, nitora-edge]

   networks:
     nitora-edge:
       external: true
   ```

   Then set `TRADING_BIND=127.0.0.1` in `~/nitora-trading-ui/.env`. Caddy reaches the
   container over the shared network, so the IP-and-port address can close.

Order matters. Create the network before either stack refers to it: Compose refuses to
start a service whose external network does not exist. That is also why the network is
not declared in advance.
