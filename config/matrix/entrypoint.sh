#!/bin/sh
set -eu

WAITER="${HOMEFORGE_WAITER:-/usr/local/bin/wait-for-db.sh}"
MIGRATION_LOCK="/data/.migration-locks/matrix-server"

"$WAITER" tcp synapse-db 5432 90 "Synapse Postgres"

python3 /etc/synapse-config/gen_config.py
cp /etc/synapse-config/localhost.log.config /data/localhost.log.config

if command -v update_synapse_database >/dev/null 2>&1; then
    echo "[entrypoint] Applying Synapse database migrations — acquiring migration lock"
    mkdir -p "$(dirname "$MIGRATION_LOCK")"
    touch "$MIGRATION_LOCK"
    trap 'rm -f "$MIGRATION_LOCK"; echo "[entrypoint] migration lock released"' EXIT
    (
        cd /data
        update_synapse_database --database-config /data/homeserver.yaml --run-background-updates
    )
    rm -f "$MIGRATION_LOCK"
    trap - EXIT
else
    echo "[entrypoint] update_synapse_database not found; Synapse will migrate on startup"
fi

exec python -m synapse.app.homeserver -c /data/homeserver.yaml -c /data/localhost.log.config
