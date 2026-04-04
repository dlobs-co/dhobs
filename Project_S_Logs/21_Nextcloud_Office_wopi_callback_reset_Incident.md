# Nextcloud Office — wopi_callback_url Reset by occ Incident

**Date:** 2026-04-03
**Severity:** HIGH — Nextcloud Office completely broken (documents fail to load)
**Status:** RESOLVED
**Related:** Log 17 — Collabora WOPI Postmortem, Log 19 — HOMEFORGE_LAN_IP Incident

---

## 1. The Symptom

- Clicking any document in Nextcloud resulted in a loading screen that never resolved
- No visible browser error — the Collabora editor simply never appeared
- All containers were healthy and running
- WOPI URLs appeared correctly configured at first glance

---

## 2. Root Cause

**`occ richdocuments:activate-config` resets `wopi_callback_url` to autodetect as part of its routine.**

The `wopi_callback_url=http://nextcloud:80` setting (the critical Docker-internal callback URL from Log 17) was wiped when `occ richdocuments:activate-config` was run during diagnosis. The first action of that command is:

```
✓ Reset callback url autodetect
```

With `wopi_callback_url` empty, Collabora falls back to using the browser-derived WOPISrc URL for callbacks. Inside the Collabora container, that URL contains `localhost` or the LAN IP — neither of which routes to Nextcloud from within the container. The WOPI callback fails silently, and the editor never loads.

### Contributing factors during this session

1. **IP typo in `.env`** — `HOMEFORGE_LAN_IP=193.168.1.68` (should be `192.168.1.68`). This was manually set via `nano .env` with a typo. The install script only auto-detects the LAN IP if the value is empty or `localhost` — it does not validate an existing value.

2. **install.sh timed out on Nextcloud readiness** — The Nextcloud container was crash-looping due to an empty `config.php` (left over from a prior failed install run). This caused the 40-retry wait loop to exhaust, and the post-install `occ` commands (including `app:enable richdocuments` and `wopi_callback_url` configuration) never ran.

3. **Empty `config.php` crash loop** — On a previous `docker compose up`, the Nextcloud container started but crashed mid-installation, leaving a 0-byte `config.php` in `./data/nextcloud/html/config/`. On every subsequent start, the entrypoint tried to run `occ maintenance:update:htaccess` against an uninitialised instance, exiting with code 1 in under a second. Fix: delete the empty file (`sudo rm ./data/nextcloud/html/config/config.php`) and restart.

4. **Root-owned `./data/` tree** — The first `docker compose up -d` (before `install.sh` was run) created directories inside `./data/` owned by `root`. `install.sh` could not clean them, causing `rm: cannot remove './data/filebrowser/database.db': Permission denied` and aborting the script. Fix: `docker compose down && sudo rm -rf ./data/` before running `install.sh`.

5. **Host Ollama blocking port 11434** — A native `ollama` process was already running on the host, bound to `127.0.0.1:11434`. The container failed to bind the port. Fix: `kill <pid>` before starting the stack, or map the container to a different host port via `PORT_OLLAMA` in `.env`.

6. **`projects-homeforge_default` network stuck** — After `docker compose down`, the network could not be removed because a leftover container (`heuristic_montalcini`, created by an earlier manual `docker run` diagnostic attempt) was still attached. Fix: `docker rm -f heuristic_montalcini` then `docker compose down`.

---

## 3. The Fix

Re-apply `wopi_callback_url` after any run of `occ richdocuments:activate-config`:

```bash
docker exec -u www-data project-s-nextcloud php /var/www/html/occ \
    config:app:set richdocuments wopi_callback_url --value="http://nextcloud:80"
```

Verify all three WOPI URLs are correct:

```bash
docker exec -u www-data project-s-nextcloud php /var/www/html/occ config:app:get richdocuments wopi_url
docker exec -u www-data project-s-nextcloud php /var/www/html/occ config:app:get richdocuments wopi_callback_url
docker exec -u www-data project-s-nextcloud php /var/www/html/occ config:app:get richdocuments public_wopi_url
docker exec project-s-collabora printenv server_name
```

Expected output:

| Command | Expected value |
|---|---|
| `wopi_url` | `http://collabora:9980` |
| `wopi_callback_url` | `http://nextcloud:80` |
| `public_wopi_url` | `http://<LAN_IP>:9980` |
| `server_name` | `<LAN_IP>:9980` |

---

## 4. Key Rules Going Forward

1. **Never run `occ richdocuments:activate-config`** — it unconditionally resets `wopi_callback_url` to autodetect, breaking document editing in Docker bridge deployments. Use `config:app:get` to inspect and `config:app:set` to configure WOPI settings individually.

2. **After any reinstall, verify `wopi_callback_url` is set** — install.sh sets it at the end, but only if Nextcloud is ready within the timeout. If install times out, re-run the occ command manually.

3. **Never set `HOMEFORGE_LAN_IP` manually unless certain of the value** — let `install.sh` or `boom.sh` auto-detect it. If setting manually, verify with `ip route get 1.1.1.1 | awk '{print $7; exit}'`.

4. **Always `docker compose down && sudo rm -rf ./data/` before a clean reinstall** — stale root-owned files from a previous failed run will block install.sh.

5. **Stop host Ollama before starting the stack** — if `ollama` is running as a native service on the host, it blocks port 11434. Either stop it or set `PORT_OLLAMA` to a different value in `.env`.
