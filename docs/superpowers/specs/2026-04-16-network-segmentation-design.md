# Network Segmentation & Port Hardening — Design Spec

**Issue:** #242
**Date:** 2026-04-16
**Branch:** `feat/network-segmentation-242`
**Scope:** Network membership tightening only (port binding hardening = separate issue)

---

## Problem

15 services unnecessarily joined to `frontend` network. Traefik + Dashboard are the only true entry points — all other services should communicate via `backend` only. Current state creates a wider blast radius if any service is compromised.

---

## Goal

`frontend` network = Traefik + Dashboard + Tailscale only.  
All user-facing services move to `backend` only.  
Traefik (on both networks) routes to services via `backend` — no disruption.

---

## Single File Changed

`docker-compose.yml` — network membership only. No port changes, no code changes.

---

## Network Changes

| Service | Container | Current Networks | New Networks |
|---------|-----------|-----------------|-------------|
| jellyfin | project-s-jellyfin | frontend, backend | **backend** |
| collabora | project-s-collabora | frontend, backend | **backend** |
| theia | project-s-theia | frontend, backend | **backend** |
| synapse | project-s-matrix-server | frontend, backend, database | **backend, database** |
| element | project-s-matrix-client | frontend | **backend** |
| open-webui | project-s-open-webui | frontend, backend | **backend** |
| kiwix-manager | project-s-kiwix-manager | frontend | **backend** |
| openvpn-ui | project-s-openvpn-ui | frontend, backend | **backend** |
| homeforge-backup | homeforge-backup | frontend, backend, database | **backend, database** |

## Unchanged

| Service | Networks | Reason |
|---------|----------|--------|
| traefik | frontend, backend | Entry point — needs both |
| dashboard | frontend, backend | Control plane entry point |
| tailscale | frontend | Remote access overlay — entry point |
| vaultwarden | backend | Already correct |
| nextcloud | backend, database | Already correct |
| ollama | backend | Already correct |
| kiwix | backend | Already correct |
| openvpn | backend | Already correct |
| socket-proxy | backend | Already correct |
| db (mariadb) | database | Already correct |
| synapse-db (postgres) | database | Already correct |

---

## Why This Is Safe

Traefik is on `frontend` AND `backend`. It discovers services via Docker labels regardless of which shared network it uses to reach them. Moving services off `frontend` but keeping them on `backend` means Traefik routes to them via `backend` — identical behaviour, smaller blast radius.

---

## Verification After Change

```bash
# Confirm traefik can still route to all services
docker compose config | grep -A5 "networks:"

# Confirm frontend has only 3 services
docker network inspect homeLabbing_frontend | grep -i "name"
```

Expected: frontend contains only traefik, dashboard, tailscale containers.

---

## Out of Scope

- Port binding to `127.0.0.1` (breaks dashboard iframes — separate issue)
- Removing direct `ports:` from user-facing services (same reason)
- Any dashboard code changes
