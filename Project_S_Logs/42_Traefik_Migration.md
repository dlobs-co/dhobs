# 42 — Traefik Migration (Issue #202)

**Date:** April 12-13, 2026  
**Author:** Basil Suhail  
**Related Issue:** #202  
**Branch:** `feat/traefik-migration`  
**PR:** #204  
**Status:** ✅ Merged to main (`f29f5b8`)

---

## Context

HomeForge used a manually-configured `nginx.conf` with 500+ lines of static proxy rules for 15 services.

**Problem:** Adding/removing services required editing `nginx.conf` by hand. This caused the Collabora crash (#197) and is a maintenance liability.

**Goal:** Replace nginx with Traefik — a modern reverse proxy that auto-discovers containers via Docker API labels. Zero-config routing.

---

## Changes Made

### 1. Removed Nginx
- Deleted `nginx` service from `docker-compose.yml`
- Nginx config preserved in git for rollback
- All port mappings (8081-8096, 443, etc.) removed from nginx

### 2. Added Traefik Service
```yaml
traefik:
  image: traefik:latest
  ports:
    - '80:80'
    - '443:443'
    - '8080:8080'  # Dashboard (debug)
  volumes:
    - socket-data:/var/run/docker.sock:ro
    - ./config/traefik/traefik.yml:/etc/traefik/traefik.yml:ro
    - ./config/traefik/acme.json:/acme.json
```

### 3. Traefik Configuration
- **`config/traefik/traefik.yml`**: Static config — Docker provider, HTTP→HTTPS redirect, JSON logging
- **`config/traefik/dynamic/middlewares.yml`**: Security headers, compression
- **`config/traefik/acme.json`**: Empty cert store (auto-generates self-signed on first run)

### 4. Socket Proxy Update
- Expanded `ALLOWED_ACCESS` to include all Docker API endpoints Traefik needs (NETWORKS, VOLUMES, SYSTEM, etc.)
- Traefik connects via `DOCKER_HOST=tcp://socket-proxy:2375`

### 5. Service Labels (10 services routed)

| Service | Traefik URL | Direct Port |
|---------|-------------|-------------|
| Dashboard | `dashboard.<IP>.nip.io` | 3069 |
| Jellyfin | `jellyfin.<IP>.nip.io` | 8096 |
| Nextcloud | `nextcloud.<IP>.nip.io` | 8081 |
| Theia | `theia.<IP>.nip.io` | 3030 |
| Element | `element.<IP>.nip.io` | 8082 |
| Vaultwarden | `vaultwarden.<IP>.nip.io` | 8083 |
| Open-WebUI | `webui.<IP>.nip.io` | 8085 |
| Kiwix Manager | `kiwix-manager.<IP>.nip.io` | 8086 |
| Collabora | `collabora.<IP>.nip.io` | 9980 |
| OpenVPN UI | `openvpn.<IP>.nip.io` | 8090 |

**Note:** Direct ports kept for dashboard iframe embedding (avoids mixed-content/CSP issues).

### 6. Rollback Script
- Created `scripts/rollback-traefik.sh`
- Restores nginx from git, stops traefik, restarts compose

### 7. Updated `boom.sh`
- Added port 443 conflict check (Traefik needs it)
- Fixed `lsof` false positive on macOS (changed `-i :443` to `-iTCP:443`)

---

## Issues Found & Fixed During Testing

### Bug 1: Traefik `PathPrefix('/')` caught ALL traffic
**Symptom:** Every request routed to dashboard login page → React Error #418  
**Root cause:** Dashboard rule `Host(...) || PathPrefix('/')` — `PathPrefix('/')` matches everything  
**Fix:** Removed catch-all. Created separate `dashboard-root` router with lowest priority (`1`).

### Bug 2: Nextcloud OVERWRITEHOST redirected to LAN IP
**Symptom:** `localhost:8081` → 302 → `http://192.168.178.108:8081/login` → timeout  
**Root cause:** `OVERWRITEHOST=192.168.178.108:8081` env var in docker-compose.yml  
**Fix:** Removed `OVERWRITEHOST` and `OVERWRITEPROTOCOL` env vars.

### Bug 3: Collabora server_name used LAN IP
**Symptom:** Documents never loaded — browser got `http://192.168.178.108:9980` URLs  
**Root cause:** `server_name=${HOMEFORGE_LAN_IP:-localhost}:9980` resolved to LAN IP  
**Fix:** Set `server_name=localhost:9980` explicitly.

### Bug 4: setup-office.sh hardcoded LAN IP in public_wopi_url
**Symptom:** Container restart re-broke WOPI URLs  
**Root cause:** `setup-office.sh` used `${HOMEFORGE_LAN_IP}` to build `public_wopi_url`  
**Fix:** Hardcoded `public_wopi_url` to `http://localhost:9980` in script.

### Bug 5: Nextcloud missing from trusted_domains
**Symptom:** Document viewer timed out — Collabora couldn't fetch files  
**Root cause:** `wopi_callback_url=http://nextcloud:80` but `nextcloud` wasn't in trusted_domains  
**Fix:** Added `trusted_domains[5]=nextcloud` to `setup-office.sh`.

### Bug 6: OpenVPN-UI crash (exit 127)
**Symptom:** Container in restart loop  
**Root cause:** Entrypoint pointed to `/opt/openvpn-ui/start.sh` (doesn't exist), actual is `/opt/start.sh`  
**Fix:** Removed custom entrypoint, uses image default.

### Bug 7: Element Matrix homeserver pointed to LAN IP
**Symptom:** Element couldn't connect to Synapse  
**Root cause:** `element-config.json` used `http://192.168.178.108:8008`  
**Fix:** Changed to `http://localhost:8008` (Synapse port exposed in docker-compose).

---

## Migration Path

### For Existing Users
1. Stop current stack: `docker compose down`
2. Pull branch: `git pull`
3. Start: `./boom.sh` or `docker compose up -d`
4. Access services via `https://<service>.<LAN-IP>.nip.io`

### Port Changes
| Old (Nginx) | New (Traefik) |
|---|---|
| `:8081` → Nextcloud | `https://nextcloud.<IP>.nip.io` |
| `:8082` → Element | `https://element.<IP>.nip.io` |
| `:8083` → Vaultwarden | `https://vaultwarden.<IP>.nip.io` |
| `:8085` → Open-WebUI | `https://webui.<IP>.nip.io` |
| `:8086` → Kiwix Manager | `https://kiwix-manager.<IP>.nip.io` |
| `:8087` → Kiwix | `https://kiwix.<IP>.nip.io` |
| `:8090` → OpenVPN UI | `https://openvpn.<IP>.nip.io` |
| `:8096` → Jellyfin | `https://jellyfin.<IP>.nip.io` |
| `:9980` → Collabora | `https://collabora.<IP>.nip.io` |
| `:3030` → Theia | `https://theia.<IP>.nip.io` |
| `:8008` → Synapse | `https://synapse.<IP>.nip.io` |

Dashboard stays at `:3069` (direct port for initial access).

---

## Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Downtime during migration | Rollback script restores nginx in <30s |
| Self-signed cert warnings | Using `nip.io` — later replace with mkcert local CA |
| WebSocket routing | Each WS service has separate router label |
| Service discovery failure | Traefik watches Docker API — auto-recover on restart |
| Port 443 conflict | `boom.sh` checks for conflicts before starting |

---

## Commits

| Commit | Description |
|--------|-------------|
| `8a43e7d` | Initial Traefik migration |
| `cda8e73` | Remove OVERWRITEHOST causing Nextcloud redirect |
| `131ac3b` | Fix Collabora server_name to localhost:9980 |
| `04684ac` | Fix WOPI setup-office.sh hardcoded LAN IP |
| `ac5313e` | Add nextcloud to trusted_domains for WOPI callbacks |
