# ADR-0005: Nginx Reverse Proxy for All User-Facing Services

**Status:** Accepted
**Date:** 2026-04-10
**Implemented:** 2026-04-10 (PR #179)

## Context

15 services expose raw ports directly to the host. There is no SSL, no centralized CSP header management, and no unified routing. An nginx configuration exists in `config/nginx/nginx.conf` but is not wired into `docker-compose.yml`.

## Decision

Add nginx as a container in `docker-compose.yml` and make it the single entry point for all user-facing services.

## Rationale

1. Centralizes SSL termination (future Let's Encrypt support)
2. Single CSP header management point — currently each service configures its own headers
3. Clean URLs (e.g., `homeforge.local/media` instead of `:8096`)
4. WebSocket upgrade support for dashboard terminal and Matrix
5. Industry standard for reverse proxying — well-documented, well-understood

## Current State

`config/nginx/nginx.conf` exists with proxy blocks for 5 of 15 services (Dashboard, Jellyfin, Nextcloud, Element, Vaultwarden). The nginx container is NOT in `docker-compose.yml`.

## Implementation

- Added nginx service to `docker-compose.yml` (image `nginx:alpine`, frontend + backend networks)
- Full proxy config for all 15 user-facing services
- WebSocket upgrade support for 6 services (dashboard terminal, Collabora, Theia, Matrix, Vaultwarden, Open-WebUI)
- Healthcheck at `/nginx-health`
- Nextcloud DAV redirects for CardDAV/CalDAV sync clients
- All existing direct ports preserved during transition

## Consequences

**Positive:**
- Single entry point for all user-facing traffic
- Centralized SSL termination
- CSP headers managed in one place
- Cleaner URLs for users

**Negative:**
- Nginx becomes a critical dependency — if it fails, all services are unreachable
- Configuration complexity for 15 services
- Must update `boom.sh` and `install.sh` to reference nginx as the primary entry point

## Migration Path

Existing users access services via direct ports. After nginx is added, both direct ports and nginx proxy will work during transition. Direct ports can be removed once users migrate.
