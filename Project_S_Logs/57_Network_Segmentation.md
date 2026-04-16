# 57 — Network Segmentation (Issue #242)

**Date:** April 16, 2026
**Issue:** `#242`
**Branch:** `feat/network-segmentation-242`
**Status:** ⏳ PR Open

---

## Problem

15 services unnecessarily joined to the `frontend` Docker network. Only Traefik, Dashboard, and Tailscale are true entry points. The wider `frontend` membership increases blast radius: if any service is compromised, it has unnecessary reach to the ingress network.

---

## Goal

`frontend` = Traefik + Dashboard + Tailscale only.  
All other user-facing services → `backend` only.  
Traefik (on both networks) routes to services via `backend` — no disruption to routing.

---

## What Changed

Single file: `docker-compose.yml` — network membership only. No port changes, no code changes.

| Service | Before | After |
|---------|--------|-------|
| jellyfin | frontend, backend | backend |
| collabora | frontend, backend | backend |
| theia | frontend, backend | backend |
| synapse | frontend, backend, database | backend, database |
| element | frontend | backend |
| open-webui | frontend, backend | backend |
| kiwix-manager | frontend | backend |
| openvpn-ui | frontend, backend | backend |
| homeforge-backup | frontend, backend, database | backend, database |

## Unchanged

| Service | Networks | Reason |
|---------|----------|--------|
| traefik | frontend, backend | Entry point — needs both |
| dashboard | frontend, backend | Control plane entry point |
| tailscale | frontend | Remote access overlay |
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

Traefik is on `frontend` AND `backend`. It discovers services via Docker labels regardless of which shared network it uses to reach them. Moving services off `frontend` but keeping them on `backend` means Traefik routes via `backend` — identical behaviour, smaller blast radius.

Element and kiwix-manager were `frontend`-only before (no `backend`). They're now on `backend` so Traefik can route to them. Previously routing worked because they were on `frontend` with Traefik; now it works because they're on `backend` with Traefik.

---

## Out of Scope

- Port binding to `127.0.0.1` (breaks dashboard iframes — separate issue)
- Removing direct `ports:` from user-facing services (same reason)
- Any dashboard code changes

---

## Files Changed

- `docker-compose.yml`
- `Project_S_Logs/57_Network_Segmentation.md` (this file)
- `Project_S_Logs/00_Master_Implementation_Plan.md`
