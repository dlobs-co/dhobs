# Migration Waiter Startup Guard

**Date:** April 16, 2026  
**Issue:** `#227`  
**PR:** `#229`  
**Branch:** `feat/migration-waiter-227`  
**Status:** ✅ Merged

---

## Problem

Startup race.

After update or reboot:
- Nextcloud could start before MariaDB really ready
- Synapse could start before Postgres really ready
- migration work could collide with app boot
- result could be maintenance loops, boot errors, 502/503 noise

---

## Goal

Make startup health-aware.

Order:
1. wait for DB readiness
2. run migration / upgrade guard
3. start app

---

## What Changed

### 1. Shared waiter

New file:
- `scripts/wait-for-db.sh`

Supports:
- TCP wait
- HTTP wait

Used by:
- Nextcloud startup hook
- Nextcloud Office hook
- Matrix entrypoint

---

### 2. Nextcloud startup guard

New file:
- `config/nextcloud/startup-waiter.sh`

Behavior:
- waits for MariaDB
- checks `occ status --output=json`
- runs `occ upgrade --no-interaction` when `needsDbUpgrade=true`
- logs if maintenance mode still present

Existing file updated:
- `config/nextcloud/setup-office.sh`

Behavior:
- now uses shared waiter for Collabora reachability

---

### 3. Matrix startup guard

Updated files:
- `config/matrix/entrypoint.sh`
- `config/matrix/gen_config.py`
- `config/matrix/homeserver.yaml.tpl`

Behavior:
- waits for Postgres
- regenerates `homeserver.yaml`
- runs `update_synapse_database --database-config /data/homeserver.yaml --run-background-updates`
- runs migration helper from `/data` so signing key resolves correctly

Config cleanup:
- old `HOMESERVER_*` placeholders removed
- template now uses `MATRIX_*` keys consistently
- `MATRIX_SERVER_NAME` added for `server_name`

---

### 4. Compose gating

Updated file:
- `docker-compose.yml`

Changes:
- MariaDB healthcheck now reads secret file correctly
- `nextcloud` waits on `db: service_healthy`
- `synapse` waits on `synapse-db: service_healthy`
- waiter script mounted into Nextcloud and Synapse containers
- Nextcloud startup hook mounted before app start
- Synapse now uses dedicated entrypoint script

---

## Live Validation

Validated on real stack.

Commands used:
- `docker compose config`
- `docker compose up -d nextcloud synapse`
- full `./boom.sh` run

Observed:
- `project-s-nextcloud` healthy
- `project-s-matrix-server` healthy
- `project-s-nextcloud-db` healthy
- `project-s-matrix-db` healthy
- waiter logs present
- Nextcloud startup guard logs present
- Synapse migration logs present
- Synapse schema up to date

---

## Key Debugging Notes

Two real blockers found during live run:

### Matrix template mismatch

Old template still used:
- `${HOMESERVER_SERVER_NAME}`
- `${HOMESERVER_DB_PASS}`
- `${HOMESERVER_REG_KEY}`
- `${HOMESERVER_MAC_KEY}`
- `${HOMESERVER_FORM_KEY}`

But generator expected `MATRIX_*`.

Result:
- Synapse died on invalid unresolved config

Fix:
- align template and generator to `MATRIX_*`

### Synapse migration helper working dir

`update_synapse_database` needed signing key path resolution from `/data`.

Result:
- helper failed on missing `localhost.signing.key`

Fix:
- run helper from `/data`

---

## Files Changed

- `docker-compose.yml`
- `scripts/wait-for-db.sh`
- `config/nextcloud/startup-waiter.sh`
- `config/nextcloud/setup-office.sh`
- `config/matrix/entrypoint.sh`
- `config/matrix/gen_config.py`
- `config/matrix/homeserver.yaml.tpl`
- `.env.example`

---

## Outcome

Issue `#227` complete.

Startup path now:
- DB first
- migration guard second
- app boot last

Real stack proved healthy after normal compose run and full `boom.sh` run.
