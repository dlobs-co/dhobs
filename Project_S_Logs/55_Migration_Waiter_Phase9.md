# 55 — Migration Waiter Phase 9: Touch-File Signal & start_period Hardening

**Date:** April 16, 2026
**Issue:** `#239`
**Branch:** `feat/phase-9-migration-waiter`
**Status:** ⏳ PR Open

---

## Problem

Three gaps remained after #227 (Migration Waiter v1.0):

1. `start_period` too short — Docker could restart Nextcloud (60s) or Synapse (30s) mid-migration, corrupting the DB
2. No "busy" signal — dashboard showed "Unhealthy" instead of "Migrating" during active upgrades
3. Dashboard blind to migration state — no way to distinguish a migrating container from a broken one

---

## Solution

### Touch-File Signal Mechanism

Waiter scripts write a lock file to `/data/.migration-locks/<service>` before running any migration, and remove it after (with `trap` ensuring cleanup on crash/signal).

Lock file names match Docker container base names after stripping `project-s-`:

| Container | Lock file |
|-----------|-----------|
| `project-s-nextcloud` | `nextcloud` |
| `project-s-matrix-server` | `matrix-server` |

Dashboard container already mounts `./data:/data:ro` — lock dir visible automatically at `/data/.migration-locks/`.

---

## What Changed

### 1. `config/nextcloud/startup-waiter.sh`

Added around `occ upgrade`:

```sh
MIGRATION_LOCK="/data/.migration-locks/nextcloud"
mkdir -p "$(dirname "$MIGRATION_LOCK")"
touch "$MIGRATION_LOCK"
trap 'rm -f "$MIGRATION_LOCK"; echo "[nextcloud-startup] migration lock released"' EXIT
$OCC upgrade --no-interaction
rm -f "$MIGRATION_LOCK"
trap - EXIT
```

Lock only acquired when `needsDbUpgrade=true` — no lock on fresh install or no-upgrade path.

### 2. `config/matrix/entrypoint.sh`

Added around `update_synapse_database`:

```sh
MIGRATION_LOCK="/data/.migration-locks/matrix-server"
mkdir -p "$(dirname "$MIGRATION_LOCK")"
touch "$MIGRATION_LOCK"
trap 'rm -f "$MIGRATION_LOCK"; echo "[entrypoint] migration lock released"' EXIT
( cd /data && update_synapse_database ... )
rm -f "$MIGRATION_LOCK"
trap - EXIT
```

### 3. `docker-compose.yml`

`start_period` bumped:

| Service | Before | After |
|---------|--------|-------|
| `project-s-nextcloud` | 60s | 300s |
| `project-s-matrix-server` | 30s | 120s |
| `project-s-matrix-db` | 30s | 60s |

Volume mounts added:
- `nextcloud`: `./data/.migration-locks:/data/.migration-locks`
- `synapse`: `./data/.migration-locks:/data/.migration-locks`

### 4. `Dashboard/Dashboard1/app/api/stats/route.ts`

`readContainerHealth()` now reads lock dir at top:

```ts
const lockDir = '/data/.migration-locks'
const migratingServices = new Set<string>()
if (fs.existsSync(lockDir)) {
  fs.readdirSync(lockDir).forEach(f => migratingServices.add(f))
}
// migration check takes priority over docker health status
if (migratingServices.has(baseName)) displayStatus = 'migrating'
```

### 5. `Dashboard/Dashboard1/components/dashboard/metrics-section.tsx`

`statusColor` and `statusLabel` handle `'migrating'`:

- Color: `#f59e0b` (amber — same as restarting, transitional not error)
- Label: `'Migrating...'`

---

## Tests Added

| File | Tests | Coverage |
|------|-------|----------|
| `__tests__/migration-lock.test.ts` | 4 | lock-dir-absent, file-absent, match, mismatch |
| `__tests__/status-display.test.ts` | 8 | statusColor + statusLabel for all states |

All 54 tests pass. Pre-existing `api-auth.test.ts` failure unrelated (requires `TEST_ADMIN_PASSWORD` env var).

---

## Manual Smoke Test

```bash
# Simulate migration
touch ./data/.migration-locks/nextcloud
# Wait 30s → dashboard shows amber "Migrating..."
rm ./data/.migration-locks/nextcloud
# Next poll → green "Running"
```

---

## Files Changed

- `docker-compose.yml`
- `config/nextcloud/startup-waiter.sh`
- `config/matrix/entrypoint.sh`
- `Dashboard/Dashboard1/app/api/stats/route.ts`
- `Dashboard/Dashboard1/components/dashboard/metrics-section.tsx`
- `Dashboard/Dashboard1/__tests__/migration-lock.test.ts`
- `Dashboard/Dashboard1/__tests__/status-display.test.ts`

---

## Outcome

Migration race condition risk eliminated. Dashboard now surfaces migration state correctly. Follows on from #227 (Log 52).
